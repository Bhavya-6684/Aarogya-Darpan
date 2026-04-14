import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Patient from '@/models/Patient'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  // For non-patient roles (doctor, admin, etc.): return user profile from User model
  const role = (token as any).role
  if (role !== 'patient') {
    const user = await User.findById((token as any).id)
      .select('name email phone role specialization department opdFee hospitalId')
      .lean()
    return NextResponse.json({ profile: null, user })
  }

  const patient = await Patient.findOne({ userId: (token as any).id })
    .populate('userId', 'name email phone profileImage role')
    .lean()

  if (!patient) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json({ profile: patient })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const { name, phone, allergies, chronicConditions, emergencyContact, bloodGroup, address } = body

  // Update user fields
  if (name || phone) {
    await User.findByIdAndUpdate((token as any).id, {
      ...(name && { name }),
      ...(phone && { phone }),
    })
  }

  const role = (token as any).role
  if (role !== 'patient') {
    const user = await User.findById((token as any).id).lean()
    return NextResponse.json({ profile: null, user })
  }

  // Update patient fields
  const updateFields: any = {}
  if (allergies !== undefined) updateFields.allergies = allergies
  if (chronicConditions !== undefined) updateFields.chronicConditions = chronicConditions
  if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact
  if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup
  if (address !== undefined) updateFields.address = address

  const patient = await Patient.findOneAndUpdate(
    { userId: (token as any).id },
    updateFields,
    { new: true }
  ).populate('userId', 'name email phone')

  return NextResponse.json({ profile: patient })
}

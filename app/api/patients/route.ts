import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Patient from '@/models/Patient'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const uhid = searchParams.get('uhid') || ''
  const role = (token as any).role
  const hospitalId = (token as any).hospitalId

  // UHID lookup (for doctor patient access)
  if (uhid) {
    const patient = await Patient.findOne({ uhid: uhid.trim() })
      .populate('userId', 'name email phone')
      .lean()
    return NextResponse.json({ patient })
  }

  const filter: any = {}
  if (hospitalId && role !== 'patient') {
    filter.hospitalId = hospitalId
  }

  let patients = await Patient.find(filter)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  // Apply search
  if (search) {
    const s = search.toLowerCase()
    patients = patients.filter((p: any) =>
      p.uhid?.toLowerCase().includes(s) ||
      p.userId?.name?.toLowerCase().includes(s) ||
      p.userId?.email?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ patients, total: patients.length })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['hospital_admin', 'receptionist'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const { name, email, phone, dob, gender, bloodGroup, allergies, chronicConditions } = body

  const { generateUHID } = await import('@/lib/utils')

  // Check if user exists by email
  let userId
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    userId = existingUser._id
  } else {
    // Create a temp user account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: `temp_${Date.now()}`, // must reset password
      role: 'patient',
      phone: phone || '',
      hospitalId: (token as any).hospitalId,
    })
    userId = user._id
  }

  // Check if patient profile exists
  let patient = await Patient.findOne({ userId })
  if (!patient) {
    patient = await Patient.create({
      userId,
      hospitalId: (token as any).hospitalId,
      uhid: generateUHID(),
      dob: new Date(dob),
      gender,
      bloodGroup,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      emergencyContact: {},
    })
  }

  return NextResponse.json({ patient }, { status: 201 })
}

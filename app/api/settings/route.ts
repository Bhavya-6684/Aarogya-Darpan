import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Hospital from '@/models/Hospital'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (token as any).role
  if (role !== 'hospital_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const userId = (token as any).id
  const hospital = await Hospital.findOne({ adminId: userId }).lean()
  return NextResponse.json({ hospital })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (token as any).role
  if (role !== 'hospital_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const userId = (token as any).id
  const body = await req.json()

  const {
    hospitalName, hospitalCity, hospitalState, hospitalStreet,
    hospitalPincode, hospitalPhone, hospitalEmail, licenseNumber,
    departments, totalBeds, website,
  } = body

  // Build $set object with dot-notation for nested address fields
  const $set: Record<string, any> = {}
  if (hospitalName) $set['name'] = hospitalName
  if (hospitalStreet !== undefined) $set['address.street'] = hospitalStreet
  if (hospitalCity !== undefined) $set['address.city'] = hospitalCity
  if (hospitalState !== undefined) $set['address.state'] = hospitalState
  if (hospitalPincode !== undefined) $set['address.pincode'] = hospitalPincode
  if (hospitalPhone) $set['phone'] = hospitalPhone
  if (hospitalEmail) $set['email'] = hospitalEmail
  if (licenseNumber !== undefined) $set['licenseNumber'] = licenseNumber
  if (departments !== undefined) $set['departments'] = departments
  if (totalBeds !== undefined) $set['totalBeds'] = Number(totalBeds)
  if (website !== undefined) $set['website'] = website

  if (Object.keys($set).length === 0) {
    return NextResponse.json({ message: 'No changes to save' })
  }

  const hospital = await Hospital.findOneAndUpdate(
    { adminId: userId },
    { $set },
    { new: true }
  )

  if (!hospital) return NextResponse.json({ error: 'Hospital not found. Please complete initial setup.' }, { status: 404 })
  return NextResponse.json({ hospital, message: 'Settings saved successfully' })
}

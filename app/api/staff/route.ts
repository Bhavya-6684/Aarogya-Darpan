import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['hospital_admin', 'doctor', 'receptionist'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const hospitalId = (token as any).hospitalId
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const filter: any = { hospitalId, isActive: true }
  if (role) filter.role = role
  else filter.role = { $in: ['doctor', 'receptionist', 'lab_technician'] }

  const staff = await User.find(filter)
    .select('name email phone role specialization department opdFee createdAt')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const { name, email, password, role, phone, specialization, department, opdFee } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)
  const staff = await User.create({
    name, email: email.toLowerCase(), passwordHash, role,
    phone: phone || '',
    hospitalId: (token as any).hospitalId,
    specialization: specialization || '',
    department: department || '',
    opdFee: opdFee || 300,
  })

  return NextResponse.json({ staff: { _id: staff._id, name: staff.name, email: staff.email, role: staff.role } }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await User.findByIdAndUpdate(id, { isActive: false })
  return NextResponse.json({ success: true })
}

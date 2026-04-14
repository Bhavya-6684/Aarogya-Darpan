import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'
import Patient from '@/models/Patient'

function generateBillNumber() {
  const date = new Date()
  const prefix = 'INV'
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${prefix}${year}${month}${random}`
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const patientIdParam = searchParams.get('patientId')
  const status = searchParams.get('status')
  const role = (token as any).role

  const filter: any = {}

  if (role === 'patient') {
    // Patients fetch their own bills — no hospitalId in JWT
    const patient = await Patient.findOne({ userId: (token as any).id })
    if (!patient) return NextResponse.json({ bills: [] })
    filter.patientId = patient._id
  } else {
    // Staff/admin always have hospitalId
    filter.hospitalId = (token as any).hospitalId
    if (patientIdParam) filter.patientId = patientIdParam
    if (status) filter.status = status
  }

  const bills = await Bill.find(filter)
    .populate('patientId', 'uhid')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return NextResponse.json({ bills })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['hospital_admin', 'receptionist'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()

  const bill = await Bill.create({
    ...body,
    billNumber: generateBillNumber(),
    hospitalId: (token as any).hospitalId,
    createdBy: (token as any).id,
  })

  return NextResponse.json({ bill }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const { id, ...updates } = body

  const bill = await Bill.findByIdAndUpdate(id, updates, { new: true })
  return NextResponse.json({ bill })
}

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Prescription from '@/models/Prescription'
import Patient from '@/models/Patient'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  const role = (token as any).role

  const filter: any = {}

  if (patientId) {
    filter.patientId = patientId
  } else if (role === 'doctor') {
    filter.doctorId = (token as any).id
  } else if (role === 'patient') {
    const patient = await Patient.findOne({ userId: (token as any).id })
    if (!patient) return NextResponse.json({ prescriptions: [] })
    filter.patientId = patient._id
  } else if (['hospital_admin', 'receptionist'].includes(role)) {
    filter.hospitalId = (token as any).hospitalId
  } else if (role === 'pharmacy') {
    // Pharmacy sees all prescriptions — optionally filter by hospital if hospitalId bound
    const hospitalId = (token as any).hospitalId
    if (hospitalId) filter.hospitalId = hospitalId
    // else no filter — pharmacy sees all
  }
  // lab_technician: no prescriptions view needed

  const prescriptions = await Prescription.find(filter)
    .populate('patientId', 'uhid')
    .populate('doctorId', 'name specialization')
    .populate('hospitalId', 'name')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return NextResponse.json({ prescriptions })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['doctor', 'hospital_admin'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()

  // Ensure unique token
  let tokenNumber = Math.floor(100000 + Math.random() * 900000).toString()
  let exists = await Prescription.findOne({ tokenNumber })
  let attempts = 0
  while (exists && attempts < 10) {
    tokenNumber = Math.floor(100000 + Math.random() * 900000).toString()
    exists = await Prescription.findOne({ tokenNumber })
    attempts++
  }

  const prescription = await Prescription.create({
    ...body,
    tokenNumber,
    doctorId: (token as any).id,
    hospitalId: body.hospitalId || (token as any).hospitalId,
    dispensed: false,
  })

  return NextResponse.json({ prescription }, { status: 201 })
}

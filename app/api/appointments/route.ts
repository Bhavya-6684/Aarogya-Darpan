import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Appointment from '@/models/Appointment'
import Patient from '@/models/Patient'
import Notification from '@/models/Notification'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const role = (token as any).role

  const filter: any = {}

  if (role === 'patient') {
    const patient = await Patient.findOne({ userId: (token as any).id })
    if (!patient) return NextResponse.json({ appointments: [] })
    filter.patientId = patient._id
  } else if (role === 'doctor') {
    filter.doctorId = (token as any).id
  } else if (['hospital_admin', 'receptionist'].includes(role)) {
    filter.hospitalId = (token as any).hospitalId
  }

  const status = searchParams.get('status')
  if (status && status !== 'all') filter.status = status

  const today = searchParams.get('today')
  if (today) {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    filter.scheduledAt = { $gte: start, $lte: end }
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'uhid')
    .populate('doctorId', 'name specialization')
    .populate('hospitalId', 'name')
    .sort({ scheduledAt: -1 })
    .limit(200)
    .lean()

  return NextResponse.json({ appointments, total: appointments.length })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const role = (token as any).role

  let patientId = body.patientId
  // If patient is booking, use their patient profile
  if (role === 'patient') {
    const patient = await Patient.findOne({ userId: (token as any).id })
    if (!patient) return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    patientId = patient._id
  }

  const appointment = await Appointment.create({
    ...body,
    patientId,
    status: 'scheduled',
  })

  // Notify doctor
  if (body.doctorId) {
    const doctor = await User.findById(body.doctorId)
    if (doctor) {
      await Notification.create({
        userId: doctor._id,
        type: 'appointment',
        title: 'New Appointment Scheduled',
        message: `A patient has booked an OPD appointment with you.`,
        data: { appointmentId: appointment._id },
        actionable: false,
      })
    }
  }

  return NextResponse.json({ appointment }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id, ...updates } = await req.json()
  const appointment = await Appointment.findByIdAndUpdate(id, updates, { new: true })
  return NextResponse.json({ appointment })
}

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import AccessRequest from '@/models/AccessRequest'
import Notification from '@/models/Notification'
import Patient from '@/models/Patient'
import User from '@/models/User'
import Hospital from '@/models/Hospital'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const role = (token as any).role

  let requests
  if (role === 'doctor') {
    requests = await AccessRequest.find({ doctorId: (token as any).id })
      .populate('patientId', 'uhid')
      .sort({ createdAt: -1 })
      .lean()
  } else if (role === 'patient') {
    requests = await AccessRequest.find({ patientUserId: (token as any).id })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .lean()
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'doctor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { patientId, patientUhid } = await req.json()

  let patient: any
  if (patientId) {
    patient = await Patient.findById(patientId).populate('userId')
  } else if (patientUhid) {
    patient = await Patient.findOne({ uhid: patientUhid }).populate('userId')
  }

  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  // Check existing request
  const existing = await AccessRequest.findOne({
    doctorId: (token as any).id,
    patientId: patient._id,
    status: 'pending',
  })
  if (existing) return NextResponse.json({ error: 'Access request already sent' }, { status: 409 })

  const doctorUser = await User.findById((token as any).id)
  const hospital = doctorUser?.hospitalId
    ? await Hospital.findById(doctorUser.hospitalId).select('name')
    : null

  // Create request
  const request = await AccessRequest.create({
    doctorId: (token as any).id,
    doctorName: doctorUser?.name || 'Doctor',
    hospitalName: hospital?.name || '',
    patientId: patient._id,
    patientUserId: (patient.userId as any)._id || patient.userId,
  })

  // Create notification for patient
  await Notification.create({
    userId: (patient.userId as any)._id || patient.userId,
    type: 'access_request',
    title: 'Medical History Access Request',
    message: `Dr. ${doctorUser?.name} from ${hospital?.name || 'a hospital'} is requesting access to your medical history.`,
    data: { accessRequestId: request._id, doctorName: doctorUser?.name },
    actionable: true,
  })

  return NextResponse.json({ request }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'patient') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { requestId, action } = await req.json() // action: 'accepted' | 'denied'

  const request = await AccessRequest.findOneAndUpdate(
    { _id: requestId, patientUserId: (token as any).id },
    { status: action, respondedAt: new Date() },
    { new: true }
  )

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // Notify doctor
  await Notification.create({
    userId: request.doctorId,
    type: 'access_request',
    title: action === 'accepted' ? 'Access Request Accepted' : 'Access Request Denied',
    message: `The patient has ${action} your request to access their medical history.`,
    data: { patientId: request.patientId },
    actionable: false,
  })

  return NextResponse.json({ request })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'doctor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const { requestId } = await req.json()

  const request = await AccessRequest.findOneAndDelete({
    _id: requestId,
    doctorId: (token as any).id,
  })

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}

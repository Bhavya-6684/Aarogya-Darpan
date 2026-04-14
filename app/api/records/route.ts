import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Patient from '@/models/Patient'
import Prescription from '@/models/Prescription'
import LabReport from '@/models/LabReport'
import AccessRequest from '@/models/AccessRequest'

// GET /api/records?patientId=xxx — for doctors with accepted access
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (token as any).role
  if (!['doctor', 'hospital_admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  // If doctor, verify accepted access request
  if (role === 'doctor') {
    const patient = await Patient.findById(patientId)
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const access = await AccessRequest.findOne({
      doctorId: (token as any).id,
      patientId,
      status: 'accepted',
    })
    if (!access) return NextResponse.json({ error: 'No accepted access for this patient' }, { status: 403 })
  }

  const [patient, prescriptions, labReports] = await Promise.all([
    Patient.findById(patientId).populate('userId', 'name email phone').lean(),
    Prescription.find({ patientId }).populate('doctorId', 'name specialization').sort({ createdAt: -1 }).lean(),
    LabReport.find({ patientId }).populate('requestedBy', 'name').sort({ createdAt: -1 }).lean(),
  ])

  return NextResponse.json({ patient, prescriptions, labReports })
}

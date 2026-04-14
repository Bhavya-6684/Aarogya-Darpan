import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import LabReport from '@/models/LabReport'
import Patient from '@/models/Patient'
import Notification from '@/models/Notification'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const role = (token as any).role
  const patientId = searchParams.get('patientId')

  const filter: any = {}
  if (patientId) {
    filter.patientId = patientId
  } else if (role === 'patient') {
    const patient = await Patient.findOne({ userId: (token as any).id })
    if (!patient) return NextResponse.json({ reports: [] })
    filter.patientId = patient._id
  } else if (role === 'lab_technician' || role === 'hospital_admin' || role === 'doctor' || role === 'receptionist') {
    filter.hospitalId = (token as any).hospitalId
  }

  const reports = await LabReport.find(filter)
    .populate('patientId', 'uhid')
    .populate('requestedBy', 'name')
    .populate('processedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  // Flatten for easier frontend use
  const mapped = reports.map((r: any) => ({
    ...r,
    testName: r.tests?.[0]?.name || 'Lab Test',
    testType: r.tests?.[0]?.unit || '',
    result: r.tests?.[0]?.result || '',
    referenceRange: r.tests?.[0]?.referenceRange || '',
    priority: r.urgency === 'urgent' || r.urgency === 'stat' ? 'urgent' : 'normal',
    technician: r.processedBy,
  }))

  return NextResponse.json({ reports: mapped })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['doctor', 'hospital_admin', 'lab_technician'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const { patientId, testName, testType, priority, notes, hospitalId } = body

  const report = await LabReport.create({
    patientId,
    hospitalId: hospitalId || (token as any).hospitalId,
    requestedBy: (token as any).id,
    status: 'pending',
    urgency: priority === 'urgent' ? 'urgent' : 'routine',
    notes,
    tests: [{ name: testName, status: 'pending', unit: testType || '' }],
  })

  return NextResponse.json({ report }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const { id, status, result, referenceRange, notes, fileUrl } = body

  const updates: any = {}
  if (status) updates.status = status
  if (notes) updates.notes = notes
  if (fileUrl) updates.reportUrl = fileUrl

  if (status === 'completed') {
    updates.processedBy = (token as any).id
    updates.reportedAt = new Date()
    // Update first test
    updates.$set = {
      'tests.0.result': result || '',
      'tests.0.referenceRange': referenceRange || '',
      'tests.0.status': 'completed',
    }
    delete updates.status

    // Notify patient
    const report = await LabReport.findById(id).populate('patientId')
    if (report) {
      const patient = await Patient.findById(report.patientId)
      if (patient) {
        await Notification.create({
          userId: patient.userId,
          type: 'lab_result',
          title: 'Lab Report Ready',
          message: `Your lab report is ready. Check the Lab Reports section to view your results.`,
          data: { reportId: id },
          actionable: false,
        })
      }
    }
    const updated = await LabReport.findByIdAndUpdate(id, { ...updates, status: 'completed' }, { new: true })
    return NextResponse.json({ report: updated })
  }

  const report = await LabReport.findByIdAndUpdate(id, updates, { new: true })
  return NextResponse.json({ report })
}

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Patient from '@/models/Patient'
import Appointment from '@/models/Appointment'
import LabReport from '@/models/LabReport'
import Bill from '@/models/Bill'
import Prescription from '@/models/Prescription'
import Hospital from '@/models/Hospital'
import mongoose from 'mongoose'

const EMPTY = { hospital: null, stats: { totalPatients: 0, pendingLabs: 0, totalPrescriptions: 0, todayRevenue: 0, todayAppointments: 0, totalBeds: 0 }, weeklyTrend: [], appointmentsByType: [] }

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (token as any).role
    const userId = (token as any).id

    if (!['hospital_admin', 'doctor', 'receptionist', 'lab_technician', 'pharmacy'].includes(role)) {
      return NextResponse.json(EMPTY)
    }

    await connectDB()

    // Resolve hospitalId — from JWT OR look up from Hospital collection
    let hospitalId: string | null = (token as any).hospitalId?.toString() || null

    if (!hospitalId && role === 'hospital_admin') {
      const h = await Hospital.findOne({ adminId: userId }).select('_id').lean()
      if (h) hospitalId = (h as any)._id.toString()
    }

    if (!hospitalId) return NextResponse.json(EMPTY)

    let hospitalObjId: mongoose.Types.ObjectId
    try {
      hospitalObjId = new mongoose.Types.ObjectId(hospitalId)
    } catch {
      return NextResponse.json(EMPTY)
    }

    const hospital = await Hospital.findById(hospitalObjId)
      .select('name address phone email licenseNumber departments totalBeds')
      .lean()

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalPatients, pendingLabs, totalPrescriptions, todayBills,
      weeklyTrend, appointmentsByType, todayAppointments, totalBeds,
    ] = await Promise.all([
      Patient.countDocuments({ hospitalId: hospitalObjId }).catch(() => 0),
      LabReport.countDocuments({ hospitalId: hospitalObjId, status: 'pending' }).catch(() => 0),
      Prescription.countDocuments({ hospitalId: hospitalObjId }).catch(() => 0),
      Bill.find({ hospitalId: hospitalObjId, createdAt: { $gte: todayStart } }).select('paidAmount').catch(() => []),
      Appointment.aggregate([
        { $match: { hospitalId: hospitalObjId, scheduledAt: { $gte: weekAgo } } },
        { $group: { _id: { $dateToString: { format: '%a', date: '$scheduledAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).catch(() => []),
      Appointment.aggregate([
        { $match: { hospitalId: hospitalObjId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]).catch(() => []),
      Appointment.countDocuments({ hospitalId: hospitalObjId, scheduledAt: { $gte: todayStart, $lte: todayEnd } }).catch(() => 0),
      (async () => { try { const Bed = (await import('@/models/Bed')).default; return Bed.countDocuments({ hospitalId: hospitalObjId }) } catch { return 0 } })(),
    ])

    const todayRevenue = Array.isArray(todayBills)
      ? todayBills.reduce((s: number, b: any) => s + (b.paidAmount || 0), 0)
      : 0

    return NextResponse.json({
      hospital: hospital ? {
        name: (hospital as any).name,
        hospitalId,
        city: (hospital as any).address?.city,
        state: (hospital as any).address?.state,
        phone: (hospital as any).phone,
        email: (hospital as any).email,
        licenseNumber: (hospital as any).licenseNumber,
        departments: (hospital as any).departments || [],
        totalBeds: (hospital as any).totalBeds || 0,
      } : null,
      stats: { totalPatients, pendingLabs, totalPrescriptions, todayRevenue, todayAppointments, totalBeds },
      weeklyTrend,
      appointmentsByType,
    })
  } catch (err: any) {
    console.error('[Analytics API Error]', err)
    return NextResponse.json(EMPTY)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Prescription from '@/models/Prescription'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tokenNumber = searchParams.get('token')
  if (!tokenNumber) return NextResponse.json({ error: 'Token number required' }, { status: 400 })

  await connectDB()
  const prescription = await Prescription.findOne({ tokenNumber: tokenNumber.trim() })
    .populate('patientId', 'uhid')
    .populate('doctorId', 'name specialization')
    .populate('hospitalId', 'name')
    .lean()

  if (!prescription) return NextResponse.json({ error: 'No prescription found for this token' }, { status: 404 })

  return NextResponse.json({ prescription })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'pharmacy') {
    return NextResponse.json({ error: 'Forbidden — pharmacy only' }, { status: 403 })
  }

  await connectDB()
  const { tokenNumber } = await req.json()
  if (!tokenNumber) return NextResponse.json({ error: 'Token number required' }, { status: 400 })

  const prescription = await Prescription.findOneAndUpdate(
    { tokenNumber: tokenNumber.trim() },
    { dispensed: true, dispensedAt: new Date(), dispensedBy: (token as any).id },
    { new: true }
  )

  if (!prescription) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
  return NextResponse.json({ prescription, message: 'Prescription marked as dispensed' })
}

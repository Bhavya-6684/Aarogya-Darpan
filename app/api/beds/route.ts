import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Bed from '@/models/Bed'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const hospitalId = (token as any).hospitalId
  if (!hospitalId) return NextResponse.json({ beds: [] })

  const beds = await Bed.find({ hospitalId })
    .populate('patientId', 'uhid')
    .sort({ ward: 1, bedNumber: 1 })
    .lean()

  return NextResponse.json({ beds })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((token as any).role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const bed = await Bed.create({ ...body, hospitalId: (token as any).hospitalId })
  return NextResponse.json({ bed }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id, ...updates } = await req.json()
  const bed = await Bed.findByIdAndUpdate(id, updates, { new: true })
  return NextResponse.json({ bed })
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

  await Bed.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

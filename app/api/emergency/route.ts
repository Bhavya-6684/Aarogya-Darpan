import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import EmergencyRegistration from '@/models/EmergencyRegistration'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'active'

  const registrations = await EmergencyRegistration.find({
    hospitalId: (token as any).hospitalId,
    status,
  })
    .sort({ admittedAt: -1 })
    .lean()

  return NextResponse.json({ registrations })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['receptionist', 'hospital_admin'].includes((token as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const reg = await EmergencyRegistration.create({
    ...body,
    hospitalId: (token as any).hospitalId,
    createdBy: (token as any).id,
  })

  return NextResponse.json({ registration: reg }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id, ...updates } = await req.json()
  const reg = await EmergencyRegistration.findByIdAndUpdate(id, updates, { new: true })
  return NextResponse.json({ registration: reg })
}

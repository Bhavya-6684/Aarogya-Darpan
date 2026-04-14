import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import FamilyMember from '@/models/FamilyMember'
import Patient from '@/models/Patient'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const patient = await Patient.findOne({ userId: (token as any).id })
  if (!patient) return NextResponse.json({ members: [] })

  const members = await FamilyMember.find({ primaryPatientId: patient._id }).lean()
  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const patient = await Patient.findOne({ userId: (token as any).id })
  if (!patient) return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })

  const body = await req.json()
  const member = await FamilyMember.create({ ...body, primaryPatientId: patient._id })
  return NextResponse.json({ member }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await FamilyMember.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

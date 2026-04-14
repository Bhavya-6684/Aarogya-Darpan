import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Medicine from '@/models/Medicine'
import Hospital from '@/models/Hospital'
import User from '@/models/User'
import mongoose from 'mongoose'

// GET - list all medicines for this hospital
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const role = (token as any).role
  const userId = (token as any).id

  // Resolve hospitalId
  let hospitalId = (token as any).hospitalId
  if (!hospitalId && role === 'hospital_admin') {
    const hospital = await Hospital.findOne({ adminId: userId }).lean()
    if (hospital) hospitalId = (hospital as any)._id
  }

  if (!hospitalId) return NextResponse.json({ medicines: [] })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') // 'expired', 'low-stock', 'all'
  const search = searchParams.get('search') || ''

  const now = new Date()
  const query: any = { hospitalId }

  if (filter === 'expired') {
    query.expiryDate = { $lte: now }
  } else if (filter === 'expiring-soon') {
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    query.expiryDate = { $gt: now, $lte: soon }
  } else if (filter === 'low-stock') {
    query.$expr = { $lte: ['$quantity', '$minStockLevel'] }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } },
    ]
  }

  const medicines = await Medicine.find(query)
    .sort({ expiryDate: 1 })
    .lean()

  return NextResponse.json({ medicines })
}

// POST - add a new medicine
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (token as any).role
  if (!['pharmacy', 'hospital_admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const userId = (token as any).id
  let hospitalId = (token as any).hospitalId

  if (!hospitalId && role === 'hospital_admin') {
    const hospital = await Hospital.findOne({ adminId: userId }).lean()
    if (hospital) hospitalId = (hospital as any)._id
  }

  if (!hospitalId) return NextResponse.json({ error: 'No hospital associated' }, { status: 400 })

  const body = await req.json()
  const { name, genericName, category, manufacturer, batchNumber, expiryDate, quantity, minStockLevel, unitPrice, sellingPrice, unit, description } = body

  if (!name || !category || !expiryDate || quantity === undefined) {
    return NextResponse.json({ error: 'Name, category, expiry date and quantity are required' }, { status: 400 })
  }

  const medicine = await Medicine.create({
    hospitalId,
    name, genericName, category, manufacturer, batchNumber,
    expiryDate: new Date(expiryDate),
    quantity: Number(quantity),
    minStockLevel: Number(minStockLevel) || 10,
    unitPrice: Number(unitPrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    unit: unit || 'tablet',
    description,
    addedBy: userId,
  })

  return NextResponse.json({ medicine }, { status: 201 })
}

// PATCH - update quantity or details
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const { id, ...updates } = body

  const medicine = await Medicine.findByIdAndUpdate(id, updates, { new: true })
  if (!medicine) return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })

  return NextResponse.json({ medicine })
}

// DELETE - remove a medicine
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (token as any).role
  if (!['pharmacy', 'hospital_admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await Medicine.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Hospital from '@/models/Hospital'
import User from '@/models/User'

// Fully public — no auth required. Used in registration dropdown.
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const hospitalId = searchParams.get('hospitalId')

    if (hospitalId) {
      const doctors = await User.find({ hospitalId, role: 'doctor' })
        .select('name specialization opdFee department')
        .lean()
      return NextResponse.json({ doctors })
    }

    // Return all hospitals with id + name + location
    const hospitals = await Hospital.find({})
      .select('_id name address phone')
      .lean()

    const formatted = hospitals.map((h: any) => ({
      _id: h._id.toString(),
      name: h.name,
      city: h.address?.city || '',
      state: h.address?.state || '',
      phone: h.phone || '',
    }))

    return NextResponse.json({ hospitals: formatted })
  } catch (err) {
    console.error('[Hospitals Public API]', err)
    return NextResponse.json({ hospitals: [] })
  }
}

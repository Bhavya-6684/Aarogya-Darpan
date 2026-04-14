import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import Patient from '@/models/Patient'
import { generateUHID } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const {
      name, email, password, role, phone,
      // Hospital admin
      hospitalName, hospitalCity, hospitalState, hospitalStreet, hospitalPincode,
      hospitalLicenseNo, hospitalPhone,
      // Patient
      dob, gender,
      // Doctor / Staff
      hospitalId, specialization, department, opdFee,
      labDepartment,
    } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // ===== HOSPITAL ADMIN =====
    if (role === 'hospital_admin') {
      if (!hospitalName || !hospitalCity || !hospitalState) {
        return NextResponse.json({ error: 'Hospital name, city, and state are required' }, { status: 400 })
      }
      const user = await User.create({
        name, email: email.toLowerCase(), passwordHash, role, phone: phone || '',
      })
      const hospital = await Hospital.create({
        name: hospitalName,
        address: {
          street: hospitalStreet || '',
          city: hospitalCity,
          state: hospitalState,
          pincode: hospitalPincode || '',
        },
        phone: hospitalPhone || phone || '',
        email: email.toLowerCase(),
        licenseNumber: hospitalLicenseNo || undefined,
        adminId: user._id,
        departments: ['General Medicine', 'Emergency'],
        totalBeds: 0,
      })
      await User.findByIdAndUpdate(user._id, { hospitalId: hospital._id })
      return NextResponse.json({ message: 'Hospital admin registered successfully' }, { status: 201 })
    }

    // ===== PATIENT =====
    if (role === 'patient') {
      if (!dob || !gender) {
        return NextResponse.json({ error: 'Date of birth and gender required' }, { status: 400 })
      }
      const user = await User.create({
        name, email: email.toLowerCase(), passwordHash, role, phone: phone || '',
      })
      await Patient.create({
        userId: user._id,
        uhid: generateUHID(),
        dob: new Date(dob),
        gender,
        allergies: [],
        chronicConditions: [],
        emergencyContact: {},
      })
      return NextResponse.json({ message: 'Patient registered successfully' }, { status: 201 })
    }

    // ===== DOCTOR =====
    if (role === 'doctor') {
      const user = await User.create({
        name, email: email.toLowerCase(), passwordHash, role, phone: phone || '',
        hospitalId: hospitalId || undefined,
        specialization: specialization || '',
        department: department || '',
        opdFee: Number(opdFee) || 300,
      })
      return NextResponse.json({ message: 'Doctor registered successfully', userId: user._id }, { status: 201 })
    }

    // ===== PHARMACY =====
    if (role === 'pharmacy') {
      const user = await User.create({
        name, email: email.toLowerCase(), passwordHash, role, phone: phone || '',
        hospitalId: hospitalId || undefined,
      })
      return NextResponse.json({ message: 'Pharmacy registered successfully', userId: user._id }, { status: 201 })
    }

    // ===== RECEPTIONIST / LAB TECHNICIAN =====
    const user = await User.create({
      name, email: email.toLowerCase(), passwordHash, role, phone: phone || '',
      hospitalId: hospitalId || undefined,
      department: labDepartment || department || '',
    })
    return NextResponse.json({ message: 'Account registered successfully', userId: user._id }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

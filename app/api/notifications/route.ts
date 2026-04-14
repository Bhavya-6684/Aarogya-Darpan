import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/db'
import Notification from '@/models/Notification'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const notifications = await Notification.find({ userId: (token as any).id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const unreadCount = notifications.filter(n => !n.read).length
  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id, markAllRead } = await req.json()

  if (markAllRead) {
    await Notification.updateMany({ userId: (token as any).id }, { read: true })
    return NextResponse.json({ success: true })
  }

  if (id) {
    await Notification.findByIdAndUpdate(id, { read: true })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}

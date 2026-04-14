'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Bell, CheckCircle, XCircle, AlertTriangle, FlaskConical,
  Calendar, Loader2, Check, X, UserCheck, Activity
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'

const TYPE_ICON: Record<string, any> = {
  access_request: UserCheck,
  lab_result: FlaskConical,
  appointment: Calendar,
  default: Bell,
}
const TYPE_COLOR: Record<string, string> = {
  access_request: '#3b82f6',
  lab_result: '#8b5cf6',
  appointment: '#10b981',
  default: '#6b7280',
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    try {
      const { data } = await axios.get('/api/notifications')
      setNotifications(data.notifications || [])
    } catch { toast.error('Could not load notifications') }
    finally { setLoading(false) }
  }

  async function markAllRead() {
    await axios.patch('/api/notifications', { markAllRead: true })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All marked as read')
  }

  async function markRead(id: string) {
    await axios.patch('/api/notifications', { id })
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
  }

  async function respondToAccessRequest(notif: any, action: 'accepted' | 'denied') {
    const requestId = notif.data?.accessRequestId
    if (!requestId) return toast.error('Invalid request')
    setActioning(notif._id)
    try {
      await axios.patch('/api/access-requests', { requestId, action })
      toast.success(action === 'accepted' ? 'Access granted' : 'Access denied')
      markRead(notif._id)
      fetchNotifications()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to respond')
    } finally { setActioning(null) }
  }

  const unread = notifications.filter(n => !n.read).length

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(13,148,136,0.1)' }}>
              <Bell className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No notifications yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Appointment updates, lab results, and access requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const Icon = TYPE_ICON[notif.type] || TYPE_ICON.default
            const color = TYPE_COLOR[notif.type] || TYPE_COLOR.default
            const isAccessRequest = notif.type === 'access_request' && notif.actionable && role === 'patient'
            const isPending = isAccessRequest && !notif.read

            return (
              <div
                key={notif._id}
                className="card-new p-4 transition-all"
                style={{
                  borderLeft: `3px solid ${notif.read ? 'transparent' : color}`,
                  opacity: notif.read ? 0.75 : 1,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{notif.title}</p>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{notif.message}</p>

                    {/* Access request action buttons */}
                    {isAccessRequest && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => respondToAccessRequest(notif, 'accepted')}
                          disabled={actioning === notif._id || notif.read}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: notif.read ? 'var(--card-bg)' : 'rgba(16,185,129,0.15)',
                            color: notif.read ? 'var(--text-muted)' : '#10b981',
                            border: '1px solid',
                            borderColor: notif.read ? 'var(--border)' : 'rgba(16,185,129,0.3)',
                          }}
                        >
                          {actioning === notif._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          {notif.read ? 'Responded' : 'Accept'}
                        </button>
                        {!notif.read && (
                          <button
                            onClick={() => respondToAccessRequest(notif, 'denied')}
                            disabled={actioning === notif._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.25)',
                            }}
                          >
                            <XCircle className="w-3 h-3" /> Deny
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {!notif.read && (
                    <button onClick={() => markRead(notif._id)} className="flex-shrink-0 p-1 rounded opacity-50 hover:opacity-100">
                      <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

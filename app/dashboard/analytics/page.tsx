'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  BarChart3, TrendingUp, Users, FileText, FlaskConical,
  IndianRupee, Calendar, Loader2, Activity
} from 'lucide-react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  async function fetchAnalytics() {
    try {
      const { data: d } = await axios.get('/api/analytics')
      setData(d)
    } catch { toast.error('Could not load analytics') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  )

  const stats = data?.stats || {}
  const hospital = data?.hospital || {}
  const weeklyTrend = data?.weeklyTrend || []
  const byType = data?.appointmentsByType || []

  const maxWeekly = Math.max(...weeklyTrend.map((w: any) => w.count), 1)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Reports & Analytics</h2>
        <p className="page-subtitle">Hospital performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid mb-6">
        {[
          { icon: Users, label: 'Total Patients', value: stats.totalPatients ?? 0, color: '#0d9488', sub: 'Registered' },
          { icon: FileText, label: 'Prescriptions', value: stats.totalPrescriptions ?? 0, color: '#3b82f6', sub: 'Created' },
          { icon: FlaskConical, label: 'Pending Labs', value: stats.pendingLabs ?? 0, color: '#f59e0b', sub: 'Awaiting results' },
          { icon: IndianRupee, label: "Today's Revenue", value: `₹${(stats.todayRevenue ?? 0).toLocaleString('en-IN')}`, color: '#10b981', sub: 'Collected' },
          { icon: Calendar, label: "Today's Appointments", value: stats.todayAppointments ?? 0, color: '#8b5cf6', sub: 'Scheduled' },
          { icon: Activity, label: 'Total Beds', value: stats.totalBeds ?? 0, color: '#ef4444', sub: 'In hospital' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="stat-card-new">
            <div className="stat-icon" style={{ background: `${color}15` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
            <p className="stat-sublabel">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly appointment trend */}
        <div className="card-new p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            Weekly Appointment Trend
          </h3>
          {weeklyTrend.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No appointment data for this week.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {weeklyTrend.map((w: any) => (
                <div key={w._id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${(w.count / maxWeekly) * 100}%`,
                      minHeight: '4px',
                      background: 'linear-gradient(180deg, var(--brand), rgba(13,148,136,0.3))',
                    }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{w._id}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{w.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointments by type */}
        <div className="card-new p-6">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Appointments by Type</h3>
          {byType.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No appointment data yet.</p>
          ) : (
            <div className="space-y-3">
              {byType.map((t: any) => {
                const total = byType.reduce((s: number, b: any) => s + b.count, 0)
                const pct = Math.round((t.count / total) * 100)
                return (
                  <div key={t._id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t._id}</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{t.count} ({pct}%)</p>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--brand)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

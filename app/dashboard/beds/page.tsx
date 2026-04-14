'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  BedDouble, Plus, X, Loader2, CheckCircle, AlertCircle,
  Wrench, User, Search, Trash2
} from 'lucide-react'

const BED_TYPES = ['general', 'ICU', 'HDU', 'private', 'pediatric']
const STATUS_STYLE: Record<string, any> = {
  available: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Available', icon: CheckCircle },
  occupied: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Occupied', icon: User },
  maintenance: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Maintenance', icon: Wrench },
}
const TYPE_COLOR: Record<string, string> = {
  general: '#0d9488', ICU: '#ef4444', HDU: '#f59e0b', private: '#8b5cf6', pediatric: '#3b82f6',
}

export default function BedsPage() {
  const [beds, setBeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const [form, setForm] = useState({
    ward: '', bedNumber: '', type: 'general', floor: '', dailyRate: '0',
  })

  useEffect(() => { fetchBeds() }, [])

  async function fetchBeds() {
    try {
      const { data } = await axios.get('/api/beds')
      setBeds(data.beds || [])
    } catch { toast.error('Could not load beds') }
    finally { setLoading(false) }
  }

  async function addBed() {
    if (!form.ward || !form.bedNumber || !form.type) return toast.error('Ward, bed number, and type required')
    setAdding(true)
    try {
      await axios.post('/api/beds', { ...form, dailyRate: parseFloat(form.dailyRate) || 0 })
      toast.success('Bed added!')
      setShowAdd(false)
      setForm({ ward: '', bedNumber: '', type: 'general', floor: '', dailyRate: '0' })
      fetchBeds()
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setAdding(false) }
  }

  async function updateStatus(id: string, status: string) {
    await axios.patch('/api/beds', { id, status })
    toast.success('Status updated')
    fetchBeds()
  }

  async function deleteBed(id: string) {
    if (!confirm('Delete this bed?')) return
    await axios.delete(`/api/beds?id=${id}`)
    toast.success('Bed removed')
    setBeds(prev => prev.filter(b => b._id !== id))
  }

  const filtered = beds.filter(b => {
    const ms = filterStatus === 'all' || b.status === filterStatus
    const mt = filterType === 'all' || b.type === filterType
    return ms && mt
  })

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Bed Management</h2>
          <p className="page-subtitle">Monitor and manage hospital bed availability</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Bed
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Beds', value: stats.total, color: '#3b82f6' },
          { label: 'Available', value: stats.available, color: '#10b981' },
          { label: 'Occupied', value: stats.occupied, color: '#ef4444' },
          { label: 'Maintenance', value: stats.maintenance, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card-new">
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      {stats.total > 0 && (
        <div className="card-new p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Occupancy Rate</p>
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
              {Math.round((stats.occupied / stats.total) * 100)}%
            </p>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${(stats.occupied / stats.total) * 100}%`, background: 'linear-gradient(90deg, var(--brand), #3b82f6)' }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'available', 'occupied', 'maintenance'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: filterStatus === s ? 'var(--brand)' : 'transparent',
              color: filterStatus === s ? 'white' : 'var(--text-muted)',
              borderColor: filterStatus === s ? 'var(--brand)' : 'var(--border)',
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="w-px" style={{ background: 'var(--border)' }} />
        {['all', ...BED_TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: filterType === t ? (TYPE_COLOR[t] || 'var(--brand)') : 'transparent',
              color: filterType === t ? 'white' : 'var(--text-muted)',
              borderColor: filterType === t ? (TYPE_COLOR[t] || 'var(--brand)') : 'var(--border)',
            }}>
            {t === 'all' ? 'All Types' : t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-16">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <BedDouble className="w-6 h-6" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>No beds registered</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-3">Add First Bed</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(bed => {
            const st = STATUS_STYLE[bed.status] || STATUS_STYLE.available
            const StatusIcon = st.icon
            const typeColor = TYPE_COLOR[bed.type] || '#0d9488'
            return (
              <div key={bed._id} className="card-new p-4 relative group"
                style={{ borderTop: `3px solid ${typeColor}` }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                      Bed {bed.bedNumber}
                    </p>
                    <p className="text-xs font-semibold uppercase" style={{ color: typeColor }}>{bed.type}</p>
                  </div>
                  <button onClick={() => deleteBed(bed._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: '#ef4444' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  {bed.ward}{bed.floor ? ` · Floor ${bed.floor}` : ''}
                </p>

                <div className="flex items-center gap-1.5 mb-3">
                  <StatusIcon className="w-3.5 h-3.5" style={{ color: st.color }} />
                  <span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
                </div>

                {bed.dailyRate > 0 && (
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>₹{bed.dailyRate}/day</p>
                )}

                {/* Status change */}
                {bed.status !== 'occupied' && (
                  <button onClick={() => updateStatus(bed._id, 'occupied')}
                    className="w-full text-xs py-1.5 rounded-lg transition-all font-medium"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    Mark Occupied
                  </button>
                )}
                {bed.status === 'occupied' && (
                  <button onClick={() => updateStatus(bed._id, 'available')}
                    className="w-full text-xs py-1.5 rounded-lg transition-all font-medium"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    Mark Available
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Bed Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Add New Bed</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">BED TYPE *</label>
                <div className="grid grid-cols-3 gap-2">
                  {BED_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{
                        background: form.type === t ? `${TYPE_COLOR[t]}20` : 'transparent',
                        color: form.type === t ? TYPE_COLOR[t] : 'var(--text-muted)',
                        borderColor: form.type === t ? TYPE_COLOR[t] : 'var(--border)',
                      }}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">WARD *</label>
                  <input className="input-field" placeholder="e.g. General Ward A" value={form.ward}
                    onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
                </div>
                <div>
                  <label className="label">BED NUMBER *</label>
                  <input className="input-field" placeholder="e.g. A-12" value={form.bedNumber}
                    onChange={e => setForm(f => ({ ...f, bedNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="label">FLOOR</label>
                  <input className="input-field" placeholder="e.g. 2" value={form.floor}
                    onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
                </div>
                <div>
                  <label className="label">DAILY RATE (₹)</label>
                  <input type="number" className="input-field" placeholder="0" value={form.dailyRate}
                    onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))} />
                </div>
              </div>
              <button onClick={addBed} disabled={adding} className="btn-primary w-full">
                {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Bed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

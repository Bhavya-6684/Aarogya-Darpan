'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Users, Plus, Search, X, Loader2, UserCog, Stethoscope,
  ClipboardList, Beaker, Phone, Mail, Edit2, Trash2,
  IndianRupee, Building2, CheckCircle
} from 'lucide-react'

const ROLE_CONFIG: Record<string, any> = {
  doctor: { label: 'Doctor', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: Stethoscope },
  receptionist: { label: 'Receptionist', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
  lab_technician: { label: 'Lab Technician', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: Beaker },
}

export default function StaffPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'doctor',
    phone: '', specialization: '', department: '', opdFee: '300',
  })

  useEffect(() => { fetchStaff() }, [])

  async function fetchStaff() {
    try {
      const { data } = await axios.get('/api/staff')
      setStaff(data.staff || [])
    } catch { toast.error('Could not load staff') }
    finally { setLoading(false) }
  }

  async function addStaff() {
    if (!form.name || !form.email || !form.password || !form.role) {
      return toast.error('Name, email, password and role are required')
    }
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setAdding(true)
    try {
      await axios.post('/api/staff', { ...form, opdFee: parseFloat(form.opdFee) || 300 })
      toast.success(`${ROLE_CONFIG[form.role]?.label || form.role} added successfully!`)
      setShowAdd(false)
      setForm({ name: '', email: '', password: '', role: 'doctor', phone: '', specialization: '', department: '', opdFee: '300' })
      fetchStaff()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add staff')
    } finally { setAdding(false) }
  }

  async function removeStaff(id: string, name: string) {
    if (!confirm(`Remove ${name} from staff?`)) return
    await axios.delete(`/api/staff?id=${id}`)
    toast.success('Staff member removed')
    setStaff(prev => prev.filter(s => s._id !== id))
  }

  const filtered = staff.filter(s => {
    const matchRole = filterRole === 'all' || s.role === filterRole
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Doctors & Staff</h2>
          <p className="page-subtitle">Manage your hospital team</p>
        </div>
        {role === 'hospital_admin' && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(ROLE_CONFIG).map(([r, cfg]) => {
          const count = staff.filter(s => s.role === r).length
          const Icon = cfg.icon
          return (
            <div key={r} className="stat-card-new cursor-pointer" onClick={() => setFilterRole(r === filterRole ? 'all' : r)}
              style={{ borderColor: filterRole === r ? cfg.color : 'transparent', borderWidth: '2px' }}>
              <div className="stat-icon" style={{ background: cfg.bg }}>
                <Icon className="w-5 h-5" style={{ color: cfg.color }} />
              </div>
              <p className="stat-value">{count}</p>
              <p className="stat-label">{cfg.label}s</p>
            </div>
          )
        })}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-10" placeholder="Search by name, specialization..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'doctor', 'receptionist', 'lab_technician'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: filterRole === r ? 'var(--brand)' : 'transparent',
                color: filterRole === r ? 'white' : 'var(--text-muted)',
                borderColor: filterRole === r ? 'var(--brand)' : 'var(--border)',
              }}>
              {r === 'all' ? 'All' : r === 'lab_technician' ? 'Lab' : ROLE_CONFIG[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <UserCog className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No staff registered</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add doctors, receptionists, and lab technicians.</p>
            {role === 'hospital_admin' && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">Add First Staff Member</button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => {
            const cfg = ROLE_CONFIG[s.role] || { label: s.role, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: Users }
            const Icon = cfg.icon
            return (
              <div key={s._id} className="card-new p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: cfg.color }}>
                      {s.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>
                        {s.role === 'doctor' ? `Dr. ${s.name}` : s.name}
                      </p>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-0.5"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                  </div>
                  {role === 'hospital_admin' && (
                    <button onClick={() => removeStaff(s._id, s.name)}
                      className="p-1.5 rounded-lg opacity-50 hover:opacity-100"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {s.specialization && (
                    <div>
                      <p className="label">SPECIALIZATION</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.specialization}</p>
                    </div>
                  )}
                  {s.department && (
                    <div>
                      <p className="label">DEPARTMENT</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.department}</p>
                    </div>
                  )}
                  {s.role === 'doctor' && (
                    <div>
                      <p className="label">OPD FEE</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>₹{s.opdFee || 300}</p>
                    </div>
                  )}
                  {s.phone && (
                    <div>
                      <p className="label">PHONE</p>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{s.phone}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="label">EMAIL</p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{s.email}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Add Staff Member</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">ROLE *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROLE_CONFIG).map(([r, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                        className="p-3 rounded-xl border text-center transition-all"
                        style={{
                          background: form.role === r ? `${cfg.color}15` : 'var(--card-bg)',
                          borderColor: form.role === r ? cfg.color : 'var(--border)',
                        }}>
                        <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: cfg.color }} />
                        <p className="text-xs font-semibold" style={{ color: form.role === r ? cfg.color : 'var(--text-muted)' }}>{cfg.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">FULL NAME *</label>
                  <input className="input-field" placeholder="Dr. John Smith" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">PHONE</label>
                  <input className="input-field" placeholder="+91..." value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">EMAIL *</label>
                  <input type="email" className="input-field" placeholder="staff@hospital.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">PASSWORD *</label>
                  <input type="password" className="input-field" placeholder="Min. 8 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {form.role === 'doctor' && (
                  <>
                    <div>
                      <label className="label">SPECIALIZATION</label>
                      <input className="input-field" placeholder="e.g. Cardiology" value={form.specialization}
                        onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">OPD FEE (₹)</label>
                      <input type="number" className="input-field" placeholder="300" value={form.opdFee}
                        onChange={e => setForm(f => ({ ...f, opdFee: e.target.value }))} />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="label">DEPARTMENT</label>
                  <input className="input-field" placeholder="e.g. General Medicine" value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>

              <button onClick={addStaff} disabled={adding} className="btn-primary w-full">
                {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

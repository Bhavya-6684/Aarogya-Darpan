'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  AlertTriangle, Plus, X, Loader2, BedDouble, User, Clock,
  CheckCircle, ArrowRight, Search, Hash, MapPin
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

function generateTempId() {
  const num = Math.floor(1000 + Math.random() * 9000)
  const letters = 'ABCDE'[Math.floor(Math.random() * 5)]
  return `TMP-${letters}${num}-BED`
}

export default function EmergencyPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    patientName: '', age: '', gender: '', chiefComplaint: '',
    bedNumber: '', ward: '', attendantName: '', attendantPhone: '',
    condition: 'stable',
  })

  // Store temp registrations in state (localStorage based for demo)
  useEffect(() => {
    const stored = localStorage.getItem('emergency_regs')
    if (stored) {
      try { setRegistrations(JSON.parse(stored)) } catch { }
    }
    setLoading(false)
  }, [])

  function save(regs: any[]) {
    setRegistrations(regs)
    localStorage.setItem('emergency_regs', JSON.stringify(regs))
  }

  async function createRegistration() {
    if (!form.patientName || !form.chiefComplaint || !form.bedNumber) {
      return toast.error('Patient name, complaint, and bed number are required')
    }
    setCreating(true)
    try {
      const tempId = generateTempId()
      const reg = {
        id: Date.now().toString(),
        tempId,
        ...form,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: session?.user?.name,
      }
      const updated = [reg, ...registrations]
      save(updated)
      toast.success(`Emergency registration created! Temp ID: ${tempId}`)
      setShowNew(false)
      setForm({ patientName: '', age: '', gender: '', chiefComplaint: '', bedNumber: '', ward: '', attendantName: '', attendantPhone: '', condition: 'stable' })
    } catch { toast.error('Failed to create registration') }
    finally { setCreating(false) }
  }

  function convertToPermanent(id: string) {
    if (!confirm('Mark this as converted to permanent patient ID? This will remove from emergency queue.')) return
    const updated = registrations.map(r => r.id === id ? { ...r, status: 'converted', convertedAt: new Date().toISOString() } : r)
    save(updated)
    toast.success('Registration converted to permanent patient ID')
  }

  function discharge(id: string) {
    if (!confirm('Discharge this patient from emergency?')) return
    const updated = registrations.map(r => r.id === id ? { ...r, status: 'discharged', dischargedAt: new Date().toISOString() } : r)
    save(updated)
    toast.success('Patient discharged')
  }

  const active = registrations.filter(r => r.status === 'active')
  const resolved = registrations.filter(r => r.status !== 'active')

  const CONDITION_STYLE: Record<string, any> = {
    stable: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Stable' },
    critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Critical' },
    serious: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Serious' },
    observation: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Under Observation' },
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Emergency Registration</h2>
          <p className="page-subtitle">Create temporary bed IDs for emergency patients</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <Plus className="w-4 h-4" /> New Emergency Patient
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active', value: active.length, color: '#ef4444' },
          { label: 'Converted', value: registrations.filter(r => r.status === 'converted').length, color: '#10b981' },
          { label: 'Discharged', value: registrations.filter(r => r.status === 'discharged').length, color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card-new">
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Active registrations */}
      <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>ACTIVE EMERGENCY PATIENTS ({active.length})</h3>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : active.length === 0 ? (
        <div className="card-new mb-6">
          <div className="empty-state py-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>No active emergency patients</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {active.map(r => {
            const cond = CONDITION_STYLE[r.condition] || CONDITION_STYLE.stable
            return (
              <div key={r.id} className="card-new p-5" style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: '#ef4444' }}>
                      {r.patientName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold" style={{ color: 'var(--text)' }}>{r.patientName}</p>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.gender}{r.age ? `, ${r.age}y` : ''}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: cond.bg, color: cond.color }}>{cond.label}</span>
                      </div>
                      <p className="font-mono text-sm mt-1 font-bold" style={{ color: '#ef4444' }}>{r.tempId}</p>
                      <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <BedDouble className="w-3.5 h-3.5" /> Bed {r.bedNumber}{r.ward ? ` · ${r.ward}` : ''}
                      </p>
                      <p className="text-sm mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>"{r.chiefComplaint}"</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Registered: {formatDateTime(r.createdAt)} by {r.createdBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => convertToPermanent(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <ArrowRight className="w-3 h-3" /> Convert to Permanent
                    </button>
                    <button onClick={() => discharge(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }}>
                      <CheckCircle className="w-3 h-3" /> Discharge
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <>
          <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>RESOLVED ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.map(r => (
              <div key={r.id} className="card-new p-4 opacity-60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.patientName}</p>
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.tempId}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: r.status === 'converted' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                      color: r.status === 'converted' ? '#10b981' : '#6b7280',
                    }}>
                    {r.status === 'converted' ? 'Converted' : 'Discharged'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New Registration Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Emergency Registration</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>A temporary bed ID will be auto-generated</p>
              </div>
              <button onClick={() => setShowNew(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">PATIENT NAME *</label>
                  <input className="input-field" placeholder="Patient name" value={form.patientName}
                    onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">AGE</label>
                  <input className="input-field" placeholder="Years" value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                </div>
                <div>
                  <label className="label">GENDER</label>
                  <select className="input-field" value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="label">CONDITION</label>
                  <select className="input-field" value={form.condition}
                    onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    <option value="stable">Stable</option>
                    <option value="serious">Serious</option>
                    <option value="critical">Critical</option>
                    <option value="observation">Observation</option>
                  </select>
                </div>
                <div>
                  <label className="label">BED NUMBER *</label>
                  <input className="input-field" placeholder="e.g. A-12" value={form.bedNumber}
                    onChange={e => setForm(f => ({ ...f, bedNumber: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">WARD / DEPARTMENT</label>
                <input className="input-field" placeholder="e.g. Casualty Ward" value={form.ward}
                  onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
              </div>
              <div>
                <label className="label">CHIEF COMPLAINT *</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Describe the emergency..."
                  value={form.chiefComplaint} onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ATTENDANT NAME</label>
                  <input className="input-field" placeholder="Family member name" value={form.attendantName}
                    onChange={e => setForm(f => ({ ...f, attendantName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">ATTENDANT PHONE</label>
                  <input className="input-field" placeholder="+91..." value={form.attendantPhone}
                    onChange={e => setForm(f => ({ ...f, attendantPhone: e.target.value }))} />
                </div>
              </div>
              <button onClick={createRegistration} disabled={creating} className="btn-primary w-full"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><AlertTriangle className="w-4 h-4" /> Create Emergency Registration</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

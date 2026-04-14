'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  FileText, Plus, X, Loader2, Search, Pill, Clock, Hash,
  Stethoscope, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Eye, Edit2, Save, Trash2, UserSearch
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function PrescriptionsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // Create form
  const [form, setForm] = useState({
    patientUhid: '', diagnosis: '', symptoms: '',
    notes: '', followUpDate: '',
    vitals: { bp: '', pulse: '', temp: '', weight: '', spO2: '' },
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
  })
  const [patientFound, setPatientFound] = useState<any>(null)
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => { fetchPrescriptions() }, [role])

  async function fetchPrescriptions() {
    try {
      const { data } = await axios.get('/api/prescriptions')
      setPrescriptions(data.prescriptions || [])
    } catch { toast.error('Could not load prescriptions') }
    finally { setLoading(false) }
  }

  async function lookupPatient() {
    if (!form.patientUhid.trim()) return
    setLookingUp(true)
    setPatientFound(null)
    try {
      const { data } = await axios.get(`/api/patients?uhid=${form.patientUhid.trim()}`)
      if (data.patient) setPatientFound(data.patient)
      else toast.error('Patient not found')
    } catch { toast.error('Lookup failed') }
    finally { setLookingUp(false) }
  }

  function addMedicine() {
    setForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }] }))
  }
  function removeMedicine(i: number) {
    setForm(f => ({ ...f, medicines: f.medicines.filter((_, j) => j !== i) }))
  }
  function updateMedicine(i: number, field: string, val: string) {
    setForm(f => {
      const meds = [...f.medicines]
      meds[i] = { ...meds[i], [field]: val }
      return { ...f, medicines: meds }
    })
  }

  async function createPrescription() {
    if (!patientFound) return toast.error('Look up a patient first')
    if (!form.diagnosis) return toast.error('Diagnosis is required')
    if (form.medicines.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      return toast.error('Fill all medicine fields')
    }
    setCreating(true)
    try {
      const { data } = await axios.post('/api/prescriptions', {
        patientId: patientFound._id,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes: form.notes,
        followUpDate: form.followUpDate || undefined,
        vitals: form.vitals,
        medicines: form.medicines,
      })
      toast.success(`Prescription created! Token: ${data.prescription.tokenNumber}`, { duration: 6000 })
      setShowCreate(false)
      setForm({ patientUhid: '', diagnosis: '', symptoms: '', notes: '', followUpDate: '', vitals: { bp: '', pulse: '', temp: '', weight: '', spO2: '' }, medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }] })
      setPatientFound(null)
      fetchPrescriptions()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create prescription')
    } finally { setCreating(false) }
  }

  const filtered = prescriptions.filter(p =>
    !search ||
    p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    p.tokenNumber?.includes(search) ||
    p.patientId?.uhid?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctorId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Prescriptions</h2>
          <p className="page-subtitle">
            {role === 'patient' ? 'Prescriptions received from your doctors' :
             role === 'doctor' ? 'Prescriptions you have created' :
             role === 'pharmacy' ? 'All prescription records' :
             'Hospital prescription records'}
          </p>
        </div>
        {['doctor', 'hospital_admin'].includes(role) && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Prescription
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input-field pl-10" placeholder="Search by diagnosis, token, patient ID..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <FileText className="w-7 h-7 text-blue-500" />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No prescriptions found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {role === 'patient' ? 'Prescriptions from doctors will appear here.' : 'Create a prescription to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p._id} className="card-new overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.1)' }}>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{p.diagnosis}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.dispensed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.dispensed ? 'Dispensed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {p.doctorId?.name ? `Dr. ${p.doctorId.name}` : 'Doctor'}{p.doctorId?.specialization ? ` · ${p.doctorId.specialization}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--brand)' }}>
                          <Hash className="w-3 h-3" /> {p.tokenNumber}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                        {p.patientId?.uhid && (
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>UHID: {p.patientId.uhid}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(expanded === p._id ? null : p._id)}
                    className="p-2 rounded-xl transition-colors btn-ghost flex-shrink-0">
                    {expanded === p._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expanded === p._id && (
                <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                  {/* Medicines — shown to all roles */}
                  <p className="label mt-4 mb-2">MEDICINES</p>
                  <div className="space-y-2">
                    {p.medicines?.map((m: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.1)' }}>
                        <Pill className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{m.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {m.dosage} · {m.frequency} · {m.duration}
                            {m.instructions && ` · ${m.instructions}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vitals, notes, follow-up — hidden from pharmacy role */}
                  {role !== 'pharmacy' && (
                    <>
                      {p.vitals && Object.values(p.vitals).some(Boolean) && (
                        <>
                          <p className="label mt-4 mb-2">VITALS</p>
                          <div className="grid grid-cols-3 gap-2">
                            {p.vitals.bp && <div className="text-sm"><span className="label text-xs">BP</span><p style={{ color: 'var(--text)' }}>{p.vitals.bp}</p></div>}
                            {p.vitals.pulse && <div className="text-sm"><span className="label text-xs">PULSE</span><p style={{ color: 'var(--text)' }}>{p.vitals.pulse} bpm</p></div>}
                            {p.vitals.temp && <div className="text-sm"><span className="label text-xs">TEMP</span><p style={{ color: 'var(--text)' }}>{p.vitals.temp}°F</p></div>}
                            {p.vitals.weight && <div className="text-sm"><span className="label text-xs">WEIGHT</span><p style={{ color: 'var(--text)' }}>{p.vitals.weight} kg</p></div>}
                            {p.vitals.spO2 && <div className="text-sm"><span className="label text-xs">SpO2</span><p style={{ color: 'var(--text)' }}>{p.vitals.spO2}%</p></div>}
                          </div>
                        </>
                      )}
                      {p.notes && (
                        <div className="mt-3">
                          <p className="label">DOCTOR NOTES</p>
                          <p className="text-sm mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{p.notes}"</p>
                        </div>
                      )}
                      {p.followUpDate && (
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                          <strong>Follow-up:</strong> {formatDate(p.followUpDate)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Prescription Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="sticky top-0 flex items-center justify-between p-6 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Create Prescription</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Patient lookup */}
              <div>
                <label className="label">PATIENT UHID LOOKUP *</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="Enter patient UHID (e.g. AD-2026-1234)"
                    value={form.patientUhid} onChange={e => setForm(f => ({ ...f, patientUhid: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && lookupPatient()} />
                  <button onClick={lookupPatient} disabled={lookingUp} className="btn-secondary px-4 flex items-center gap-2">
                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Find
                  </button>
                </div>
                {patientFound && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                    <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                      {patientFound.userId?.name} — {patientFound.uhid} · {patientFound.gender}
                    </span>
                  </div>
                )}
              </div>

              {/* Diagnosis & symptoms */}
              <div>
                <label className="label">DIAGNOSIS *</label>
                <input className="input-field" placeholder="Primary diagnosis..." value={form.diagnosis}
                  onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>
              <div>
                <label className="label">SYMPTOMS (comma-separated)</label>
                <input className="input-field" placeholder="e.g. Fever, Cough, Fatigue" value={form.symptoms}
                  onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
              </div>

              {/* Vitals */}
              <div>
                <label className="label">VITALS</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'bp', ph: 'BP (e.g. 120/80)' },
                    { key: 'pulse', ph: 'Pulse (bpm)' },
                    { key: 'temp', ph: 'Temp (°F)' },
                    { key: 'weight', ph: 'Weight (kg)' },
                    { key: 'spO2', ph: 'SpO2 (%)' },
                  ].map(({ key, ph }) => (
                    <input key={key} className="input-field text-sm" placeholder={ph}
                      value={(form.vitals as any)[key]}
                      onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, [key]: e.target.value } }))} />
                  ))}
                </div>
              </div>

              {/* Medicines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">MEDICINES *</label>
                  <button onClick={addMedicine} className="text-xs btn-secondary px-3 py-1 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold" style={{ color: '#3b82f6' }}>Medicine {i + 1}</p>
                        {form.medicines.length > 1 && (
                          <button onClick={() => removeMedicine(i)} className="text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input-field text-sm" placeholder="Medicine name *" value={m.name}
                          onChange={e => updateMedicine(i, 'name', e.target.value)} />
                        <input className="input-field text-sm" placeholder="Dosage * (e.g. 500mg)" value={m.dosage}
                          onChange={e => updateMedicine(i, 'dosage', e.target.value)} />
                        <input className="input-field text-sm" placeholder="Frequency * (e.g. Twice daily)" value={m.frequency}
                          onChange={e => updateMedicine(i, 'frequency', e.target.value)} />
                        <input className="input-field text-sm" placeholder="Duration * (e.g. 5 days)" value={m.duration}
                          onChange={e => updateMedicine(i, 'duration', e.target.value)} />
                      </div>
                      <input className="input-field text-sm" placeholder="Instructions (e.g. After meals)" value={m.instructions}
                        onChange={e => updateMedicine(i, 'instructions', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">FOLLOW-UP DATE</label>
                  <input type="date" className="input-field" value={form.followUpDate}
                    onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">NOTES</label>
                  <input className="input-field" placeholder="Additional notes..." value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <button onClick={createPrescription} disabled={creating} className="btn-primary w-full">
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create & Generate Token'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

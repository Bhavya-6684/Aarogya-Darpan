'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Users, Plus, Search, X, Loader2, Eye, FileText, FlaskConical,
  CheckCircle, AlertCircle, UserSearch, Heart, Pill, Activity,
  ArrowLeft, Edit2, Save, ShieldOff, PlusCircle, Trash2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PatientsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  // Tab: 'patients' | 'access' (doctor) | 'register' (admin/receptionist)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const defaultTab = urlParams?.get('tab') === 'access' ? 'access' : 'patients'
  const [tab, setTab] = useState(defaultTab)

  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Patient access (doctor)
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [uhidLookup, setUhidLookup] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [sendingReq, setSendingReq] = useState(false)

  // Selected patient for history view
  const [viewingHistory, setViewingHistory] = useState<any>(null)
  const [history, setHistory] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Add prescription state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [submittingRx, setSubmittingRx] = useState(false)
  const [rxForm, setRxForm] = useState({
    diagnosis: '',
    symptoms: '',
    notes: '',
    followUpDate: '',
  })
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])

  // Revoke access state
  const [revokingAccess, setRevokingAccess] = useState(false)

  // Register patient form (admin/receptionist)
  const [showRegister, setShowRegister] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', dob: '', gender: '', bloodGroup: '' })

  useEffect(() => { fetchPatients(); if (role === 'doctor') fetchAccessRequests() }, [role])

  async function fetchPatients() {
    try {
      const { data } = await axios.get('/api/patients' + (search ? `?search=${search}` : ''))
      setPatients(data.patients || [])
    } catch { } finally { setLoading(false) }
  }

  async function fetchAccessRequests() {
    const { data } = await axios.get('/api/access-requests')
    setAccessRequests(data.requests || [])
  }

  async function lookupPatient() {
    if (!uhidLookup.trim()) return
    setLookingUp(true)
    setLookupResult(null)
    try {
      const { data } = await axios.get(`/api/patients?uhid=${uhidLookup.trim()}`)
      if (data.patient) setLookupResult(data.patient)
      else toast.error('Patient not found')
    } catch { toast.error('Lookup failed') } finally { setLookingUp(false) }
  }

  async function sendAccessRequest() {
    if (!lookupResult) return
    setSendingReq(true)
    try {
      await axios.post('/api/access-requests', { patientId: lookupResult._id })
      toast.success('Access request sent to patient!')
      setUhidLookup('')
      setLookupResult(null)
      fetchAccessRequests()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to send request')
    } finally { setSendingReq(false) }
  }

  async function viewPatientHistory(accessRequest: any) {
    setViewingHistory(accessRequest)
    setHistoryLoading(true)
    setShowPrescriptionForm(false)
    setRxForm({ diagnosis: '', symptoms: '', notes: '', followUpDate: '' })
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    try {
      const { data } = await axios.get(`/api/records?patientId=${accessRequest.patientId._id || accessRequest.patientId}`)
      setHistory(data)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Cannot load history')
    } finally { setHistoryLoading(false) }
  }

  async function addPrescription() {
    if (!rxForm.diagnosis.trim()) return toast.error('Diagnosis is required')
    if (!medicines[0]?.name.trim()) return toast.error('At least one medicine is required')
    setSubmittingRx(true)
    try {
      const patientId = viewingHistory?.patientId?._id || viewingHistory?.patientId
      await axios.post('/api/prescriptions', {
        patientId,
        diagnosis: rxForm.diagnosis,
        symptoms: rxForm.symptoms ? rxForm.symptoms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        notes: rxForm.notes,
        followUpDate: rxForm.followUpDate || undefined,
        medicines: medicines.filter(m => m.name.trim()),
      })
      toast.success('Prescription added successfully!')
      setShowPrescriptionForm(false)
      setRxForm({ diagnosis: '', symptoms: '', notes: '', followUpDate: '' })
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
      // Refresh history
      const { data } = await axios.get(`/api/records?patientId=${patientId}`)
      setHistory(data)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add prescription')
    } finally { setSubmittingRx(false) }
  }

  async function revokeAccess() {
    if (!viewingHistory) return
    setRevokingAccess(true)
    try {
      await axios.delete('/api/access-requests', { data: { requestId: viewingHistory._id } })
      toast.success('Access revoked. Patient removed from your list.')
      setViewingHistory(null)
      setHistory(null)
      fetchAccessRequests()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to revoke access')
    } finally { setRevokingAccess(false) }
  }

  function addMedicineRow() {
    setMedicines(m => [...m, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  function removeMedicineRow(idx: number) {
    setMedicines(m => m.filter((_, i) => i !== idx))
  }

  function updateMedicine(idx: number, field: string, value: string) {
    setMedicines(m => m.map((med, i) => i === idx ? { ...med, [field]: value } : med))
  }

  async function registerPatient() {
    if (!regForm.name || !regForm.email || !regForm.dob || !regForm.gender) {
      return toast.error('Name, email, DOB, and gender are required')
    }
    setRegistering(true)
    try {
      await axios.post('/api/patients', regForm)
      toast.success('Patient registered!')
      setShowRegister(false)
      setRegForm({ name: '', email: '', phone: '', dob: '', gender: '', bloodGroup: '' })
      fetchPatients()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Registration failed')
    } finally { setRegistering(false) }
  }

  const filtered = patients.filter(p =>
    !search ||
    p.uhid?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const acceptedRequests = accessRequests.filter(r => r.status === 'accepted')
  const pendingRequests = accessRequests.filter(r => r.status === 'pending')

  // Full history view for doctor
  if (viewingHistory) {
    return (
      <div className="animate-fade-in max-w-3xl">
        {/* Top bar: back + revoke */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setViewingHistory(null); setHistory(null) }}
            className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to My Patients
          </button>
          <button
            onClick={revokeAccess}
            disabled={revokingAccess}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            {revokingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
            Revoke Access
          </button>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
        ) : history ? (
          <div className="space-y-4">
            {/* Patient summary */}
            <div className="hero-banner mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>PATIENT MEDICAL HISTORY</p>
              <h2 className="text-2xl font-bold text-white">{history.patient?.userId?.name}</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                UHID: {history.patient?.uhid} · {history.patient?.gender} · {
                  history.patient?.dob ? `${Math.floor((Date.now() - new Date(history.patient.dob).getTime()) / (365.25*24*3600000))} yrs` : ''
                }
              </p>
              <div className="flex gap-3 mt-3 flex-wrap">
                {history.patient?.allergies?.map((a: string) => (
                  <span key={a} className="badge-red text-xs">{a}</span>
                ))}
                {history.patient?.chronicConditions?.map((c: string) => (
                  <span key={c} className="badge-yellow text-xs">{c}</span>
                ))}
              </div>
            </div>

            {/* Add Prescription section */}
            <div className="card-new p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Pill className="w-4 h-4" style={{ color: 'var(--brand)' }} /> Add Prescription
                </h3>
                <button
                  onClick={() => setShowPrescriptionForm(v => !v)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-semibold transition-all"
                  style={{ background: showPrescriptionForm ? 'rgba(239,68,68,0.08)' : 'rgba(13,148,136,0.1)', color: showPrescriptionForm ? '#ef4444' : 'var(--brand)', border: `1px solid ${showPrescriptionForm ? 'rgba(239,68,68,0.2)' : 'rgba(13,148,136,0.2)'}` }}
                >
                  {showPrescriptionForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><PlusCircle className="w-3.5 h-3.5" /> New Prescription</>}
                </button>
              </div>

              {showPrescriptionForm && (
                <div className="space-y-4 pt-2">
                  {/* Diagnosis */}
                  <div>
                    <label className="label">DIAGNOSIS *</label>
                    <input className="input-field" placeholder="e.g. Viral fever, Hypertension"
                      value={rxForm.diagnosis} onChange={e => setRxForm(f => ({ ...f, diagnosis: e.target.value }))} />
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className="label">SYMPTOMS (comma-separated)</label>
                    <input className="input-field" placeholder="e.g. Fever, Headache, Cough"
                      value={rxForm.symptoms} onChange={e => setRxForm(f => ({ ...f, symptoms: e.target.value }))} />
                  </div>

                  {/* Medicines */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">MEDICINES *</label>
                      <button onClick={addMedicineRow}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--brand)' }}>
                        <Plus className="w-3 h-3" /> Add Row
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medicines.map((med, idx) => (
                        <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-start p-3 rounded-xl" style={{ background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.1)' }}>
                          <input className="input-field text-xs" placeholder="Medicine name" value={med.name}
                            onChange={e => updateMedicine(idx, 'name', e.target.value)} />
                          <input className="input-field text-xs" placeholder="Dosage (e.g. 500mg)" value={med.dosage}
                            onChange={e => updateMedicine(idx, 'dosage', e.target.value)} />
                          <input className="input-field text-xs" placeholder="Frequency (e.g. TDS)" value={med.frequency}
                            onChange={e => updateMedicine(idx, 'frequency', e.target.value)} />
                          <input className="input-field text-xs" placeholder="Duration (e.g. 5 days)" value={med.duration}
                            onChange={e => updateMedicine(idx, 'duration', e.target.value)} />
                          <div className="flex gap-1">
                            <input className="input-field text-xs flex-1" placeholder="Instructions" value={med.instructions}
                              onChange={e => updateMedicine(idx, 'instructions', e.target.value)} />
                            {medicines.length > 1 && (
                              <button onClick={() => removeMedicineRow(idx)}
                                className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes + Follow-up */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">NOTES</label>
                      <textarea className="input-field resize-none" rows={2} placeholder="Additional notes..."
                        value={rxForm.notes} onChange={e => setRxForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">FOLLOW-UP DATE</label>
                      <input type="date" className="input-field"
                        value={rxForm.followUpDate} onChange={e => setRxForm(f => ({ ...f, followUpDate: e.target.value }))} />
                    </div>
                  </div>

                  <button onClick={addPrescription} disabled={submittingRx} className="btn-primary w-full flex items-center justify-center gap-2">
                    {submittingRx ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Prescription</>}
                  </button>
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="card-new p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileText className="w-4 h-4 text-blue-500" /> Prescriptions ({history.prescriptions?.length || 0})
              </h3>
              <div className="space-y-2">
                {history.prescriptions?.map((p: any) => (
                  <div key={p._id} className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div className="flex justify-between">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.diagnosis}</p>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Dr. {p.doctorId?.name} · {p.medicines?.length} medicines · Token: {p.tokenNumber}
                    </p>
                  </div>
                ))}
                {history.prescriptions?.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No prescriptions</p>}
              </div>
            </div>

            {/* Lab reports */}
            <div className="card-new p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FlaskConical className="w-4 h-4" style={{ color: '#8b5cf6' }} /> Lab Reports ({history.labReports?.length || 0})
              </h3>
              <div className="space-y-2">
                {history.labReports?.map((r: any) => (
                  <div key={r._id} className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <div className="flex justify-between">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.testName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.status}</span>
                    </div>
                    {r.result && <p className="text-xs mt-1 font-medium" style={{ color: '#10b981' }}>Result: {r.result}</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</p>
                  </div>
                ))}
                {history.labReports?.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No lab reports</p>}
              </div>
            </div>

            {/* Bottom revoke button */}
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={revokeAccess}
                disabled={revokingAccess}
                className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {revokingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                Revoke Patient Access
              </button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">{role === 'doctor' ? 'My Patients' : 'Patients'}</h2>
          <p className="page-subtitle">
            {role === 'doctor' ? 'Patients who granted you access to their medical history' : 'Registered patients'}
          </p>
        </div>
        {['hospital_admin', 'receptionist'].includes(role) && (
          <button onClick={() => setShowRegister(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        )}
      </div>

      {/* Doctor tabs */}
      {role === 'doctor' && (
        <div className="flex gap-2 mb-6">
          {[
            { key: 'patients', label: 'Accepted Patients' },
            { key: 'access', label: `Patient Access${pendingRequests.length ? ` (${pendingRequests.length} pending)` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: tab === t.key ? 'var(--brand)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text-muted)',
                borderColor: tab === t.key ? 'var(--brand)' : 'var(--border)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Doctor: Patient access tab */}
      {role === 'doctor' && tab === 'access' && (
        <div className="space-y-4">
          {/* Search by UHID */}
          <div className="card-new p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <UserSearch className="w-4 h-4" style={{ color: 'var(--brand)' }} />
              Request Patient Access
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Enter a patient's UHID to request access to their medical history. The patient will receive a notification to accept or deny.
            </p>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Enter UHID (e.g. AD-2026-1234)"
                value={uhidLookup} onChange={e => setUhidLookup(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupPatient()} />
              <button onClick={lookupPatient} disabled={lookingUp} className="btn-secondary px-4 flex items-center gap-2">
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Find
              </button>
            </div>
            {lookupResult && (
              <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{lookupResult.userId?.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lookupResult.uhid} · {lookupResult.gender}</p>
                  </div>
                  <button onClick={sendAccessRequest} disabled={sendingReq} className="btn-primary px-4 flex items-center gap-2">
                    {sendingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Send Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="card-new p-5">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Pending Requests</h3>
              <div className="space-y-2">
                {pendingRequests.map(r => (
                  <div key={r._id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        UHID: {r.patientId?.uhid || 'Patient'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting patient response</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patients list */}
      {(role !== 'doctor' || tab === 'patients') && (
        <>
          {/* Search */}
          {role !== 'doctor' && (
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input className="input-field pl-10" placeholder="Search by name, UHID, or email..."
                value={search} onChange={e => { setSearch(e.target.value); setTimeout(fetchPatients, 300) }} />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
          ) : (
            <>
              {/* Doctor: accepted patients */}
              {role === 'doctor' && (
                <div className="space-y-3">
                  {acceptedRequests.length === 0 ? (
                    <div className="card-new">
                      <div className="empty-state py-16">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(13,148,136,0.1)' }}>
                          <Users className="w-6 h-6" style={{ color: 'var(--brand)' }} />
                        </div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>No patients yet</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Switch to "Patient Access" tab to send access requests.</p>
                      </div>
                    </div>
                  ) : acceptedRequests.map(r => (
                    <div key={r._id} className="card-new p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ background: 'var(--brand)' }}>
                          {(r.patientId?.uhid || 'P')[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            UHID: {r.patientId?.uhid || 'Patient'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Access granted</p>
                        </div>
                      </div>
                      <button onClick={() => viewPatientHistory(r)} className="btn-secondary flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4" /> View History
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin/receptionist: all patients */}
              {role !== 'doctor' && (
                <>
                  {filtered.length === 0 ? (
                    <div className="card-new">
                      <div className="empty-state py-16">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(13,148,136,0.1)' }}>
                          <Users className="w-6 h-6" style={{ color: 'var(--brand)' }} />
                        </div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>No patients registered yet</p>
                        <button onClick={() => setShowRegister(true)} className="btn-primary mt-3">Register Patient</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map(p => {
                        const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 3600000)) : null
                        return (
                          <div key={p._id} className="card-new p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: 'var(--brand)' }}>
                              {(p.userId?.name || 'P')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                              <div>
                                <p className="label text-xs">NAME</p>
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.userId?.name}</p>
                              </div>
                              <div>
                                <p className="label text-xs">UHID</p>
                                <p className="text-sm font-mono" style={{ color: 'var(--brand)' }}>{p.uhid}</p>
                              </div>
                              <div>
                                <p className="label text-xs">GENDER / AGE</p>
                                <p className="text-sm" style={{ color: 'var(--text)' }}>{p.gender}{age ? `, ${age}y` : ''}</p>
                              </div>
                              <div>
                                <p className="label text-xs">PHONE</p>
                                <p className="text-sm" style={{ color: 'var(--text)' }}>{p.userId?.phone || '—'}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Register Patient Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegister(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Register Patient</h3>
              <button onClick={() => setShowRegister(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">FULL NAME *</label>
                  <input className="input-field" value={regForm.name} placeholder="Patient name"
                    onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">PHONE</label>
                  <input className="input-field" value={regForm.phone} placeholder="+91..."
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">EMAIL *</label>
                  <input type="email" className="input-field" value={regForm.email} placeholder="patient@email.com"
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">DATE OF BIRTH *</label>
                  <input type="date" className="input-field" value={regForm.dob}
                    onChange={e => setRegForm(f => ({ ...f, dob: e.target.value }))} />
                </div>
                <div>
                  <label className="label">GENDER *</label>
                  <select className="input-field" value={regForm.gender}
                    onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">BLOOD GROUP</label>
                  <select className="input-field" value={regForm.bloodGroup}
                    onChange={e => setRegForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                    <option value="">Unknown</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={registerPatient} disabled={registering} className="btn-primary w-full">
                {registering ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : 'Register & Generate UHID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  FlaskConical, Upload, Loader2, Search, CheckCircle, Clock,
  AlertCircle, X, Plus, FileUp, Eye, User, Download
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

const STATUS_STYLE: Record<string, any> = {
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pending', icon: Clock },
  processing: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Processing', icon: Clock },
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Completed', icon: CheckCircle },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelled', icon: AlertCircle },
}

export default function LabsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [uploadModal, setUploadModal] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Upload form
  const [uploadForm, setUploadForm] = useState({ result: '', referenceRange: '', notes: '', fileUrl: '' })

  // Request form (doctor)
  const [requestForm, setRequestForm] = useState({ patientUhid: '', testName: '', testType: '', priority: 'normal', notes: '' })
  const [patientFound, setPatientFound] = useState<any>(null)
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => { fetchReports() }, [role])

  async function fetchReports() {
    try {
      const { data } = await axios.get('/api/labs')
      setReports(data.reports || [])
    } catch { toast.error('Could not load reports') }
    finally { setLoading(false) }
  }

  async function lookupPatient() {
    if (!requestForm.patientUhid.trim()) return
    setLookingUp(true)
    setPatientFound(null)
    try {
      const { data } = await axios.get(`/api/patients?uhid=${requestForm.patientUhid.trim()}`)
      if (data.patient) setPatientFound(data.patient)
      else toast.error('Patient not found')
    } catch { toast.error('Lookup failed') } finally { setLookingUp(false) }
  }

  async function requestTest() {
    if (!patientFound) return toast.error('Find a patient first')
    if (!requestForm.testName) return toast.error('Test name is required')
    setRequesting(true)
    try {
      await axios.post('/api/labs', {
        patientId: patientFound._id,
        hospitalId: (session?.user as any)?.hospitalId,
        testName: requestForm.testName,
        testType: requestForm.testType,
        priority: requestForm.priority,
        notes: requestForm.notes,
      })
      toast.success('Lab test requested')
      setShowRequest(false)
      setRequestForm({ patientUhid: '', testName: '', testType: '', priority: 'normal', notes: '' })
      setPatientFound(null)
      fetchReports()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Request failed')
    } finally { setRequesting(false) }
  }

  async function uploadResult() {
    if (!uploadForm.result) return toast.error('Result is required')
    setUploading(true)
    try {
      await axios.patch('/api/labs', {
        id: uploadModal._id,
        status: 'completed',
        result: uploadForm.result,
        referenceRange: uploadForm.referenceRange,
        notes: uploadForm.notes,
        fileUrl: uploadForm.fileUrl,
      })
      toast.success('Report uploaded & patient notified!')
      setUploadModal(null)
      setUploadForm({ result: '', referenceRange: '', notes: '', fileUrl: '' })
      fetchReports()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Upload failed')
    } finally { setUploading(false) }
  }

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter
    const matchSearch = !search ||
      r.testName?.toLowerCase().includes(search.toLowerCase()) ||
      r.patientId?.uhid?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">{role === 'patient' ? 'My Lab Reports' : 'Lab Reports'}</h2>
          <p className="page-subtitle">
            {role === 'patient' ? 'Reports uploaded by lab technicians' :
             role === 'lab_technician' ? 'Upload results and manage test reports' :
             'All lab orders and results'}
          </p>
        </div>
        {['doctor', 'hospital_admin'].includes(role) && (
          <button onClick={() => setShowRequest(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Request Test
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-10" placeholder="Search by test name or patient ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'processing', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: filter === s ? 'var(--brand)' : 'transparent',
                color: filter === s ? 'white' : 'var(--text-muted)',
                borderColor: filter === s ? 'var(--brand)' : 'var(--border)',
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <FlaskConical className="w-7 h-7" style={{ color: '#8b5cf6' }} />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No lab reports</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {role === 'patient' ? 'Lab reports uploaded by technicians will appear here.' : 'No matching records.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending
            const StatusIcon = st.icon
            return (
              <div key={r._id} className="card-new p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(139,92,246,0.1)' }}>
                      <FlaskConical className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{r.testName}</p>
                        {r.testType && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {r.testType}</span>}
                        {r.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">URGENT</span>
                        )}
                      </div>
                      {r.patientId?.uhid && (
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--brand)' }}>UHID: {r.patientId.uhid}</p>
                      )}
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Requested by {r.requestedBy?.name || 'Doctor'} · {formatDate(r.createdAt)}
                      </p>
                      {r.result && (
                        <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)' }}>
                          <p className="text-sm font-medium" style={{ color: '#10b981' }}>Result: {r.result}</p>
                          {r.referenceRange && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reference: {r.referenceRange}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: st.bg, color: st.color }}>
                      <StatusIcon className="w-3 h-3" /> {st.label}
                    </span>
                    {role === 'lab_technician' && r.status !== 'completed' && (
                      <button onClick={() => { setUploadModal(r); setUploadForm({ result: '', referenceRange: '', notes: '', fileUrl: '' }) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--brand)', border: '1px solid rgba(13,148,136,0.2)' }}>
                        <Upload className="w-3 h-3" /> Upload Result
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Result Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUploadModal(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Upload Test Result</h3>
              <button onClick={() => setUploadModal(null)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{uploadModal.testName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Patient: {uploadModal.patientId?.uhid}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">TEST RESULT *</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Enter the test result details..."
                  value={uploadForm.result} onChange={e => setUploadForm(f => ({ ...f, result: e.target.value }))} />
              </div>
              <div>
                <label className="label">REFERENCE RANGE</label>
                <input className="input-field" placeholder="e.g. 70–100 mg/dL"
                  value={uploadForm.referenceRange} onChange={e => setUploadForm(f => ({ ...f, referenceRange: e.target.value }))} />
              </div>
              <div>
                <label className="label">NOTES / REMARKS</label>
                <input className="input-field" placeholder="Any additional remarks..."
                  value={uploadForm.notes} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className="label">REPORT URL (optional)</label>
                <input className="input-field" placeholder="Link to PDF/image..."
                  value={uploadForm.fileUrl} onChange={e => setUploadForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
              <button onClick={uploadResult} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><FileUp className="w-4 h-4" /> Upload & Notify Patient</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Lab Test Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRequest(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Request Lab Test</h3>
              <button onClick={() => setShowRequest(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">PATIENT UHID</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="e.g. AD-2026-1234"
                    value={requestForm.patientUhid} onChange={e => setRequestForm(f => ({ ...f, patientUhid: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && lookupPatient()} />
                  <button onClick={lookupPatient} disabled={lookingUp} className="btn-secondary px-3">
                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {patientFound && (
                  <div className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                    <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                      {patientFound.userId?.name} — {patientFound.uhid}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="label">TEST NAME *</label>
                <input className="input-field" placeholder="e.g. Complete Blood Count" value={requestForm.testName}
                  onChange={e => setRequestForm(f => ({ ...f, testName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">TEST TYPE</label>
                  <input className="input-field" placeholder="e.g. Blood, Urine" value={requestForm.testType}
                    onChange={e => setRequestForm(f => ({ ...f, testType: e.target.value }))} />
                </div>
                <div>
                  <label className="label">PRIORITY</label>
                  <select className="input-field" value={requestForm.priority}
                    onChange={e => setRequestForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <button onClick={requestTest} disabled={requesting} className="btn-primary w-full">
                {requesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</> : 'Submit Test Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

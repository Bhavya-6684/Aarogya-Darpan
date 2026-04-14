'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FileText, Plus, Loader2, Stethoscope, Pill } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Record {
  _id: string
  patientId: { uhid: string }
  doctorId: { name: string; specialization?: string }
  diagnosis: string
  symptoms: string[]
  prescriptions: Array<{ drug: string; dosage: string; frequency: string; duration: string }>
  vitals: { bp?: string; pulse?: number; temp?: number; weight?: number; spO2?: number }
  createdAt: string
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    patientId: '', diagnosis: '', symptoms: '',
    prescriptions: [{ drug: '', dosage: '', frequency: '', duration: '' }],
    vitals: { bp: '', pulse: '', temp: '', weight: '', spO2: '' },
    notes: '', followUpDate: '',
  })

  useEffect(() => { fetchRecords() }, [])

  async function fetchRecords() {
    try {
      const { data } = await axios.get('/api/records')
      setRecords(data.records)
    } catch { toast.error('Failed to load records') }
    finally { setLoading(false) }
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/records', {
        ...form,
        symptoms: form.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        vitals: {
          bp: form.vitals.bp || undefined,
          pulse: form.vitals.pulse ? Number(form.vitals.pulse) : undefined,
          temp: form.vitals.temp ? Number(form.vitals.temp) : undefined,
          weight: form.vitals.weight ? Number(form.vitals.weight) : undefined,
          spO2: form.vitals.spO2 ? Number(form.vitals.spO2) : undefined,
        },
        prescriptions: form.prescriptions.filter(p => p.drug.trim()),
      })
      toast.success('Medical record created')
      setShowForm(false)
      fetchRecords()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create record')
    } finally { setSaving(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Medical Records</h2>
          <p className="page-subtitle">{records.length} records on file</p>
        </div>
        <button id="new-record-btn" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Record
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : records.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No medical records</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(record => (
            <div key={record._id} className="card overflow-hidden">
              <div
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === record._id ? null : record._id)}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{record.diagnosis}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>UHID: {record.patientId?.uhid || '—'}</span>
                      <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {record.doctorId?.name}</span>
                      <span>{formatDate(record.createdAt)}</span>
                    </div>
                    {record.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {record.symptoms.slice(0, 4).map(s => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {record.symptoms.length > 4 && (
                          <span className="text-xs text-gray-400">+{record.symptoms.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-gray-400 text-lg">{expanded === record._id ? '↑' : '↓'}</span>
              </div>

              {expanded === record._id && (
                <div className="border-t border-gray-100 p-5 space-y-4 animate-fade-in">
                  {/* Vitals */}
                  {Object.keys(record.vitals).some(k => (record.vitals as any)[k]) && (
                    <div>
                      <p className="font-semibold text-gray-700 text-sm mb-2">Vitals</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'BP', val: record.vitals.bp, unit: 'mmHg' },
                          { label: 'Pulse', val: record.vitals.pulse, unit: 'bpm' },
                          { label: 'Temp', val: record.vitals.temp, unit: '°F' },
                          { label: 'Weight', val: record.vitals.weight, unit: 'kg' },
                          { label: 'SpO₂', val: record.vitals.spO2, unit: '%' },
                        ].filter(v => v.val).map(v => (
                          <div key={v.label} className="bg-brand-50 px-3 py-2 rounded-xl text-xs">
                            <span className="text-gray-500">{v.label}: </span>
                            <span className="font-bold text-brand-700">{v.val} {v.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {record.prescriptions.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-brand-500" /> Prescription
                      </p>
                      <div className="space-y-2">
                        {record.prescriptions.map((rx, i) => (
                          <div key={i} className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                            <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{rx.drug} — {rx.dosage}</p>
                              <p className="text-xs text-gray-500">{rx.frequency} · {rx.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">New Medical Record</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <form onSubmit={createRecord} className="p-6 space-y-4">
              <div>
                <label className="label" htmlFor="r-patient">PATIENT ID *</label>
                <input id="r-patient" className="input-field" placeholder="Patient ObjectId"
                  value={form.patientId} onChange={(e) => setForm(f => ({ ...f, patientId: e.target.value }))} required />
              </div>
              <div>
                <label className="label" htmlFor="r-diagnosis">DIAGNOSIS *</label>
                <input id="r-diagnosis" className="input-field" placeholder="Primary diagnosis"
                  value={form.diagnosis} onChange={(e) => setForm(f => ({ ...f, diagnosis: e.target.value }))} required />
              </div>
              <div>
                <label className="label" htmlFor="r-symptoms">SYMPTOMS (comma-separated)</label>
                <input id="r-symptoms" className="input-field" placeholder="fever, headache, cough"
                  value={form.symptoms} onChange={(e) => setForm(f => ({ ...f, symptoms: e.target.value }))} />
              </div>
              <div>
                <p className="label mb-2">VITALS</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'v-bp', key: 'bp', label: 'BP', placeholder: '120/80' },
                    { id: 'v-pulse', key: 'pulse', label: 'Pulse', placeholder: '72' },
                    { id: 'v-temp', key: 'temp', label: 'Temp °F', placeholder: '98.6' },
                    { id: 'v-weight', key: 'weight', label: 'Weight kg', placeholder: '70' },
                    { id: 'v-spo2', key: 'spO2', label: 'SpO₂ %', placeholder: '98' },
                  ].map(({ id, key, label, placeholder }) => (
                    <div key={key}>
                      <label className="label" htmlFor={id}>{label}</label>
                      <input id={id} className="input-field" placeholder={placeholder}
                        value={(form.vitals as any)[key]}
                        onChange={(e) => setForm(f => ({ ...f, vitals: { ...f.vitals, [key]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="label mb-0">PRESCRIPTIONS</p>
                  <button type="button" onClick={() => setForm(f => ({
                    ...f, prescriptions: [...f.prescriptions, { drug: '', dosage: '', frequency: '', duration: '' }]
                  }))} className="text-xs text-brand-600 font-semibold">+ Add</button>
                </div>
                {form.prescriptions.map((rx, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                    <input className="input-field" placeholder="Drug name"
                      value={rx.drug} onChange={(e) => { const p = [...form.prescriptions]; p[i].drug = e.target.value; setForm(f => ({ ...f, prescriptions: p })) }} />
                    <input className="input-field" placeholder="Dosage"
                      value={rx.dosage} onChange={(e) => { const p = [...form.prescriptions]; p[i].dosage = e.target.value; setForm(f => ({ ...f, prescriptions: p })) }} />
                    <input className="input-field" placeholder="Frequency"
                      value={rx.frequency} onChange={(e) => { const p = [...form.prescriptions]; p[i].frequency = e.target.value; setForm(f => ({ ...f, prescriptions: p })) }} />
                    <input className="input-field" placeholder="Duration"
                      value={rx.duration} onChange={(e) => { const p = [...form.prescriptions]; p[i].duration = e.target.value; setForm(f => ({ ...f, prescriptions: p })) }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="label" htmlFor="r-notes">NOTES</label>
                <textarea id="r-notes" className="input-field" rows={2}
                  value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" id="save-record-btn" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

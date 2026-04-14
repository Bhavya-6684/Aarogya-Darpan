'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Building2, Save, Loader2, Edit2, X, Plus, Hash,
  Phone, Mail, Globe, BedDouble, Shield
} from 'lucide-react'

const DEPARTMENTS = [
  'General Medicine', 'Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Neurology', 'Radiology', 'Dermatology', 'ENT',
  'Ophthalmology', 'Psychiatry', 'Oncology', 'Nephrology', 'Urology',
  'Gastroenterology', 'Pulmonology', 'ICU', 'Surgery', 'Anesthesiology',
]

export default function SettingsPage() {
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [newDept, setNewDept] = useState('')

  useEffect(() => { fetchHospital() }, [])

  async function fetchHospital() {
    try {
      const { data } = await axios.get('/api/settings')
      if (data.hospital) {
        const h = data.hospital
        setHospital(h)
        setForm({
          hospitalName: h.name || '',
          hospitalCity: h.address?.city || '',
          hospitalState: h.address?.state || '',
          hospitalStreet: h.address?.street || '',
          hospitalPincode: h.address?.pincode || '',
          hospitalPhone: h.phone || '',
          hospitalEmail: h.email || '',
          licenseNumber: h.licenseNumber || '',
          totalBeds: h.totalBeds || 0,
          website: h.website || '',
          departments: h.departments || [],
        })
      }
    } catch { toast.error('Failed to load settings') }
    finally { setLoading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await axios.patch('/api/settings', form)
      toast.success('Hospital settings saved!')
      setEditing(false)
      fetchHospital()
    } catch {
      toast.error('Could not save settings')
    } finally { setSaving(false) }
  }

  function F(key: string, val: any) { setForm((f: any) => ({ ...f, [key]: val })) }

  function addDept(dept: string) {
    const d = dept.trim()
    if (!d || form.departments?.includes(d)) return
    F('departments', [...(form.departments || []), d])
    setNewDept('')
  }

  function removeDept(d: string) {
    F('departments', form.departments.filter((x: string) => x !== d))
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-2xl space-y-4">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Hospital Settings</h2>
          <p className="page-subtitle">Manage your hospital information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); fetchHospital() }} className="btn-secondary flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        )}
      </div>

      {!hospital && (
        <div className="card-new p-6 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No hospital found. Please register as Hospital Admin first.</p>
        </div>
      )}

      {hospital && (
        <>
          {/* Hospital Info */}
          <div className="card-new p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Building2 className="w-4 h-4" style={{ color: 'var(--brand)' }} /> Hospital Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="label">HOSPITAL NAME</p>
                {editing
                  ? <input className="input-field" value={form.hospitalName} onChange={e => F('hospitalName', e.target.value)} placeholder="Apollo City Hospital" />
                  : <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>{hospital.name || '—'}</p>}
              </div>
              <div className="col-span-2">
                <p className="label">STREET ADDRESS</p>
                {editing
                  ? <input className="input-field" value={form.hospitalStreet} onChange={e => F('hospitalStreet', e.target.value)} placeholder="Street address" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.address?.street || '—'}</p>}
              </div>
              <div>
                <p className="label">CITY</p>
                {editing
                  ? <input className="input-field" value={form.hospitalCity} onChange={e => F('hospitalCity', e.target.value)} placeholder="Mumbai" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.address?.city || '—'}</p>}
              </div>
              <div>
                <p className="label">STATE</p>
                {editing
                  ? <input className="input-field" value={form.hospitalState} onChange={e => F('hospitalState', e.target.value)} placeholder="Maharashtra" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.address?.state || '—'}</p>}
              </div>
              <div>
                <p className="label">PINCODE</p>
                {editing
                  ? <input className="input-field" value={form.hospitalPincode} onChange={e => F('hospitalPincode', e.target.value)} placeholder="400001" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.address?.pincode || '—'}</p>}
              </div>
              <div>
                <p className="label">HOSPITAL ID</p>
                <p className="font-mono font-bold" style={{ color: 'var(--brand)' }}>
                  {hospital.hospitalId ? hospital.hospitalId.toString().slice(-8).toUpperCase() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="card-new p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--brand)' }} /> Contact & Legal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">PHONE</p>
                {editing
                  ? <input className="input-field" value={form.hospitalPhone} onChange={e => F('hospitalPhone', e.target.value)} placeholder="+91 22 1234 5678" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.phone || '—'}</p>}
              </div>
              <div>
                <p className="label">EMAIL</p>
                {editing
                  ? <input className="input-field" type="email" value={form.hospitalEmail} onChange={e => F('hospitalEmail', e.target.value)} placeholder="hospital@email.com" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.email || '—'}</p>}
              </div>
              <div>
                <p className="label">LICENSE / REG. NUMBER</p>
                {editing
                  ? <input className="input-field" value={form.licenseNumber} onChange={e => F('licenseNumber', e.target.value)} placeholder="MH-HOS-2021-12345" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.licenseNumber || '—'}</p>}
              </div>
              <div>
                <p className="label">TOTAL BEDS</p>
                {editing
                  ? <input className="input-field" type="number" value={form.totalBeds} onChange={e => F('totalBeds', e.target.value)} />
                  : <p style={{ color: 'var(--text)' }}>{hospital.totalBeds || 0}</p>}
              </div>
              <div className="col-span-2">
                <p className="label">WEBSITE</p>
                {editing
                  ? <input className="input-field" value={form.website} onChange={e => F('website', e.target.value)} placeholder="https://www.hospital.com" />
                  : <p style={{ color: 'var(--text)' }}>{hospital.website || '—'}</p>}
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="card-new p-6">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Departments</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(editing ? form.departments : hospital.departments || []).map((d: string) => (
                <span key={d} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--brand)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  {d}
                  {editing && (
                    <button onClick={() => removeDept(d)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {(editing ? form.departments : hospital.departments || []).length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No departments added yet</p>
              )}
            </div>
            {editing && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="Add custom department..."
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDept(newDept))}
                  />
                  <button onClick={() => addDept(newDept)} className="btn-primary px-4">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.filter(d => !form.departments?.includes(d)).map(d => (
                    <button key={d} onClick={() => addDept(d)}
                      className="px-2.5 py-1 rounded-lg text-xs border transition-colors hover:border-brand-500"
                      style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                      + {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

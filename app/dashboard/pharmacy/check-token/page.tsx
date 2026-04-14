'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ShoppingBag, Hash, Search, Loader2, CheckCircle, AlertCircle,
  Pill, User, Stethoscope, Building2, X, ClipboardList
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function CheckTokenPage() {
  const [token, setToken] = useState('')
  const [prescription, setPrescription] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dispensing, setDispensing] = useState(false)
  const [error, setError] = useState('')

  async function checkToken() {
    if (!token.trim()) return toast.error('Enter a token number')
    setLoading(true)
    setPrescription(null)
    setError('')
    try {
      const { data } = await axios.get(`/api/pharmacy/check-token?token=${token.trim()}`)
      setPrescription(data.prescription)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Token not found')
    } finally { setLoading(false) }
  }

  async function markDispensed() {
    setDispensing(true)
    try {
      await axios.patch('/api/pharmacy/check-token', { tokenNumber: prescription.tokenNumber })
      toast.success('Prescription marked as dispensed!')
      setPrescription((prev: any) => ({ ...prev, dispensed: true }))
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to mark dispensed')
    } finally { setDispensing(false) }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h2 className="page-title">Check Prescription Token</h2>
        <p className="page-subtitle">Enter the token number provided by the patient to view and dispense medicines</p>
      </div>

      {/* Token input */}
      <div className="card-new p-6 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              id="token-input"
              className="input-field pl-10 text-lg font-mono tracking-widest"
              placeholder="Enter 6-digit token..."
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkToken()}
              maxLength={10}
            />
          </div>
          <button
            id="check-token-btn"
            onClick={checkToken}
            disabled={loading}
            className="btn-primary px-6 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>

      {/* Prescription result */}
      {prescription && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className={`p-4 rounded-2xl flex items-center justify-between gap-3`}
            style={{
              background: prescription.dispensed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${prescription.dispensed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
            <div className="flex items-center gap-3">
              {prescription.dispensed
                ? <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                : <ClipboardList className="w-5 h-5" style={{ color: '#f59e0b' }} />
              }
              <div>
                <p className="font-bold" style={{ color: prescription.dispensed ? '#10b981' : '#f59e0b' }}>
                  {prescription.dispensed ? 'Already Dispensed' : 'Ready to Dispense'}
                </p>
                {prescription.dispensed && prescription.dispensedAt && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Dispensed on {formatDateTime(prescription.dispensedAt)}
                  </p>
                )}
              </div>
            </div>
            <span className="font-mono font-bold text-lg px-3 py-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--text)' }}>
              #{prescription.tokenNumber}
            </span>
          </div>

          {/* Prescription info — minimal for pharmacy */}
          <div className="card-new p-5">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Prescription Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">PATIENT (UHID)</p>
                <p className="font-mono font-bold" style={{ color: 'var(--brand)' }}>{prescription.patientId?.uhid || '—'}</p>
              </div>
              <div>
                <p className="label">PRESCRIBED BY</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>
                  Dr. {prescription.doctorId?.name || '—'}
                  {prescription.doctorId?.specialization ? ` · ${prescription.doctorId.specialization}` : ''}
                </p>
              </div>
              <div>
                <p className="label">DATE</p>
                <p style={{ color: 'var(--text)' }}>{formatDateTime(prescription.createdAt)}</p>
              </div>
              <div>
                <p className="label">HOSPITAL</p>
                <p style={{ color: 'var(--text)' }}>{prescription.hospitalId?.name || '—'}</p>
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="card-new p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Pill className="w-4 h-4" style={{ color: 'var(--brand)' }} />
              Medicines ({prescription.medicines?.length || 0})
            </h3>
            <div className="space-y-3">
              {prescription.medicines?.map((m: any, i: number) => (
                <div key={i} className="p-4 rounded-xl"
                  style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(13,148,136,0.15)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: 'var(--text)' }}>{m.name}</p>
                      <div className="flex gap-3 flex-wrap mt-1">
                        <span className="text-sm px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--brand)' }}>
                          {m.dosage}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{m.frequency}</span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>for {m.duration}</span>
                      </div>
                      {m.instructions && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>{m.instructions}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispense button */}
          {!prescription.dispensed && (
            <button
              id="dispense-btn"
              onClick={markDispensed}
              disabled={dispensing}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {dispensing
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Dispensing...</>
                : <><CheckCircle className="w-5 h-5" /> Mark as Dispensed</>
              }
            </button>
          )}

          {/* Clear */}
          <button onClick={() => { setPrescription(null); setToken(''); setError('') }}
            className="btn-secondary w-full flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Check Another Token
          </button>
        </div>
      )}
    </div>
  )
}

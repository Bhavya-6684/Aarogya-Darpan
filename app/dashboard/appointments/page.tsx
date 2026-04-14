'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Calendar, Plus, X, Loader2, Clock, CheckCircle, XCircle,
  Building2, Stethoscope, IndianRupee, AlertCircle, ChevronDown
} from 'lucide-react'
import { formatDateTime, formatDate } from '@/lib/utils'

const STATUS_STYLE: Record<string, any> = {
  scheduled: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Scheduled' },
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelled' },
  'no-show': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'No Show' },
}

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  // Booking form
  const [hospitals, setHospitals] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedHospital, setSelectedHospital] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDoctorObj, setSelectedDoctorObj] = useState<any>(null)
  const [complaint, setComplaint] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [slotInfo, setSlotInfo] = useState<{ date: string; time: string } | null>(null)

  useEffect(() => { fetchAppointments() }, [role])
  useEffect(() => {
    if (role === 'patient') fetchHospitals()
  }, [role])

  async function fetchAppointments() {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const today = role === 'doctor' ? '?today=true' : ''
      const { data } = await axios.get(`/api/appointments${role === 'doctor' ? today : params}`)
      setAppointments(data.appointments || [])
    } catch { }
    finally { setLoading(false) }
  }

  async function fetchHospitals() {
    const { data } = await axios.get('/api/hospitals/public')
    setHospitals(data.hospitals || [])
  }

  async function fetchDoctors(hospitalId: string) {
    setDoctorsLoading(true)
    setDoctors([])
    setSelectedDoctor('')
    setSelectedDoctorObj(null)
    setSlotInfo(null)
    try {
      const { data } = await axios.get(`/api/hospitals/public?hospitalId=${hospitalId}`)
      setDoctors(data.doctors || [])
    } catch { } finally { setDoctorsLoading(false) }
  }

  function handleHospitalChange(id: string) {
    setSelectedHospital(id)
    if (id) fetchDoctors(id)
  }

  function handleDoctorChange(id: string) {
    setSelectedDoctor(id)
    const doc = doctors.find(d => d._id === id)
    setSelectedDoctorObj(doc || null)
    if (id) {
      // Auto-generate next available OPD slot
      const next = new Date()
      next.setDate(next.getDate() + 1)
      next.setHours(10, 0, 0, 0)
      setSlotInfo({
        date: next.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: '10:00 AM',
      })
    }
  }

  async function bookAppointment() {
    if (!selectedHospital || !selectedDoctor) return toast.error('Select hospital and doctor')
    setBookingLoading(true)
    try {
      const next = new Date()
      next.setDate(next.getDate() + 1)
      next.setHours(10, 0, 0, 0)

      await axios.post('/api/appointments', {
        hospitalId: selectedHospital,
        doctorId: selectedDoctor,
        type: 'OPD',
        scheduledAt: next.toISOString(),
        chiefComplaint: complaint,
        createdBy: (session?.user as any)?.id,
      })
      toast.success('Appointment booked successfully!')
      setShowModal(false)
      setSelectedHospital(''); setSelectedDoctor(''); setComplaint(''); setSlotInfo(null)
      fetchAppointments()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    await axios.patch('/api/appointments', { id, status })
    toast.success('Status updated')
    fetchAppointments()
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Appointments</h2>
          <p className="page-subtitle">
            {role === 'doctor' ? "Today's patients & upcoming" : role === 'patient' ? 'Your booked appointments' : 'All hospital appointments'}
          </p>
        </div>
        {role === 'patient' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: filter === s ? 'var(--brand)' : 'transparent',
              color: filter === s ? 'white' : 'var(--text-muted)',
              borderColor: filter === s ? 'var(--brand)' : 'var(--border)',
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card-new">
          <div className="empty-state py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <Calendar className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No appointments found</p>
            {role === 'patient' && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Click "Book Appointment" to schedule your first visit.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => {
            const st = STATUS_STYLE[apt.status] || STATUS_STYLE.scheduled
            return (
              <div key={apt._id} className="card-new p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.1)' }}>
                      <Calendar className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>
                          {apt.doctorId?.name ? `Dr. ${apt.doctorId.name}` : 'Doctor'}
                        </p>
                        {apt.doctorId?.specialization && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {apt.doctorId.specialization}</span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {apt.hospitalId?.name || '—'} · {apt.type}
                      </p>
                      {apt.chiefComplaint && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{apt.chiefComplaint}"</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDateTime(apt.scheduledAt)}</span>
                      </div>
                      {apt.patientId?.uhid && (
                        <p className="text-xs mt-1 font-mono" style={{ color: 'var(--brand)' }}>UHID: {apt.patientId.uhid}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    {['hospital_admin', 'receptionist', 'doctor'].includes(role) && apt.status === 'scheduled' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(apt._id, 'completed')}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                          title="Mark completed">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => updateStatus(apt._id, 'cancelled')}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          title="Cancel">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Book Appointment</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Hospital dropdown */}
              <div>
                <label className="label">SELECT HOSPITAL</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <select className="input-field pl-10" value={selectedHospital}
                    onChange={e => handleHospitalChange(e.target.value)}>
                    <option value="">Choose a hospital...</option>
                    {hospitals.map(h => (
                      <option key={h._id} value={h._id}>{h.name} — {h.address?.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Doctor dropdown */}
              {selectedHospital && (
                <div>
                  <label className="label">SELECT DOCTOR</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    {doctorsLoading ? (
                      <div className="input-field pl-10 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--brand)' }} />
                        <span style={{ color: 'var(--text-muted)' }}>Loading doctors...</span>
                      </div>
                    ) : (
                      <select className="input-field pl-10" value={selectedDoctor}
                        onChange={e => handleDoctorChange(e.target.value)}>
                        <option value="">Choose a doctor...</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d._id}>
                            Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''} (₹{d.opdFee || 300})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {doctors.length === 0 && !doctorsLoading && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No doctors registered at this hospital.</p>
                  )}
                </div>
              )}

              {/* OPD fee & slot info */}
              {selectedDoctorObj && slotInfo && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                    <p className="font-semibold text-sm" style={{ color: 'var(--brand)' }}>Slot Auto-Assigned</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="label">DATE</p>
                      <p style={{ color: 'var(--text)' }}>{slotInfo.date}</p>
                    </div>
                    <div>
                      <p className="label">TIME</p>
                      <p style={{ color: 'var(--text)' }}>{slotInfo.time}</p>
                    </div>
                    <div>
                      <p className="label">OPD FEE</p>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>₹{selectedDoctorObj.opdFee || 300}</p>
                    </div>
                    <div>
                      <p className="label">TYPE</p>
                      <p style={{ color: 'var(--text)' }}>OPD Consultation</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chief complaint */}
              <div>
                <label className="label">CHIEF COMPLAINT (OPTIONAL)</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Describe your symptoms briefly..."
                  value={complaint} onChange={e => setComplaint(e.target.value)} />
              </div>

              <button onClick={bookAppointment} disabled={bookingLoading || !selectedHospital || !selectedDoctor}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {bookingLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

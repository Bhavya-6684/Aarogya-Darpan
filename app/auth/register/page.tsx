'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  User, Building2, Stethoscope, ClipboardList, Beaker, ShoppingBag,
  ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Lock, Mail, Phone,
  MapPin, Hash, Briefcase, GraduationCap
} from 'lucide-react'

const ROLES = [
  { id: 'patient', label: 'Patient', icon: User, description: 'Personal health portal — prescriptions, labs, appointments', color: '#0d9488' },
  { id: 'hospital_admin', label: 'Hospital Admin', icon: Building2, description: 'Manage your hospital, patients, staff, and billing', color: '#3b82f6' },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'Patient management, prescriptions, and lab requests', color: '#8b5cf6' },
  { id: 'receptionist', label: 'Receptionist', icon: ClipboardList, description: 'Appointments, emergency registration, and billing', color: '#f59e0b' },
  { id: 'lab_technician', label: 'Lab Technician', icon: Beaker, description: 'Manage lab tests and upload patient reports', color: '#ef4444' },
  { id: 'pharmacy', label: 'Pharmacy', icon: ShoppingBag, description: 'Check prescription tokens and dispense medications', color: '#10b981' },
]

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology',
  'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry',
  'Oncology', 'Nephrology', 'Gastroenterology', 'Pulmonology', 'Radiology',
  'Anesthesiology', 'Emergency Medicine', 'Surgery', 'Urology', 'Endocrinology',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hospitals, setHospitals] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    // Patient
    dob: '', gender: '',
    // Hospital Admin
    hospitalName: '', hospitalCity: '', hospitalState: '',
    hospitalStreet: '', hospitalPincode: '', hospitalLicenseNo: '', hospitalPhone: '',
    // Doctor / Staff
    hospitalId: '', specialization: '', department: '', opdFee: '300',
    // Lab tech
    labDepartment: '',
  })

  // Load hospitals for doctor/staff roles
  useEffect(() => {
    if (['doctor', 'receptionist', 'lab_technician', 'pharmacy'].includes(selectedRole)) {
      axios.get('/api/hospitals/public').then(({ data }) => setHospitals(data.hospitals || [])).catch(() => {})
    }
  }, [selectedRole])

  async function register(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await axios.post('/api/register', { ...form, role: selectedRole })
      toast.success('Account created! Please sign in.')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  const F = (key: keyof typeof form, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-left">
        <div>
          <div className="mb-10">
            <img
              src="/logo.png"
              alt="Aarogya Darpan"
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 12px rgba(255,255,255,0.6)) brightness(1.15)' }}
            />
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join India&apos;s<br />
            <span style={{ color: '#5eead4' }}>Smartest</span><br />
            Hospital Platform
          </h2>
          <p className="text-white/60 text-lg">
            Connect patients, doctors, hospitals, labs, and pharmacies in one unified system.
          </p>
        </div>
        <div className="space-y-4">
          {[
            '🔒 End-to-end encrypted health records',
            '🤖 AI-powered symptom checker & chatbot',
            '📋 Digital prescriptions with pharmacy tokens',
            '🏥 Multi-hospital patient management',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-white/80 text-sm"><span>{f}</span></div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <Link href="/auth/login" className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create account</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Select your role to get started</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {ROLES.map(role => {
                  const Icon = role.icon
                  return (
                    <button key={role.id} id={`role-${role.id}`} onClick={() => setSelectedRole(role.id)}
                      className="p-4 rounded-2xl border text-left transition-all"
                      style={{
                        background: selectedRole === role.id ? `${role.color}10` : 'var(--card-bg)',
                        borderColor: selectedRole === role.id ? role.color : 'var(--border)',
                        borderWidth: selectedRole === role.id ? '2px' : '1.5px',
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${role.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: role.color }} />
                      </div>
                      <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>{role.label}</p>
                      <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{role.description}</p>
                    </button>
                  )
                })}
              </div>
              <button id="next-step-btn" disabled={!selectedRole} onClick={() => setStep(2)} className="btn-primary w-full">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--brand)' }}>Sign In</Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="w-4 h-4" /> Change Role
              </button>

              {/* Role badge */}
              {(() => {
                const role = ROLES.find(r => r.id === selectedRole)
                if (!role) return null
                const Icon = role.icon
                return (
                  <div className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-xl w-fit"
                    style={{ background: `${role.color}15`, border: `1.5px solid ${role.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: role.color }} />
                    <span className="text-sm font-semibold" style={{ color: role.color }}>{role.label}</span>
                  </div>
                )
              })()}

              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Complete your profile</h1>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Fill in your details to create your account</p>

              <form onSubmit={register} className="space-y-3">
                {/* Common fields */}
                <div>
                  <label className="label" htmlFor="reg-name">FULL NAME</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input id="reg-name" type="text" className="input-field pl-10" placeholder="Your full name" required
                      value={form.name} onChange={e => F('name', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="reg-email">EMAIL ADDRESS</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input id="reg-email" type="email" className="input-field pl-10" placeholder="you@example.com" required
                      value={form.email} onChange={e => F('email', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="reg-password">PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input id="reg-password" type={showPassword ? 'text' : 'password'}
                      className="input-field pl-10 pr-10" placeholder="Min. 8 characters" required minLength={8}
                      value={form.password} onChange={e => F('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="reg-phone">PHONE NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input id="reg-phone" type="tel" className="input-field pl-10" placeholder="+91 99999 99999"
                      value={form.phone} onChange={e => F('phone', e.target.value)} />
                  </div>
                </div>

                {/* ===== PATIENT ===== */}
                {selectedRole === 'patient' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">DATE OF BIRTH</label>
                      <input type="date" className="input-field" required value={form.dob} onChange={e => F('dob', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">GENDER</label>
                      <select className="input-field" required value={form.gender} onChange={e => F('gender', e.target.value)}>
                        <option value="">Select...</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ===== HOSPITAL ADMIN ===== */}
                {selectedRole === 'hospital_admin' && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold uppercase tracking-widest pt-1 pb-0.5" style={{ color: 'var(--brand)' }}>
                      Hospital Details
                    </div>
                    <div>
                      <label className="label">HOSPITAL NAME *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input className="input-field pl-10" placeholder="e.g. Apollo City Hospital" required
                          value={form.hospitalName} onChange={e => F('hospitalName', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">LICENSE / REGISTRATION NUMBER</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input className="input-field pl-10" placeholder="e.g. MH-HOS-2021-12345"
                          value={form.hospitalLicenseNo} onChange={e => F('hospitalLicenseNo', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">HOSPITAL ADDRESS</label>
                      <input className="input-field" placeholder="Street address"
                        value={form.hospitalStreet} onChange={e => F('hospitalStreet', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label">CITY *</label>
                        <input className="input-field" placeholder="Mumbai" required
                          value={form.hospitalCity} onChange={e => F('hospitalCity', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">STATE *</label>
                        <input className="input-field" placeholder="Maharashtra" required
                          value={form.hospitalState} onChange={e => F('hospitalState', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">PINCODE</label>
                        <input className="input-field" placeholder="400001"
                          value={form.hospitalPincode} onChange={e => F('hospitalPincode', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">HOSPITAL PHONE</label>
                      <input className="input-field" placeholder="+91 22 1234 5678"
                        value={form.hospitalPhone} onChange={e => F('hospitalPhone', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* ===== DOCTOR ===== */}
                {selectedRole === 'doctor' && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: '#8b5cf6' }}>
                      Professional Details
                    </div>
                    <div>
                      <label className="label">HOSPITAL *</label>
                      <select className="input-field" required value={form.hospitalId} onChange={e => F('hospitalId', e.target.value)}>
                        <option value="">Select hospital...</option>
                        {hospitals.map((h: any) => (
                          <option key={h._id} value={h._id}>{h.name} — {h.address?.city}</option>
                        ))}
                      </select>
                      {hospitals.length === 0 && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No hospitals registered yet.</p>}
                    </div>
                    <div>
                      <label className="label">SPECIALIZATION *</label>
                      <select className="input-field" required value={form.specialization} onChange={e => F('specialization', e.target.value)}>
                        <option value="">Select specialization...</option>
                        {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">DEPARTMENT</label>
                        <input className="input-field" placeholder="e.g. Cardiology"
                          value={form.department} onChange={e => F('department', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">OPD FEE (₹)</label>
                        <input type="number" className="input-field" placeholder="300"
                          value={form.opdFee} onChange={e => F('opdFee', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== RECEPTIONIST / LAB TECH / PHARMACY ===== */}
                {['receptionist', 'lab_technician', 'pharmacy'].includes(selectedRole) && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: 'var(--brand)' }}>
                      Work Details
                    </div>
                    <div>
                      <label className="label">HOSPITAL</label>
                      <select className="input-field" value={form.hospitalId} onChange={e => F('hospitalId', e.target.value)}>
                        <option value="">Select hospital (optional)...</option>
                        {hospitals.map((h: any) => (
                          <option key={h._id} value={h._id}>{h.name} — {h.address?.city}</option>
                        ))}
                      </select>
                    </div>
                    {selectedRole === 'lab_technician' && (
                      <div>
                        <label className="label">LAB DEPARTMENT</label>
                        <input className="input-field" placeholder="e.g. Haematology, Biochemistry"
                          value={form.labDepartment} onChange={e => F('labDepartment', e.target.value)} />
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" id="create-account-btn" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

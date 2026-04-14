'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Receipt, Plus, X, Loader2, Search, IndianRupee, CheckCircle,
  Clock, AlertCircle, User, FileText, Printer, CreditCard
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

const STATUS_STYLE: Record<string, any> = {
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pending' },
  partial: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Partial' },
  paid: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Paid' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelled' },
}

export default function BillingPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [patientFound, setPatientFound] = useState<any>(null)
  const [lookingUp, setLookingUp] = useState(false)

  const [form, setForm] = useState({
    patientUhid: '',
    items: [{ description: '', amount: '' }],
    discount: '',
    notes: '',
    paymentMode: 'cash',
  })

  useEffect(() => { fetchBills() }, [role])

  async function fetchBills() {
    try {
      const { data } = await axios.get('/api/bills')
      setBills(data.bills || [])
    } catch { toast.error('Could not load bills') }
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
    } catch { toast.error('Lookup failed') } finally { setLookingUp(false) }
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }))
  }
  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))
  }
  function updateItem(i: number, field: string, val: string) {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [field]: val }
      return { ...f, items }
    })
  }

  const totalAmount = form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0) - (parseFloat(form.discount) || 0)

  async function createBill() {
    if (!patientFound) return toast.error('Find a patient first')
    if (form.items.some(i => !i.description || !i.amount)) return toast.error('Fill all line items')
    setCreating(true)
    try {
      await axios.post('/api/bills', {
        patientId: patientFound._id,
        items: form.items.map(i => ({ description: i.description, amount: parseFloat(i.amount) })),
        totalAmount: Math.max(0, totalAmount),
        discount: parseFloat(form.discount) || 0,
        paidAmount: 0,
        status: 'pending',
        notes: form.notes,
        paymentMode: form.paymentMode,
      })
      toast.success('Invoice created!')
      setShowCreate(false)
      setForm({ patientUhid: '', items: [{ description: '', amount: '' }], discount: '', notes: '', paymentMode: 'cash' })
      setPatientFound(null)
      fetchBills()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create bill')
    } finally { setCreating(false) }
  }

  async function markPaid(id: string, totalAmount: number) {
    await axios.patch('/api/bills', { id, status: 'paid', paidAmount: totalAmount })
    toast.success('Marked as paid')
    fetchBills()
  }

  const filtered = bills.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.patientId?.uhid?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalOutstanding = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (b.totalAmount - (b.paidAmount || 0)), 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">{role === 'patient' ? 'My Bills' : 'Billing'}</h2>
          <p className="page-subtitle">
            {role === 'patient' ? 'All your hospital invoices' : 'Manage patient invoices and payments'}
          </p>
        </div>
        {['hospital_admin', 'receptionist'].includes(role) && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        )}
      </div>

      {/* Summary */}
      {bills.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Bills', value: bills.length, color: '#3b82f6' },
            { label: 'Paid', value: bills.filter(b => b.status === 'paid').length, color: '#10b981' },
            { label: 'Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card-new">
              <p className="stat-value" style={{ color }}>{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-10" placeholder="Search by invoice# or patient..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'partial', 'paid'].map(s => (
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Receipt className="w-7 h-7 text-yellow-500" />
            </div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>No invoices found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {role === 'patient' ? 'Bills from hospital visits will appear here.' : 'Create an invoice to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending
            return (
              <div key={b._id} className="card-new p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <Receipt className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold font-mono" style={{ color: 'var(--text)' }}>{b.billNumber}</p>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      {b.patientId?.uhid && (
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--brand)' }}>UHID: {b.patientId.uhid}</p>
                      )}
                      {b.items?.length > 0 && (
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                          {b.items.map((i: any) => i.description).join(', ')}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(b.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                      ₹{b.totalAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                    {b.paidAmount > 0 && b.status !== 'paid' && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Paid: ₹{b.paidAmount?.toLocaleString('en-IN')}</p>
                    )}
                    {['hospital_admin', 'receptionist'].includes(role) && b.status !== 'paid' && (
                      <button onClick={() => markPaid(b._id, b.totalAmount)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Create Invoice</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Patient */}
              <div>
                <label className="label">PATIENT UHID *</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" placeholder="e.g. AD-2026-1234"
                    value={form.patientUhid} onChange={e => setForm(f => ({ ...f, patientUhid: e.target.value }))}
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

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">LINE ITEMS *</label>
                  <button onClick={addItem} className="text-xs btn-secondary px-3 py-1 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="input-field flex-1 text-sm" placeholder="Description (e.g. OPD Fee)"
                        value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                      <input className="input-field w-28 text-sm" type="number" placeholder="₹ Amount"
                        value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">DISCOUNT (₹)</label>
                  <input type="number" className="input-field" placeholder="0"
                    value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">PAYMENT MODE</label>
                  <select className="input-field" value={form.paymentMode}
                    onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>Total Amount</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>₹{Math.max(0, totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="label">NOTES</label>
                <input className="input-field" placeholder="Additional notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button onClick={createBill} disabled={creating} className="btn-primary w-full">
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

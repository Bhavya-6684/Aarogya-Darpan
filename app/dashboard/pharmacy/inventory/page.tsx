'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Pill, Plus, Search, AlertTriangle, PackageX, X, Loader2,
  ChevronDown, Trash2, Edit2, Save, RefreshCw, TrendingDown,
  Calendar, BarChart2, IndianRupee, Package
} from 'lucide-react'

const CATEGORIES = [
  'Antibiotic', 'Painkiller', 'Antiviral', 'Antifungal', 'Antiparasitic',
  'Antihypertensive', 'Antidiabetic', 'Anticoagulant', 'Antidepressant',
  'Antihistamine', 'Antacid', 'Antiseptic', 'Vitamin/Supplement',
  'Steroid', 'Bronchodilator', 'Diuretic', 'Vaccine', 'Other',
]

const UNITS = ['tablet', 'capsule', 'ml', 'mg', 'g', 'syrup (ml)', 'injection', 'cream (g)', 'drops', 'patch', 'inhaler']

const TABS = ['all', 'expired', 'expiring-soon', 'low-stock'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  all: 'All Medicines',
  expired: 'Expired',
  'expiring-soon': 'Expiring Soon',
  'low-stock': 'Low Stock',
}

const TAB_COLORS: Record<Tab, string> = {
  all: 'var(--brand)',
  expired: '#ef4444',
  'expiring-soon': '#f59e0b',
  'low-stock': '#8b5cf6',
}

function isExpired(date: string) { return new Date(date) <= new Date() }
function isExpiringSoon(date: string) {
  const d = new Date(date)
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return d > new Date() && d <= soon
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const emptyForm = {
  name: '', genericName: '', category: 'Antibiotic', manufacturer: '',
  batchNumber: '', expiryDate: '', quantity: '', minStockLevel: '10',
  unitPrice: '', sellingPrice: '', unit: 'tablet', description: '',
}

export default function PharmacyInventoryPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [counts, setCounts] = useState({ all: 0, expired: 0, 'expiring-soon': 0, 'low-stock': 0 })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async (t: Tab, s: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter: t, search: s })
      const { data } = await axios.get(`/api/pharmacy/inventory?${params}`)
      setMedicines(data.medicines || [])
    } catch { toast.error('Failed to load medicines') }
    finally { setLoading(false) }
  }, [])

  // Load counts for all tabs
  async function loadCounts() {
    try {
      const [all, expired, expiringSoon, lowStock] = await Promise.all([
        axios.get('/api/pharmacy/inventory?filter=all'),
        axios.get('/api/pharmacy/inventory?filter=expired'),
        axios.get('/api/pharmacy/inventory?filter=expiring-soon'),
        axios.get('/api/pharmacy/inventory?filter=low-stock'),
      ])
      setCounts({
        all: all.data.medicines?.length || 0,
        expired: expired.data.medicines?.length || 0,
        'expiring-soon': expiringSoon.data.medicines?.length || 0,
        'low-stock': lowStock.data.medicines?.length || 0,
      })
    } catch {}
  }

  useEffect(() => { load(tab, search) }, [tab, search, load])
  useEffect(() => { loadCounts() }, [])

  function F(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function addMedicine(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.category || !form.expiryDate || form.quantity === '') {
      toast.error('Fill in all required fields')
      return
    }
    setSaving(true)
    try {
      await axios.post('/api/pharmacy/inventory', form)
      toast.success(`${form.name} added to inventory!`)
      setForm({ ...emptyForm })
      setShowAdd(false)
      load(tab, search)
      loadCounts()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add medicine')
    } finally { setSaving(false) }
  }

  async function deleteMedicine(id: string) {
    try {
      await axios.delete(`/api/pharmacy/inventory?id=${id}`)
      toast.success('Medicine removed')
      setDeleteId(null)
      load(tab, search)
      loadCounts()
    } catch { toast.error('Failed to delete') }
  }

  const getStatusBadge = (m: any) => {
    if (isExpired(m.expiryDate)) return { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    if (isExpiringSoon(m.expiryDate)) return { label: 'Expiring Soon', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    if (m.quantity <= m.minStockLevel) return { label: 'Low Stock', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
    return { label: 'In Stock', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Medicine Inventory</h2>
          <p className="page-subtitle">Manage your pharmacy stock</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="card-new p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: tab === t ? TAB_COLORS[t] : 'var(--border)', borderWidth: tab === t ? '2px' : '1px' }}>
            <p className="text-2xl font-bold" style={{ color: TAB_COLORS[t] }}>{counts[t]}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{TAB_LABELS[t]}</p>
          </button>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input-field pl-9 w-full"
            placeholder="Search by name, generic name, batch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t ? TAB_COLORS[t] : 'var(--surface)',
                color: tab === t ? '#fff' : 'var(--text-muted)',
              }}>
              {TAB_LABELS[t]}
              {counts[t] > 0 && t !== 'all' && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: tab === t ? 'rgba(255,255,255,0.25)' : 'var(--border-subtle)' }}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Medicine List */}
      <div className="card-new overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Pill className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>
              {tab === 'expired' ? 'No expired medicines found' :
               tab === 'expiring-soon' ? 'No medicines expiring soon' :
               tab === 'low-stock' ? 'All medicines are well-stocked' :
               'No medicines in inventory. Add your first medicine!'}
            </p>
            {tab === 'all' && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Medicine
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Medicine', 'Category', 'Batch / Expiry', 'Stock', 'Price', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => {
                  const badge = getStatusBadge(m)
                  return (
                    <tr key={m._id}
                      className="transition-colors"
                      style={{
                        borderBottom: i < medicines.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: isExpired(m.expiryDate) ? 'rgba(239,68,68,0.03)' : 'transparent',
                      }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{m.name}</p>
                        {m.genericName && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.genericName}</p>}
                        {m.manufacturer && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.manufacturer}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(13,148,136,0.08)', color: 'var(--brand)' }}>
                          {m.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch: {m.batchNumber || '—'}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: isExpired(m.expiryDate) ? '#ef4444' : isExpiringSoon(m.expiryDate) ? '#f59e0b' : 'var(--text)' }}>
                          {formatDate(m.expiryDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-lg" style={{ color: m.quantity <= m.minStockLevel ? '#8b5cf6' : 'var(--text)' }}>
                          {m.quantity}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.unit}s · min {m.minStockLevel}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>₹{m.sellingPrice || 0}</p>
                        {m.unitPrice > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cost ₹{m.unitPrice}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(m._id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sticky top-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Pill className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text)' }}>Add Medicine</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add a new medicine to inventory</p>
                </div>
              </div>
              <button onClick={() => { setShowAdd(false); setForm({ ...emptyForm }) }} style={{ color: 'var(--text-muted)' }} className="hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={addMedicine} className="p-5 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">MEDICINE NAME *</label>
                  <input className="input-field" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => F('name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">GENERIC NAME</label>
                  <input className="input-field" placeholder="e.g. Acetaminophen" value={form.genericName} onChange={e => F('genericName', e.target.value)} />
                </div>
                <div>
                  <label className="label">CATEGORY *</label>
                  <select className="input-field" value={form.category} onChange={e => F('category', e.target.value)} required>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">MANUFACTURER</label>
                  <input className="input-field" placeholder="e.g. Sun Pharma" value={form.manufacturer} onChange={e => F('manufacturer', e.target.value)} />
                </div>
                <div>
                  <label className="label">UNIT</label>
                  <select className="input-field" value={form.unit} onChange={e => F('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Stock & Batch */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">BATCH NUMBER</label>
                  <input className="input-field" placeholder="e.g. BH2024001" value={form.batchNumber} onChange={e => F('batchNumber', e.target.value)} />
                </div>
                <div>
                  <label className="label">EXPIRY DATE *</label>
                  <input className="input-field" type="date" value={form.expiryDate} onChange={e => F('expiryDate', e.target.value)} required
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">QUANTITY *</label>
                  <input className="input-field" type="number" placeholder="100" min="0" value={form.quantity} onChange={e => F('quantity', e.target.value)} required />
                </div>
                <div>
                  <label className="label">MIN STOCK LEVEL</label>
                  <input className="input-field" type="number" placeholder="10" min="0" value={form.minStockLevel} onChange={e => F('minStockLevel', e.target.value)} />
                </div>
                <div>
                  <label className="label">COST PRICE (₹)</label>
                  <input className="input-field" type="number" placeholder="5" min="0" step="0.01" value={form.unitPrice} onChange={e => F('unitPrice', e.target.value)} />
                </div>
                <div>
                  <label className="label">SELLING PRICE (₹)</label>
                  <input className="input-field" type="number" placeholder="8" min="0" step="0.01" value={form.sellingPrice} onChange={e => F('sellingPrice', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">DESCRIPTION (optional)</label>
                <textarea className="input-field" rows={2} placeholder="Usage notes, dosage info..." value={form.description} onChange={e => F('description', e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAdd(false); setForm({ ...emptyForm }) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Remove Medicine?</h3>
            <p style={{ color: 'var(--text-muted)' }}>This will permanently remove this medicine from inventory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMedicine(deleteId)} className="flex-1 px-4 py-2 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

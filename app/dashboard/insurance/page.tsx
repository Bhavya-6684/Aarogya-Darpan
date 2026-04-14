'use client'
import { Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function InsurancePage() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h2 className="page-title">Insurance</h2>
        <p className="page-subtitle">Manage insurance claims and coverage</p>
      </div>
      <div className="card-new">
        <div className="empty-state py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--brand)' }} />
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Insurance Module</p>
          <p className="text-sm mt-2 max-w-xs mx-auto text-center" style={{ color: 'var(--text-muted)' }}>
            Insurance claim management will be available in the next release. You can manage billing for now via the Billing section.
          </p>
          <Link href="/dashboard/billing" className="btn-primary mt-6">Go to Billing</Link>
        </div>
      </div>
    </div>
  )
}

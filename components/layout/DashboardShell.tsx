'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Heart, LayoutDashboard, Users, Calendar, FileText, BedDouble,
  FlaskConical, CreditCard, UserCog, BarChart3,
  LogOut, ChevronRight, Settings, Shield, Activity,
  Pill, Beaker, Receipt, AlertCircle, Menu, X,
  ClipboardList, ShoppingBag, Bell, Sun, Moon, Lock,
  UserSearch, Package, PackageX,
} from 'lucide-react'
import axios from 'axios'
import AIChatbot from '@/components/AIChatbot'

interface NavItem { href: string; icon: any; label: string }
interface NavSection { sectionLabel?: string; items: NavItem[] }
type Role = 'patient' | 'hospital_admin' | 'doctor' | 'receptionist' | 'lab_technician' | 'pharmacy'

const NAV_CONFIG: Record<Role, NavSection[]> = {
  patient: [
    {
      sectionLabel: 'PATIENT',
      items: [
        { href: '/dashboard', icon: Heart, label: 'My Health' },
        { href: '/dashboard/prescriptions', icon: Pill, label: 'Prescriptions' },
        { href: '/dashboard/labs', icon: FlaskConical, label: 'Lab Reports' },
        { href: '/dashboard/billing', icon: Receipt, label: 'Bills' },
        { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
        { href: '/dashboard/family', icon: Users, label: 'Family' },
      ],
    },
  ],
  hospital_admin: [
    {
      sectionLabel: 'HOSPITAL',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/patients', icon: Users, label: 'Patients' },
        { href: '/dashboard/beds', icon: BedDouble, label: 'Beds' },
        { href: '/dashboard/staff', icon: UserCog, label: 'Doctors & Staff' },
        { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
      ],
    },
    {
      sectionLabel: 'CLINICAL',
      items: [
        { href: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
        { href: '/dashboard/labs', icon: FlaskConical, label: 'Laboratory' },
        { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
        { href: '/dashboard/insurance', icon: Shield, label: 'Insurance' },
      ],
    },
    {
      sectionLabel: 'ADMIN',
      items: [
        { href: '/dashboard/analytics', icon: BarChart3, label: 'Reports' },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  doctor: [
    {
      sectionLabel: 'CLINICAL',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/patients', icon: Users, label: 'My Patients' },
        { href: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
        { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
        { href: '/dashboard/patients?tab=access', icon: UserSearch, label: 'Patient Access' },
      ],
    },
  ],
  receptionist: [
    {
      sectionLabel: 'RECEPTION',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/emergency', icon: AlertCircle, label: 'Registration' },
        { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
        { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
        { href: '/dashboard/patients', icon: Users, label: 'Patients' },
      ],
    },
  ],
  lab_technician: [
    {
      sectionLabel: 'LABORATORY',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/labs', icon: Beaker, label: 'Test Reports' },
      ],
    },
  ],
  pharmacy: [
    {
      sectionLabel: 'PHARMACY',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/pharmacy/check-token', icon: ShoppingBag, label: 'Check Token' },
        { href: '/dashboard/pharmacy/inventory', icon: Package, label: 'Medicine Inventory' },
        { href: '/dashboard/prescriptions', icon: ClipboardList, label: 'All Prescriptions' },
      ],
    },
  ],
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = ((session?.user as any)?.role || 'patient') as Role

  const [darkMode, setDarkMode] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hospitalName, setHospitalName] = useState('')

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    axios.get('/api/notifications').then(({ data }) => {
      setUnreadCount(data.unreadCount || 0)
    }).catch(() => {})
  }, [])

  // Fetch hospital name for staff roles
  useEffect(() => {
    if (['hospital_admin', 'doctor', 'receptionist', 'lab_technician', 'pharmacy'].includes(role)) {
      axios.get('/api/analytics').then(({ data }) => {
        if (data.hospital?.name) setHospitalName(data.hospital.name)
      }).catch(() => {})
    }
  }, [role])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  function isActive(href: string) {
    const cleanHref = href.split('?')[0]
    if (cleanHref === '/dashboard') return pathname === cleanHref
    return pathname.startsWith(cleanHref)
  }

  const navSections = NAV_CONFIG[role] || NAV_CONFIG.patient

  const roleLabel =
    role === 'hospital_admin' ? 'HOSPITAL ADMIN' :
    role === 'lab_technician' ? 'LAB' :
    role.toUpperCase()

  const subLabel =
    role === 'patient' ? (session?.user?.name || '') :
    hospitalName || '—'

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Aarogya Darpan"
          style={{
            height: '38px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4)) brightness(1.2)',
          }}
        />
      </div>

      {/* Role label */}
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{roleLabel}</p>
        <p className="text-white text-sm font-semibold truncate" style={{ maxWidth: '168px' }}>{subLabel}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map((section, si) => (
          <div key={si} className="sidebar-section">
            {section.sectionLabel && (
              <p className="sidebar-section-label">{section.sectionLabel}</p>
            )}
            {section.items.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-nav-item ${isActive(href) ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {isActive(href) && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'var(--brand)' }}>
            {(session?.user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm truncate">{session?.user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--sidebar-muted)' }}>{session?.user?.email}</p>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </>
  )

  return (
    <div className={`dashboard-layout ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar absolute left-0 top-0 bottom-0 flex flex-col w-64 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <span className="topbar-title">
              {navSections.flatMap(s => s.items).find(i => isActive(i.href))?.label || 'Overview'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* ENC badge */}
            <div className="enc-badge hidden sm:flex">
              <Lock className="w-3 h-3" />
              ENC
            </div>

            {/* Dark mode */}
            <button
              id="dark-mode-toggle"
              onClick={toggleDark}
              className="btn-ghost p-2 rounded-xl"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <Link href="/dashboard/notifications" className="relative btn-ghost p-2 rounded-xl">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link href="/dashboard/profile" id="profile-btn"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--brand)' }}>
              {(session?.user?.name || 'U')[0].toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="page-scroll animate-fade-in">
          {children}
        </main>
      </div>
      <AIChatbot />
    </div>
  )
}

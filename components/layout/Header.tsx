'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/patients': 'Patients',
  '/dashboard/appointments': 'Appointments',
  '/dashboard/records': 'Medical Records',
  '/dashboard/beds': 'Bed Management',
  '/dashboard/labs': 'Lab Reports',
  '/dashboard/billing': 'Billing',
  '/dashboard/staff': 'Staff Management',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/ai/symptom-checker': 'AI Symptom Checker',
  '/dashboard/ai/chatbot': 'Health Chatbot',
}

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Find best matching title
  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path))?.[1] || 'Dashboard'

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div>
        <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
        <p className="text-xs text-gray-400">
          {greeting}, {session?.user?.name?.split(' ')[0]} — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button id="search-btn" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button id="notifications-btn" className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
          {(session?.user?.name || 'U')[0].toUpperCase()}
        </div>
      </div>
    </header>
  )
}

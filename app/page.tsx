import Link from 'next/link'
import {
  Heart, Shield, Zap, FileText, Users, Activity, BedDouble,
  FlaskConical, CreditCard, ChevronRight, CheckCircle2, Brain,
  ArrowRight, Star
} from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="Aarogya Darpan" style={{ height: '46px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-brand-600 transition-colors">For Teams</a>
            <a href="#ai" className="hover:text-brand-600 transition-colors">AI Tools</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth/register"
              className="btn-primary text-sm py-2.5 flex items-center gap-1.5">
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-brand-300" />
            AI-Powered Hospital Management System
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight animate-slide-up">
            Modern Healthcare,
            <br />
            <em className="text-brand-300">Completely Digital</em>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Secure end-to-end hospital management — from patient records to billing — with enterprise-grade privacy, role-based access control, and AI-powered clinical tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/register"
              className="bg-white text-navy-800 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all duration-200 hover:shadow-2xl hover:shadow-white/20 active:scale-95 flex items-center justify-center gap-2 text-lg">
              + Get Started Free
            </Link>
            <Link href="/auth/login"
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 text-lg">
              → Sign In
            </Link>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: Shield, label: 'Privacy First', desc: '256-bit AES encrypted patient data' },
              { icon: Zap, label: 'Real-Time', desc: 'Live bed & staff management' },
              { icon: FileText, label: 'Paperless', desc: 'Complete digital clinical workflow' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-5 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand-300" />
                </div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-white/60 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5+', label: 'Role-Based Portals' },
              { value: '10+', label: 'Clinical Modules' },
              { value: '256-bit', label: 'AES Encryption' },
              { value: 'AI', label: 'Powered Symptom Check' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-brand-600 mb-2">{value}</div>
                <div className="text-gray-500 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything a Modern Hospital Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              A complete suite of tools built for every role in the hospital ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users, title: 'Patient Management', color: 'blue',
                features: ['UHID generation', 'Electronic health records', 'Medical history & allergies', 'Emergency contacts'],
              },
              {
                icon: Activity, title: 'Appointment Scheduling', color: 'brand',
                features: ['OPD / IPD / Emergency', 'Doctor-wise calendar', 'Status tracking', 'Chief complaint logging'],
              },
              {
                icon: FileText, title: 'Medical Records', color: 'purple',
                features: ['Digital prescriptions', 'Diagnosis & ICD codes', 'Vital signs tracking', 'Follow-up scheduling'],
              },
              {
                icon: BedDouble, title: 'Bed Management', color: 'teal',
                features: ['Real-time bed grid', 'Ward-wise tracking', 'ICU / HDU / Private', 'Admit & discharge flow'],
              },
              {
                icon: FlaskConical, title: 'Lab Reports', color: 'amber',
                features: ['Lab request ordering', 'Result upload', 'Abnormal flagging', 'Urgency levels: STAT / Urgent'],
              },
              {
                icon: CreditCard, title: 'Integrated Billing', color: 'green',
                features: ['Itemized invoices', 'Multi-payment methods', 'Discount & tax handling', 'Payment status tracking'],
              },
            ].map(({ icon: Icon, title, color, features }) => (
              <div key={title} className="card p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${color === 'brand' ? 'brand' : color}-50`}>
                  <Icon className={`w-6 h-6 text-${color === 'brand' ? 'brand' : color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-24 px-6 bg-gradient-to-br from-navy-900 to-brand-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Every Role
            </h2>
            <p className="text-white/70 text-lg">
              Each user sees exactly what they need — nothing more, nothing less.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { role: 'Hospital Admin', emoji: '🏥', perms: ['Full system control', 'Staff management', 'Analytics & reports', 'Billing oversight'] },
              { role: 'Doctor', emoji: '👨‍⚕️', perms: ['OPD queue management', 'Digital prescriptions', 'Lab requests', 'Patient history'] },
              { role: 'Receptionist', emoji: '🧑‍💼', perms: ['Patient registration', 'Appointment booking', 'Bill generation', 'Bed assignment'] },
              { role: 'Lab Technician', emoji: '🔬', perms: ['View pending requests', 'Upload results', 'Mark abnormals', 'STAT prioritization'] },
              { role: 'Patient', emoji: '🧑', perms: ['View appointments', 'Download prescriptions', 'View lab reports', 'Bill history'] },
              { role: 'AI Assistant', emoji: '🤖', perms: ['Symptom checker', 'Health chatbot', 'Personalized tips', 'Available 24/7'] },
            ].map(({ role, emoji, perms }) => (
              <div key={role} className="glass-card p-6">
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-bold text-white text-lg mb-3">{role}</h3>
                <ul className="space-y-2">
                  {perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-2 text-purple-700 text-sm font-semibold mb-6">
                <Brain className="w-4 h-4" />
                AI-Powered Features
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Intelligent Healthcare at Your Fingertips
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                Embedded AI tools help patients and clinicians make better decisions — from symptom triage to personalized health insights.
              </p>
              <div className="space-y-6">
                {[
                  {
                    icon: Brain, title: 'Symptom Checker',
                    desc: 'Input symptoms and get AI-powered likely conditions, urgency level, recommended specialist, and self-care advice.',
                  },
                  {
                    icon: Heart, title: 'Health Chatbot (Aarogya)',
                    desc: 'A 24/7 health assistant for questions about medications, test results, lifestyle, and navigation of hospital services.',
                  },
                  {
                    icon: Star, title: 'Personalized Recommendations',
                    desc: 'Post-consultation health tips, medication reminders, and follow-up schedules based on your diagnosis.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                      <p className="text-gray-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-brand-600 p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">Aarogya AI</p>
                    <p className="text-white/70 text-xs">Health Assistant • Online</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-sm">
                    I'm experiencing fever, headache, and body aches for 2 days.
                  </div>
                  <div className="bg-white/20 rounded-2xl rounded-tr-none p-4 ml-6 text-sm">
                    Based on your symptoms — fever, headache, and body aches — this could indicate:
                    <br /><br />
                    🔴 <strong>Viral fever</strong> (high confidence)<br />
                    🟡 <strong>Dengue</strong> (medium – if fever spikes)<br />
                    🟢 <strong>Malaria</strong> (low – depends on region)
                    <br /><br />
                    <strong>Urgency: Urgent</strong> — Please consult a General Physician within 24 hours. Watch for: platelet drop, severe headache, rash.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand-600 to-navy-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Go Paperless?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Join hospitals already running on Aarogya Darpan. Set up your hospital in under 5 minutes — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="bg-white text-navy-800 font-bold px-10 py-4 rounded-2xl hover:bg-brand-50 transition-all duration-200 hover:shadow-2xl active:scale-95 text-lg flex items-center justify-center gap-2">
              Register Your Hospital <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login"
              className="border-2 border-white/30 text-white font-bold px-10 py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 text-lg flex items-center justify-center">
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-navy-900 text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/logo.png" alt="Aarogya Darpan" style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 8px rgba(255,255,255,0.5)) brightness(1.3)' }} />
          </div>
          <p className="text-sm">© 2024 Aarogya Darpan. Built for modern healthcare.</p>
          <p className="text-sm">256-bit AES • HIPAA-inspired • Role-based</p>
        </div>
      </footer>
    </main>
  )
}

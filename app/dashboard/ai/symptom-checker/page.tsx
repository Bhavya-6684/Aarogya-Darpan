'use client'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Brain, Plus, Trash2, AlertTriangle, CheckCircle2, Loader2,
  Stethoscope, ShieldAlert, Heart, Info, X
} from 'lucide-react'

interface Result {
  possibleConditions: Array<{ name: string; confidence: 'high' | 'medium' | 'low'; description: string }>
  urgency: 'emergency' | 'urgent' | 'routine'
  specialist: string
  redFlags: string[]
  selfCare: string[]
  disclaimer: string
  source: string
}

const CONFIDENCE_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-green-600 bg-green-50 border-green-200',
}

const URGENCY_STYLES = {
  emergency: { classes: 'bg-red-50 border-red-200 text-red-800', icon: ShieldAlert, label: '🚨 Emergency — Seek immediate care' },
  urgent: { classes: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle, label: '⚠️ Urgent — See a doctor within 24 hours' },
  routine: { classes: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2, label: '✅ Routine — Schedule a doctor visit' },
}

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Chest pain', 'Shortness of breath',
  'Nausea', 'Abdominal pain', 'Dizziness', 'Joint pain', 'Back pain',
  'Fatigue', 'Sore throat', 'Rash', 'Body aches',
]

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  function addSymptom(s: string) {
    if (s.trim() && !symptoms.includes(s.trim())) {
      setSymptoms((prev) => [...prev, s.trim()])
      setInput('')
    }
  }

  function removeSymptom(s: string) {
    setSymptoms((prev) => prev.filter((x) => x !== s))
  }

  async function checkSymptoms() {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const { data } = await axios.post('/api/ai/symptom-check', { symptoms, age, gender })
      setResult(data)
    } catch {
      toast.error('Failed to analyze symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const urgencyStyle = result ? URGENCY_STYLES[result.urgency] : null

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="page-title">AI Symptom Checker</h2>
            <p className="page-subtitle">Enter your symptoms for intelligent analysis and triage guidance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-gray-900">Your Symptoms</h3>

          {/* Symptom input */}
          <div>
            <label className="label">ADD SYMPTOM</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Type a symptom..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSymptom(input)}
              />
              <button
                id="add-symptom-btn"
                onClick={() => addSymptom(input)}
                className="btn-primary px-4 py-3"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Common symptoms */}
          <div>
            <label className="label">COMMON SYMPTOMS</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => addSymptom(s)}
                  disabled={symptoms.includes(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    symptoms.includes(s)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Selected symptoms */}
          {symptoms.length > 0 && (
            <div>
              <label className="label">SELECTED ({symptoms.length})</label>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-sm px-3 py-1.5 rounded-full border border-brand-200 font-medium">
                    {s}
                    <button onClick={() => removeSymptom(s)} className="hover:text-brand-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Patient details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="symptom-age">AGE</label>
              <input id="symptom-age" className="input-field" placeholder="e.g. 35"
                value={age} onChange={(e) => setAge(e.target.value)} type="number" min="0" max="120" />
            </div>
            <div>
              <label className="label" htmlFor="symptom-gender">GENDER</label>
              <select id="symptom-gender" className="input-field"
                value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            id="analyze-symptoms-btn"
            onClick={checkSymptoms}
            disabled={loading || symptoms.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Brain className="w-5 h-5" /> Analyze Symptoms</>}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="card p-8 text-center text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Results appear here</p>
              <p className="text-sm mt-1">Add symptoms and click Analyze</p>
            </div>
          )}

          {loading && (
            <div className="card p-8 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="font-medium text-gray-700">Analyzing your symptoms...</p>
              <p className="text-xs text-gray-400 mt-1">{result?.source === 'ai' ? 'Using AI model' : 'Using clinical rules'}</p>
            </div>
          )}

          {result && (
            <>
              {/* Urgency banner */}
              {urgencyStyle && (
                <div className={`p-4 rounded-xl border ${urgencyStyle.classes} flex items-center gap-3`}>
                  <urgencyStyle.icon className="w-5 h-5 flex-shrink-0" />
                  <p className="font-bold">{urgencyStyle.label}</p>
                </div>
              )}

              {/* Conditions */}
              <div className="card p-5">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-brand-500" />
                  Possible Conditions
                </h4>
                <div className="space-y-3">
                  {result.possibleConditions.map((c, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${CONFIDENCE_COLORS[c.confidence]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{c.name}</p>
                        <span className="text-xs font-bold uppercase">{c.confidence}</span>
                      </div>
                      {c.description && <p className="text-xs opacity-80">{c.description}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <strong>Recommended Specialist:</strong> {result.specialist}
                  </p>
                </div>
              </div>

              {/* Red flags */}
              <div className="card p-5">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Warning Signs — Seek Emergency Care If:
                </h4>
                <ul className="space-y-2">
                  {result.redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Self-care */}
              <div className="card p-5">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-500" />
                  Self-Care Advice
                </h4>
                <ul className="space-y-2">
                  {result.selfCare.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex gap-2">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">{result.disclaimer}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

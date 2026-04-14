'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Sparkles, RefreshCw, ChevronDown, Minimize2
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

const QUICK_PROMPTS = [
  'I have a headache',
  'How to lower blood pressure?',
  'What should I eat for diabetes?',
  'I feel stressed and anxious',
  'How much sleep do I need?',
  'Tips for weight loss',
]

function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(text: string) {
  // Simple markdown: bold, bullet points
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<span class="flex gap-2 mt-1"><span style="color:var(--brand)">•</span><span>$1</span></span>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function AIChatbot() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${session?.user?.name?.split(' ')[0] || 'there'}! 👋 I'm **Aarogya**, your personal health assistant.\n\nI can help you with symptoms, health tips, medication questions, and navigating your records. What's on your mind?`,
      time: formatTime(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

    try {
      const { data } = await axios.post('/api/ai/chat', { message: msg, history })
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        time: formatTime(),
      }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
        time: formatTime(),
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setUnread(0)
      setMinimized(false)
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus() }, 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function clearChat() {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Hello again! How can I help you today?`,
      time: formatTime(),
    }])
  }

  // Only render for patient role - MUST BE AFTER ALL HOOKS
  if (role !== 'patient') return null

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat Window */}
        {open && !minimized && (
          <div
            className="w-[360px] rounded-2xl overflow-hidden flex flex-col shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
            style={{
              border: '1px solid var(--border)',
              height: '520px',
              animation: 'slideUp 0.25s ease',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Aarogya AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    <p className="text-xs text-white/70">Health Assistant · Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} title="Clear chat"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setMinimized(true)} title="Minimize"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => setOpen(false)} title="Close"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-700'
                      : 'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Sparkles className="w-3.5 h-3.5 text-white" />
                      : <User className="w-3.5 h-3.5 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                          : 'var(--card-bg)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text)',
                        border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    <span className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>{msg.time}</span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-700 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 2 && !loading && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
                {QUICK_PROMPTS.slice(0, 3).map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="text-xs px-2.5 py-1.5 rounded-full border transition-colors hover:border-teal-500"
                    style={{ color: 'var(--brand)', borderColor: 'rgba(13,148,136,0.3)', background: 'rgba(13,148,136,0.05)' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  placeholder="Ask about symptoms, health tips..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  disabled={loading}
                  maxLength={500}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: (!input.trim() || loading) ? 'var(--border)' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: '#fff',
                  }}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Not a substitute for professional medical advice
              </p>
            </div>
          </div>
        )}

        {/* Minimized bar */}
        {open && minimized && (
          <button
            onClick={() => setMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff' }}>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Aarogya AI</span>
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
        )}

        {/* FAB button */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
            title="AI Health Assistant"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}

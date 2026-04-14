'use client'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { MessageCircle, Send, Loader2, Bot, User, RefreshCw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'What should I do for high fever?',
  'How do I manage diabetes?',
  'What is a healthy diet for heart health?',
  'How can I improve my sleep quality?',
  'When should I go to the emergency room?',
  'How do I book an appointment?',
]

function MarkdownText({ text }: { text: string }) {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm **Aarogya**, your personal health assistant. I can help you with health questions, symptoms, medications, appointments, and more.\n\nHow can I assist you today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(msg?: string) {
    const text = (msg || input).trim()
    if (!text) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/ai/chat', {
        message: text,
        history: messages.slice(-10),
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. How can I help you today?",
    }])
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-brand-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Aarogya Health Assistant</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-gray-400">Online — AI-powered health guidance</p>
            </div>
          </div>
        </div>
        <button
          id="clear-chat-btn"
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New chat
        </button>
      </div>

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user'
                ? 'bg-brand-500 text-white'
                : 'bg-gradient-to-br from-purple-500 to-brand-500 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-500 text-white rounded-tr-none'
                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <MarkdownText text={msg.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-brand-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2 flex-shrink-0">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="card p-3 mt-4 flex gap-3 items-end flex-shrink-0">
        <textarea
          id="chat-input"
          className="flex-1 resize-none input-field py-2 min-h-[44px] max-h-32"
          placeholder="Ask me anything about your health..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          id="send-message-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-3 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2 flex-shrink-0">
        Aarogya AI is for informational purposes only. Always consult a qualified healthcare professional.
      </p>
    </div>
  )
}

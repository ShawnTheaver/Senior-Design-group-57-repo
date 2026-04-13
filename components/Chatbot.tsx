'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export type PlannerMessage = {
  role: 'user' | 'assistant'
  text: string
}

type ChatbotProps = {
  onMessagesChange?: (messages: PlannerMessage[]) => void
}

export default function Chatbot({ onMessagesChange }: ChatbotProps) {
  const { user } = useAuth()

  const [messages, setMessages] = useState<PlannerMessage[]>([
    {
      role: 'assistant',
      text: "Hi! I'm CatAssist 🐱. Ask about your curriculum, schedule, or scenario.",
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    'What is my curriculum?',
    'What classes should I take next semester?',
    'How many credits do I need for next semester?',
    'Which professors are available for the classes I’m taking next semester?',
    'Where are classes located that I’m taking next semester?',
    'Am I missing any required classes from the curriculum that I should have taken by now?',
  ]

  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(msg?: string) {
    const text = (msg ?? input).trim()
    if (!text) return

    if (!user?.email) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Please sign in to use CatAssist.' },
      ])
      return
    }

    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          message: text,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')

      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply ?? 'No reply returned.' },
      ])
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: e?.message || 'Network error.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            {m.text}
          </div>
        ))}

        {loading && <div className="text-sm italic text-slate-400">Thinking…</div>}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask CatAssist anything..."
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            Send
          </button>
        </div>

        <div className="mt-4 text-xs font-semibold tracking-wide text-slate-400">
          SUGGESTIONS
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
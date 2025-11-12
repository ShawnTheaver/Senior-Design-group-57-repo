// components/Chatbot.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type Msg = { role: 'user' | 'bot'; text: string }

const START: Msg[] = [
  { role: 'bot', text: "Hi! I'm CatAssist 😺. Ask about your curriculum, schedule, or scenario." },
  { role: 'bot', text: "Try: 'What’s my curriculum?', 'Tell me my scenario', or 'What’s due this week?'" },
]

export default function Chatbot() {
  const { user } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>(START)
  const [input, setInput] = useState('')
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  async function smartReply(prompt: string): Promise<string> {
    if (!user) return 'Please sign in first.'
    const emailQ = `email=${encodeURIComponent(user.email)}`
    const p = prompt.toLowerCase()

    // curriculum
    if (/\bcurriculum|major|degree\b/.test(p)) {
      const res = await fetch(`/data/curriculum?${emailQ}`)
      const data = await res.json()
      if (!data.curriculum) return 'I could not find a curriculum linked to your account.'
      const { name, description, total_courses, courses_completed, gpa } = data.curriculum
      const done = Number(courses_completed || 0)
      const total = Number(total_courses || 0)
      const pct = total ? Math.round((done / total) * 100) : 0
      return `You're in “${name}” (${pct}% complete, GPA ${gpa ?? '—'}).\n${description}`
    }

    // scenario (fake narrative)
    if (/\bscenario|juggling|what am i working|my focus\b/.test(p)) {
      const res = await fetch(`/data/scenario?${emailQ}`)
      const data = await res.json()
      if (!data.scenario) return 'No scenario saved for you yet.'
      const s = data.scenario
      return `${s.headline}\n${s.narrative}`
    }

    // schedule / due this week
    if (/\bdue|schedule|week|tomorrow|today\b/.test(p)) {
      const res = await fetch(`/data/schedule?${emailQ}`)
      const data = await res.json()
      const events = (data.events || []) as { day: string; time: string; title: string }[]
      if (events.length === 0) return 'You have no upcoming events stored.'
      const lines = events.slice(0, 6).map(e => `${e.day} ${e.time} — ${e.title}`)
      return `Here’s your upcoming schedule:\n` + lines.join('\n')
    }

    // fallback
    return "I can fetch your curriculum (/data/curriculum), scenario (/data/scenario), and events (/data/schedule). Try one of those!"
  }

  async function send() {
    if (!input.trim()) return
    const prompt = input.trim()
    setMsgs((m) => [...m, { role: 'user', text: prompt }])
    setInput('')
    const reply = await smartReply(prompt)
    setMsgs((m) => [...m, { role: 'bot', text: reply }])
  }

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex-1 min-w-[260px] bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col">
        <div
          ref={boxRef}
          className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1"
          style={{ maxHeight: 260 }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`px-3 py-2 text-sm rounded-2xl ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white ml-auto max-w-[80%]'
                  : 'bg-slate-800 text-slate-100 mr-auto max-w-[85%]'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none"
            placeholder="Ask CatAssist anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-sm font-semibold"
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>

      <div className="w-72 space-y-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase text-slate-500 mb-1">Suggestions</div>
          <div className="grid gap-2">
            <button
              className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() => setInput("What’s my curriculum?")}
            >
              What’s my curriculum?
            </button>
            <button
              className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() => setInput("Tell me my scenario")}
            >
              Tell me my scenario
            </button>
            <button
              className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() => setInput("What’s due this week?")}
            >
              What’s due this week?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'bot'; text: string }

const START: Msg[] = [
  {
    role: 'bot',
    text: "Hi! I'm CatAssist 😺. Ask me to plan your study blocks or summarize your week.",
  },
  {
    role: 'bot',
    text: "Try: 'Make a 2-hour study plan for Database II tonight' or 'What’s due this week?'",
  },
]

function fakeReply(prompt: string) {
  const canned = [
    "Got it! I created a 2-hour block from 7–9pm for Database II with a 10-minute break. Want me to add review cards?",
    "This week: IT3049C quiz Thu 11:59pm, ENGL4092 draft Fri 4pm, CatAssist standup M/W 4pm.",
    "I can’t access Catalyst in this demo, but I’ll simulate tasks so you have something to show.",
  ]
  if (/due|what.*week/i.test(prompt)) return canned[1]
  if (/study|plan|block/i.test(prompt)) return canned[0]
  return canned[2]
}

export default function Chatbot() {
  const [msgs, setMsgs] = useState<Msg[]>(START)
  const [input, setInput] = useState(
    'Make a 2-hour study plan for Database II tonight'
  )
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [msgs])

  function send() {
    if (!input.trim()) return
    const prompt = input.trim()
    setMsgs((m) => [...m, { role: 'user', text: prompt }])
    setInput('')
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'bot', text: fakeReply(prompt) }])
    }, 500)
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
            className="btn px-4 py-2 rounded-xl bg-emerald-600 text-sm font-semibold"
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>

      <div className="w-72 space-y-3">
        <div className="card bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase text-slate-500 mb-1">
            Suggestions
          </div>
          <div className="grid gap-2">
            <button
              className="chip text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() => setInput("What’s due this week?")}
            >
              What’s due this week?
            </button>
            <button
              className="chip text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() =>
                setInput("Make a 2-hour study plan for Database II tonight")
              }
            >
              Plan 2-hour study block
            </button>
            <button
              className="chip text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-left"
              onClick={() =>
                setInput("Summarize my schedule for tomorrow")
              }
            >
              Summarize tomorrow
            </button>
          </div>
        </div>
        <div className="card bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
          <div className="text-[10px] uppercase text-slate-500 mb-1">
            Status
          </div>
          <div className="text-sm font-semibold text-slate-100">
            Frontend demo mode
          </div>
          <div className="text-[11px] text-slate-500">
            No backend or database required.
          </div>
        </div>
      </div>
    </div>
  )
}

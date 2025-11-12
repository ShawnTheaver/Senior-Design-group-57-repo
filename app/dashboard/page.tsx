// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import StatCard from '@/components/StatCard'
import PieChartCard from '@/components/PieChartCard'
import Chatbot from '@/components/Chatbot'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState('—')
  const [gpa, setGpa] = useState<number | null>(null)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    const email = user.email

    async function load() {
      try {
        const res = await fetch(`/data/curriculum?email=${encodeURIComponent(email)}`)
        const data = await res.json()
        const c = data.curriculum
        if (c) {
          setProgram(c.name)
          setGpa(typeof c.gpa === 'number' ? c.gpa : null)
          setCompleted(Number(c.courses_completed ?? 0))
          setTotal(Number(c.total_courses ?? 0))
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, router])

  if (!user) return null

  const welcome = user.name || 'Student'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Welcome back</div>
            <div className="text-xl font-semibold">{welcome}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
            <div className="text-xs text-slate-500 mt-1">{program}</div>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl bg-red-500/90 text-slate-50 text-xs"
          >
            Log out
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 text-xs">
          <button onClick={() => router.push('/profile')} className="px-3 py-1.5 rounded-xl bg-slate-800">
            Profile
          </button>
          <button onClick={() => router.push('/schedule')} className="px-3 py-1.5 rounded-xl bg-slate-800">
            Schedule
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Degree Progress"
            value={`${percent}%`}
            sub={`${completed} / ${total} courses`}
            badge={percent >= 60 ? 'On track' : 'Catch up'}
          />
          <StatCard
            title="GPA"
            value={gpa != null ? String(gpa) : '—'}
            sub={program}
            badge="Academics"
          />
          <StatCard
            title="This Week's Study"
            value="12.5 h"
            sub="Goal: 15 h"
            badge="Keep going"
          />
        </div>

        {/* Main dashboard grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Progress Chart */}
          <PieChartCard percent={percent} />

          {/* Chatbot Section */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <h2 className="text-base font-semibold mb-3">CatAssist – AI Planner</h2>
            <div className="flex-1">
              <Chatbot />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

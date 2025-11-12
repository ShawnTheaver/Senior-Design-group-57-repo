'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

type Overview = {
  username: string
  email: string
  curriculum: string
  total: number
  completed: number
  percent: number
  gpa: string
  description: string
  profile: {
    phone: string
    year: string
    advisor: string
    hometown: string
    bio: string
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [ov, setOv] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      router.replace('/login')
      return
    }
    const q = (user.email || user.name || '').trim()
    if (!q) {
      setErr('No identity available. Please sign in again.')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        setErr('')
        const res = await fetch(`/data/overview?email=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error(`Overview fetch failed (${res.status})`)
        const data = (await res.json()) as Overview
        setOv(data)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load profile')
        setOv(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  if (loading) return <div className="p-6 text-slate-400">Loading profile…</div>
  if (err) return <div className="p-6 text-rose-300 text-sm">{err}</div>
  if (!ov) return null

  return (
    <div className="p-6 text-slate-100 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-slate-400 -mt-2">Your personal details and academic progress.</p>

      <div className="grid gap-4 md:grid-cols-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="font-semibold mb-3">Personal</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">Name:</span> {ov.username}</div>
            <div><span className="text-slate-500">Email:</span> {ov.email}</div>
            <div><span className="text-slate-500">Phone:</span> {ov.profile.phone}</div>
            <div><span className="text-slate-500">Year:</span> {ov.profile.year}</div>
            <div><span className="text-slate-500">Advisor:</span> {ov.profile.advisor}</div>
            <div><span className="text-slate-500">Hometown:</span> {ov.profile.hometown}</div>
            <div><span className="text-slate-500">Bio:</span> {ov.profile.bio}</div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Academic</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">Program:</span> {ov.curriculum || '—'}</div>
            <div><span className="text-slate-500">GPA:</span> {ov.gpa}</div>
            <div><span className="text-slate-500">Courses:</span> {ov.completed} / {ov.total}</div>
            <div><span className="text-slate-500">Progress:</span> {ov.percent}%</div>
            <div><span className="text-slate-500">About program:</span> {ov.description}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

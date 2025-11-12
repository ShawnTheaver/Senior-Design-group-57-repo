'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

type Item = { day: string; time: string; title: string }

export default function SchedulePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [curriculum, setCurriculum] = useState<string>('')
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
        // fetch curriculum (for header)
        const cur = await fetch(`/data/curriculum?email=${encodeURIComponent(q)}`)
        const curJson = await cur.json()
        setCurriculum(curJson?.curriculum?.name || '')

        // fetch events
        const res = await fetch(`/data/schedule?email=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error(`Schedule fetch failed (${res.status})`)
        const data = await res.json()
        setItems(data.events || [])
      } catch (e: any) {
        setErr(e?.message || 'Failed to load schedule')
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  if (loading) return <div className="p-6 text-slate-400">Loading schedule…</div>
  if (err) return <div className="p-6 text-rose-300 text-sm">{err}</div>

  return (
    <div className="p-6 text-slate-100">
      <h1 className="text-2xl font-bold mb-1">Schedule</h1>
      <p className="text-slate-400 mb-4">Your weekly academic schedule (database-backed). Program: {curriculum || '—'}</p>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left py-2">Day</th>
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">Event</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {items.map((it, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="py-2">{it.day}</td>
                <td className="py-2">{it.time}</td>
                <td className="py-2">{it.title}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">No events yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="text-xs text-slate-500 mt-3">Data powered by <code>student_events</code>.</div>
      </div>
    </div>
  )
}

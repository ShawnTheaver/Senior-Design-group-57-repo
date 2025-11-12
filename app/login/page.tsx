'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const DEMO_EMAILS: Record<string, string> = {
  alice: 'alice@example.com',
  bob: 'bob@example.com',
  charlie: 'charlie@example.com',
  diana: 'diana@example.com',
  eric: 'eric@example.com',
  'm10000001': 'alice@example.com',
  'm10000002': 'bob@example.com',
  'm10000003': 'charlie@example.com',
  'm10000004': 'diana@example.com',
  'm10000005': 'eric@example.com',
}

function normalizeToEmail(id: string) {
  const raw = id.trim().toLowerCase()
  if (!raw) return ''
  if (raw.includes('@')) return raw
  return DEMO_EMAILS[raw] || raw // fall back to what was typed
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string>('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const email = normalizeToEmail(identifier)
      if (!email) throw new Error('Enter your email or demo username (alice/bob/charlie/diana/eric)')
      // demo ignores password; we keep a name for greeting
      const name = email.split('@')[0]
      login(email, name)
      router.replace('/dashboard')
    } catch (e: any) {
      setErr(e?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  function quick(email: string, name: string) {
    login(email, name)
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm px-6 py-8 rounded-3xl bg-slate-900/80 border border-slate-800">
        <h2 className="text-xl font-semibold text-slate-50 mb-6">Sign in</h2>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 outline-none"
            placeholder="Email / demo username (alice, bob, …)"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 outline-none"
            placeholder="Password (ignored in demo)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <div className="text-[13px] text-rose-400">{err}</div>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <button className="px-3 py-2 rounded-xl bg-slate-800" onClick={() => quick('alice@example.com', 'Alice (BSIT)')}>Alice (BSIT)</button>
          <button className="px-3 py-2 rounded-xl bg-slate-800" onClick={() => quick('bob@example.com', 'Bob (Cybersecurity)')}>Bob (Cybersecurity)</button>
          <button className="px-3 py-2 rounded-xl bg-slate-800" onClick={() => quick('charlie@example.com', 'Charlie (Accounting)')}>Charlie (Accounting)</button>
          <button className="px-3 py-2 rounded-xl bg-slate-800" onClick={() => quick('diana@example.com', 'Diana (Finance)')}>Diana (Finance)</button>
          <button className="px-3 py-2 rounded-xl bg-slate-800 col-span-2" onClick={() => quick('eric@example.com', 'Eric (ME)')}>Eric (ME)</button>
        </div>
      </div>
    </div>
  )
}

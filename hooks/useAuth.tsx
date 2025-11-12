// hooks/useAuth.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type User = {
  email: string
  name: string
}

type AuthCtx = {
  user: User | null
  login: (email: string, name: string) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('catassist_user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  function login(email: string, name: string) {
    const u = { email, name }
    localStorage.setItem('catassist_user', JSON.stringify(u))
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('catassist_user')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type User = {
  id: number
  email: string
  name: string
}

type AuthCtx = {
  user: User | null
  login: (email: string, name: string, id: number) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {}
    }
  }, [])

  function login(email: string, name: string, id: number) {
    const nextUser = { id, email, name }
    setUser(nextUser)
    localStorage.setItem('auth_user', JSON.stringify(nextUser))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('auth_user')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
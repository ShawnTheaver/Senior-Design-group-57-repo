'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type User = {
  email: string
  name: string
}

type AuthContextValue = {
  user: User | null
  login: (email: string, name?: string) => void
  logout: () => void
}

const AuthCtx = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Load user from localStorage on first load (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('catassist_user')
    if (!raw) return
    try {
      setUser(JSON.parse(raw))
    } catch {
      // ignore bad data
    }
  }, [])

  const login = (email: string, name = 'Student') => {
    const u = { email, name }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('catassist_user', JSON.stringify(u))
    }
    setUser(u)
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('catassist_user')
    }
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

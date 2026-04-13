'use client'

import Link from 'next/link'
import { AuthProvider } from '@/hooks/useAuth'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
        <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex h-full items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 transition hover:opacity-90"
            >
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                CatAssist
              </div>
              <div className="hidden text-slate-300 md:block">|</div>
              <div className="hidden text-lg font-semibold text-slate-800 md:block">
                Student Success Hub
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  )
}
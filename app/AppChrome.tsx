// app/AppChrome.tsx
'use client'

import { usePathname } from 'next/navigation'
import Chatbot from '@/components/Chatbot'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showBot = pathname === '/dashboard' // ✅ only show on dashboard

  return (
    <>
      {children}
      {showBot && (
        <div className="fixed bottom-6 right-6 z-50">
          <Chatbot />
        </div>
      )}
    </>
  )
}

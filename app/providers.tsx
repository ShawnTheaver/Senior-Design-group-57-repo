'use client';

import { AuthProvider } from '@/hooks/useAuth'; // adjust if your path/name differs

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

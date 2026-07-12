'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account } from '@/lib/appwrite/client'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const router = useRouter()

  useEffect(() => {
    account.get()
      .then(() => setAuthState('authenticated'))
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  useEffect(() => {
    if (authState === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [authState, router])

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (authState === 'unauthenticated') return null

  return <>{children}</>
}

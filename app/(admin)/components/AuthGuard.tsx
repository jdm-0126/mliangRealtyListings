'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const router = useRouter()

  // Check sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      const auth = sessionStorage.getItem('brokerAdminAuth')
      setAuthState(auth === 'authenticated' ? 'authenticated' : 'unauthenticated')
    } catch {
      // sessionStorage unavailable (e.g. private browsing with blocked storage)
      setAuthState('unauthenticated')
    }
  }, [])

  // Redirect unauthenticated users to the public homepage
  useEffect(() => {
    if (authState === 'unauthenticated') {
      router.push('/')
    }
  }, [authState, router])

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    // Redirect is in progress; render nothing to avoid flash of protected content
    return null
  }

  return <>{children}</>
}

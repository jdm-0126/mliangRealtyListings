'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'
const SUPERADMIN_PASSWORD = 'EuandaiteD_0126'
const BROKER_PASSWORD = 'brokerMliangAdmin2026'

// Accepted broker/agent emails (extend as needed)
const BROKER_EMAILS = [
  'broker@realtyprov1.com',
  'agent@realtyprov1.com',
]

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already authenticated, redirect straight to admin dashboard
  useEffect(() => {
    try {
      if (sessionStorage.getItem('brokerAdminAuth') === 'authenticated') {
        router.replace('/admin')
      }
    } catch {
      // sessionStorage unavailable — stay on login page
    }
  }, [router])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    // Superadmin check
    if (trimmedEmail === SUPERADMIN_EMAIL && trimmedPassword === SUPERADMIN_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', trimmedEmail)
      sessionStorage.setItem('viewAsRole', 'superadmin')
      router.replace('/admin')
      return
    }

    // Broker / agent check — any recognised email + broker password
    if (BROKER_EMAILS.includes(trimmedEmail) && trimmedPassword === BROKER_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', trimmedEmail)
      sessionStorage.setItem('viewAsRole', 'broker')
      router.replace('/admin')
      return
    }

    setError('Invalid email or password. Please try again.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-blue-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">M. Liang Realty</h1>
            <p className="text-blue-100 text-sm mt-1">Admin Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 text-xl font-semibold mb-6">Sign in to your account</h2>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <svg aria-hidden="true" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Back to site */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Not an admin?{' '}
              <a href="/" className="text-blue-600 hover:underline font-medium">
                Back to website
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

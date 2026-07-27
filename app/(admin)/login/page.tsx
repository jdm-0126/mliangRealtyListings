'use client'

import { login, logout, isAuthenticated } from "@/lib/auth"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ authState, setAuthState] = useState('')
 
  useEffect(() => {

    if (isAuthenticated()) {

        router.replace("/admin")
    }
    console.log("AuthGuard mounted");

    const loggedIn = localStorage.getItem("admin");

    console.log(loggedIn);

    if (loggedIn !== "true") {
        console.log("redirect login");
        router.replace("/login");
        return;
    }

    console.log("authenticated");
    setLoading(false);

}, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single();

    if (error || !user) {
      setError("Invalid email or password.");
      return;
    }

    if (!user.is_active) {
      setError("This account has been disabled.");
      return;
    }

    // TEMPORARY ONLY (plain text password)
    if (user.password_hash.trim() !== password.trim()) {
      setError("Invalid email or password.");
      return;
    }
    
    localStorage.setItem("adminUser", JSON.stringify(user))

    sessionStorage.setItem("userRole", user.role_id)

    sessionStorage.setItem("tenantId", user.tenant_id)

    login(user)

    router.replace("/admin")

  } catch (err: any) {
    setError(err.message ?? "Unexpected error.");
  } finally {
    setLoading(false);
  }
}
const handleLogout=()=>{

    logout()

    router.replace("/login")

}
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--est-background, #141414)' }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--est-card, #1a1a1a)',
            border: '1px solid var(--est-border, #262626)',
          }}
        >
          {/* Header */}
          <div
            className="px-8 py-8 text-center"
            style={{
              background: 'var(--est-elevated, #222222)',
              borderBottom: '1px solid var(--est-border, #262626)',
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'rgba(112, 59, 247, 0.15)',
                border: '1px solid rgba(112, 59, 247, 0.3)',
              }}
            >
              <Building2
                className="w-8 h-8"
                style={{ color: 'var(--est-purple, #703bf7)' }}
              />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--est-text, #ffffff)' }}
            >
              M. Liang Realty
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--est-muted, #999999)' }}>
              Admin Portal
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: 'var(--est-text, #ffffff)' }}
            >
              Sign in to your account
            </h2>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--est-muted, #999999)' }}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--est-muted, #666666)' }}
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors disabled:opacity-50"
                    style={{
                      background: 'var(--est-elevated, #222222)',
                      border: '1px solid var(--est-border, #262626)',
                      color: 'var(--est-text, #ffffff)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--est-muted, #999999)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--est-muted, #666666)' }}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-colors disabled:opacity-50"
                    style={{
                      background: 'var(--est-elevated, #222222)',
                      border: '1px solid var(--est-border, #262626)',
                      color: 'var(--est-text, #ffffff)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--est-muted, #666666)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--est-purple, #703bf7)',
                  color: '#ffffff',
                }}
              >
                {loading ? (
                  <>
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: 'var(--est-muted, #888888)' }}
            >
              Not an admin?{' '}
              <Link
                href="/"
                className="font-medium hover:underline"
                style={{ color: 'var(--est-purple, #703bf7)' }}
              >
                Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
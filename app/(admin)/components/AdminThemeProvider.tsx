'use client'
// Manages the admin dark/light theme.
//
// Strategy: the theme lives on document.documentElement as data-admin-theme="dark".
// An inline <script> in the root layout sets this attribute before React hydrates,
// so there is zero flash on page load. This component keeps React state in sync
// with that attribute and exposes set() for the toggle button.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type AdminTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: AdminTheme
  set: (t: AdminTheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  set: () => {},
})

export function useAdminTheme() {
  return useContext(ThemeContext)
}

export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from the attribute that the inline script already set — no flash.
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.getAttribute('data-admin-theme') === 'dark' ? 'dark' : 'light'
  })

  // Keep the state in sync if something external changes the attribute
  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-admin-theme')
    const current: AdminTheme = attr === 'dark' ? 'dark' : 'light'
    if (current !== theme) setThemeState(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback((t: AdminTheme) => {
    // 1. Update the HTML attribute — CSS responds immediately
    if (t === 'dark') {
      document.documentElement.setAttribute('data-admin-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-admin-theme')
    }
    // 2. Persist so the inline script restores it on next page load
    try { localStorage.setItem('adminTheme', t) } catch {}
    // 3. Update React state so the toggle button re-renders
    setThemeState(t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, set }}>
      {children}
    </ThemeContext.Provider>
  )
}

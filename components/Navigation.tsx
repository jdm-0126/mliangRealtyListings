'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, Settings, BarChart3, Users, Menu, X, KeyRound, Database, Video, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'

const navigation = [
  { name: 'Dashboard',        href: '/admin',               icon: Home,      roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Broker Dashboard', href: '/admin/broker-dashboard', icon: BarChart3, roles: ['superadmin', 'broker'] },
  { name: 'Properties',       href: '/admin/properties',    icon: BarChart3, roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Rentals',          href: '/admin/rentals',       icon: KeyRound,  roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Gallery',          href: '/admin/gallery',       icon: Upload,    roles: ['superadmin', 'broker'] },
  { name: 'Featured Video',   href: '/admin/featured-video', icon: Video,          roles: ['superadmin', 'broker'] },
  { name: 'Inquiries',        href: '/admin/inquiries',      icon: MessageSquare,  roles: ['superadmin', 'broker'] },
  { name: 'Brokers',          href: '/admin/brokers',       icon: Users,     roles: ['superadmin'] },
  { name: 'Agents',           href: '/admin/agents',        icon: Users,     roles: ['superadmin', 'broker'] },
  { name: 'My Profile',       href: '/admin/agent-profile', icon: Settings,  roles: ['agent'] },
  { name: 'Settings',         href: '/admin/settings',      icon: Settings,  roles: ['superadmin', 'broker'] },
  { name: 'Tenant Management', href: '/admin/tenant-management', icon: Database,  roles: ['superadmin'] },
]

// ── CSS variable shorthand styles ─────────────────────────────────────────────
// All colours read from the CSS variable system so they respond to data-admin-theme
// toggling in real time without a page reload.

const sidebarStyle: React.CSSProperties = {
  background: 'hsl(var(--background))',
  borderRight: '1px solid hsl(var(--border))',
}

const headerStyle: React.CSSProperties = {
  borderBottom: '1px solid hsl(var(--border))',
}

const brandTextStyle: React.CSSProperties = {
  color: 'hsl(var(--foreground))',
}

const navLinkBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'background 150ms, color 150ms',
  color: 'hsl(var(--muted-foreground))',
}

const navLinkActive: React.CSSProperties = {
  ...navLinkBase,
  background: 'hsl(var(--primary) / 0.1)',
  color: 'hsl(var(--primary))',
  borderRight: '2px solid hsl(var(--primary))',
}

const roleSwitcherBtn: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.375rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'hsl(var(--foreground))',
  cursor: 'pointer',
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '0.25rem',
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.375rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  zIndex: 50,
}

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  textAlign: 'left',
  color: 'hsl(var(--foreground))',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessName, setBusinessName] = useState('M. Liang Realty')
  const [hasMounted, setHasMounted] = useState(false)
  const [userRole, setUserRole] = useState<'superadmin' | 'broker' | 'agent' | null>(null)
  const [viewAsRole, setViewAsRole] = useState<'superadmin' | 'broker' | 'agent'>('superadmin')
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const savedBusinessName = localStorage.getItem('businessName')
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const userEmail = sessionStorage.getItem('userEmail')
    const storedRole = sessionStorage.getItem('userRole')

    let role: 'superadmin' | 'broker' | 'agent' | null = null
    let viewRole: 'superadmin' | 'broker' | 'agent' = 'superadmin'

    if (auth === 'authenticated' && userEmail === SUPERADMIN_EMAIL) {
      role = 'superadmin'
      const savedView = sessionStorage.getItem('viewAsRole') || 'superadmin'
      viewRole = savedView === 'superadmin' || savedView === 'broker' || savedView === 'agent' ? savedView : 'superadmin'
    } else if (auth === 'authenticated' && storedRole === 'tenant_admin') {
      role = 'broker'; viewRole = 'broker'
    } else if (auth === 'authenticated' && userEmail) {
      role = 'broker'; viewRole = 'broker'
    } else if (userEmail) {
      role = 'agent'; viewRole = 'agent'
    }

    if (savedBusinessName) setBusinessName(savedBusinessName)
    setUserRole(role)
    setViewAsRole(viewRole)
  }, [])

  const handleViewChange = (role: 'superadmin' | 'broker' | 'agent') => {
    setViewAsRole(role)
    sessionStorage.setItem('viewAsRole', role)
    setShowRoleSwitcher(false)
  }

  const isSuperAdmin = userRole === 'superadmin'
  const isTenantAdmin = hasMounted && sessionStorage.getItem('userRole') === 'tenant_admin'
  const filteredNavigation = navigation.filter(item =>
    isSuperAdmin || (viewAsRole && item.roles.includes(viewAsRole))
  )

  const SidebarContent = () => (
    <>
      {/* Brand header */}
      <div className="flex items-center h-16 px-6" style={headerStyle}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'hsl(var(--primary))' }}>
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold block" style={brandTextStyle}>
              {hasMounted ? businessName : 'M. Liang Realty'}
            </span>
            {isTenantAdmin && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                Tenant Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Role switcher */}
      {userRole === 'superadmin' && (
        <div className="px-4 py-3 relative" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <button style={roleSwitcherBtn} onClick={() => setShowRoleSwitcher(p => !p)}>
            <span>View as: {viewAsRole === 'superadmin' ? 'Superadmin' : viewAsRole === 'broker' ? 'Broker' : 'Agent'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showRoleSwitcher && (
            <div style={dropdownStyle}>
              {(['superadmin', 'broker', 'agent'] as const).map(r => (
                <button key={r} style={dropdownItemStyle} onClick={() => handleViewChange(r)}>
                  {r === 'superadmin' ? 'Superadmin View' : r === 'broker' ? 'Broker View' : 'Agent View'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              style={isActive ? navLinkActive : navLinkBase}
              onClick={() => setMobileMenuOpen(false)}
              onMouseEnter={e => {
                if (!isActive) Object.assign((e.currentTarget as HTMLElement).style, {
                  background: 'hsl(var(--primary) / 0.08)',
                  color: 'hsl(var(--foreground))',
                })
              }}
              onMouseLeave={e => {
                if (!isActive) Object.assign((e.currentTarget as HTMLElement).style, {
                  background: navLinkBase.background,
                  color: navLinkBase.color,
                })
              }}
              onPointerDown={e => {
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: 'hsl(var(--primary) / 0.2)',
                  color: 'hsl(var(--primary))',
                  transform: 'scale(0.98)',
                })
              }}
              onPointerUp={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'scale(1)'
                setTimeout(() => {
                  if (!isActive) Object.assign(el.style, {
                    background: navLinkBase.background,
                    color: navLinkBase.color,
                  })
                }, 150)
              }}
              onPointerCancel={e => {
                if (!isActive) Object.assign((e.currentTarget as HTMLElement).style, {
                  background: navLinkBase.background,
                  color: navLinkBase.color,
                  transform: 'scale(1)',
                })
              }}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0"
        style={sidebarStyle}
      >
        <SidebarContent />
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden">
        <div
          className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 shadow-sm"
          style={{ ...sidebarStyle, borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(var(--primary))' }}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={brandTextStyle}>
              {hasMounted ? businessName : 'M. Liang Realty'}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(p => !p)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="fixed top-0 left-0 w-64 h-full flex flex-col shadow-xl"
              style={sidebarStyle}
            >
              <SidebarContent />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

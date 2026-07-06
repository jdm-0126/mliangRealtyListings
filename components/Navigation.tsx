'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Upload, Settings, BarChart3, Users, Menu, X, Facebook, Activity, KeyRound } from 'lucide-react'
import { Button } from './ui/button'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home, roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Broker Dashboard', href: '/admin/broker-dashboard', icon: BarChart3, roles: ['superadmin', 'broker'] },
  { name: 'Properties', href: '/admin/properties', icon: BarChart3, roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Rentals', href: '/admin/rentals', icon: KeyRound, roles: ['superadmin', 'broker', 'agent'] },
  { name: 'Brokers', href: '/admin/brokers', icon: Users, roles: ['superadmin'] },
  { name: 'Agents', href: '/admin/agents', icon: Users, roles: ['superadmin', 'broker'] },
  { name: 'My Profile', href: '/admin/agent-profile', icon: Settings, roles: ['agent'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['superadmin', 'broker'] },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
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
    
    let role: 'superadmin' | 'broker' | 'agent' | null = null
    let viewRole: 'superadmin' | 'broker' | 'agent' = 'superadmin'
    
    if (auth === 'authenticated' && userEmail === SUPERADMIN_EMAIL) {
      role = 'superadmin'
      const savedView = sessionStorage.getItem('viewAsRole') || 'superadmin'
      viewRole = savedView === 'superadmin' || savedView === 'broker' || savedView === 'agent' ? savedView : 'superadmin'
    } else if (auth === 'authenticated' && userEmail) {
      role = 'broker'
      viewRole = 'broker'
    } else if (userEmail) {
      role = 'agent'
      viewRole = 'agent'
    } else {
      role = null
      viewRole = 'superadmin'
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

  // Superadmin sees the full menu; other roles use their role-based view.
  const filteredNavigation = navigation.filter(item =>
    isSuperAdmin || (viewAsRole && item.roles.includes(viewAsRole))
  )

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{hasMounted ? businessName : 'M. Liang Realty'}</span>
          </div>
        </div>
        
        {/* Role Switcher for Superadmin */}
        {userRole === 'superadmin' && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between"
              >
                <span style={{ color: '#000000' }}>View as: {viewAsRole === 'superadmin' ? 'Superadmin' : viewAsRole === 'broker' ? 'Broker' : 'Agent'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRoleSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={() => handleViewChange('superadmin')}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                    style={{ color: '#000000' }}
                  >
                    Superadmin View
                  </button>
                  <button
                    onClick={() => handleViewChange('broker')}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                    style={{ color: '#000000' }}
                  >
                    Broker View
                  </button>
                  <button
                    onClick={() => handleViewChange('agent')}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                    style={{ color: '#000000' }}
                  >
                    Agent View
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex-1 px-4 py-6 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{hasMounted ? businessName : 'M. Liang Realty'}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl">
              <div className="flex items-center h-16 px-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">{hasMounted ? businessName : 'M. Liang Realty'}</span>
                </div>
              </div>
              
              <div className="px-4 py-6 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

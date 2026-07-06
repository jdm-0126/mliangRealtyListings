// app/(public)/layout.tsx
// Server Component — no 'use client' directive

import { getTenantSettingsServer } from '@/lib/tenantServer'
import PublicHeader from './components/PublicHeader'
import PublicFooter from './components/PublicFooter'
import ChatWidget from '@/components/ChatWidget'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = getTenantSettingsServer()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader businessName={settings.businessName} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter settings={settings} />
      <ChatWidget hidePropertySearch={true} />
    </div>
  )
}

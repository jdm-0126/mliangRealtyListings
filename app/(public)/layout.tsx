// app/(public)/layout.tsx — Estatein dark theme wrapper
import { getTenantSettingsServer } from '@/lib/tenantServer'
import PublicHeader from './components/PublicHeader'
import PublicFooter from './components/PublicFooter'
import SocialTopBar from '@/app/(public)/components/SocialTopBar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = getTenantSettingsServer()

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'var(--est-bg)', color: 'var(--est-text)' }}
    >
      {/* Follow us — above the sticky header, not part of it */}
      <SocialTopBar />

      <PublicHeader businessName={settings.businessName} />

      <main className="flex-1">{children}</main>

      <PublicFooter settings={settings} />
    </div>
  )
}

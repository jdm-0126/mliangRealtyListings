// app/(public)/book/page.tsx
import type { Metadata } from 'next'
import { getTenantSettingsServer } from '@/lib/tenantServer'
import BookingForm from './BookingForm'

export const revalidate = 3600 // rebuild at most once per hour

export const metadata: Metadata = {
  title: 'Book a Viewing – M. Liang Realty',
  description: 'Schedule a property viewing or project site visit with M. Liang Realty. Pick your preferred date, time, and property.',
}

export default function BookPage() {
  const settings = getTenantSettingsServer()
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
          Schedule a Visit
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--est-text)' }}>Book a Viewing</h1>
        <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
          Choose your preferred date, time, and property. We'll confirm your booking within 24 hours.
        </p>
      </div>
      <div className="rounded-2xl p-7" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
        <BookingForm contactNumber={settings.contactNumber} />
      </div>
    </main>
  )
}

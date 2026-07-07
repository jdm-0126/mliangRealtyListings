'use client'
// app/(public)/about/AboutContent.tsx — Estatein dark theme

import { useTenantSettings } from '@/lib/tenant'
import SocialLinks from '@/app/(public)/components/SocialLinks'
import Link from 'next/link'
import { MapPin, Phone, Mail, Award, ArrowRight } from 'lucide-react'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderBottom: '1px solid var(--est-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--est-muted)' }}>
        {label}
      </p>
      <div className="text-sm font-medium" style={{ color: 'var(--est-text)' }}>{children}</div>
    </div>
  )
}

export default function AboutContent() {
  const settings = useTenantSettings()

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
          About Us
        </p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--est-text)' }}>
          {settings.businessName}
        </h1>
        <p className="text-sm max-w-xl" style={{ color: 'var(--est-muted)' }}>
          A licensed real estate brokerage based in San Fernando, Pampanga — specializing in residential and commercial property sales, rentals, and lot listings across the region.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — info cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Brokerage card */}
          <div className="rounded-2xl p-7" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>
              Brokerage Information
            </h2>
            <p className="text-xs mb-5" style={{ color: 'var(--est-muted)' }}>
              Licensed and registered with the PRC
            </p>

            <InfoRow label="Brokerage Name">{settings.businessName}</InfoRow>
            <InfoRow label="Licensed Broker">
              <span>{settings.brokerName}</span>
              <span className="block text-xs font-normal mt-0.5" style={{ color: 'var(--est-muted)' }}>
                {settings.brokerTitle}
              </span>
            </InfoRow>
            <InfoRow label="PRC License Number">
              <span className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--est-purple)' }} />
                PRC No. {settings.prcNumber}
              </span>
            </InfoRow>
            <InfoRow label="Office Address">
              <span className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--est-purple)' }} />
                <span className="leading-relaxed">{settings.officeAddress}</span>
              </span>
            </InfoRow>
            <InfoRow label="Contact Number">
              <a
                href={`tel:${settings.contactNumber}`}
                className="flex items-center gap-2 transition-colors hover:opacity-80"
                style={{ color: 'var(--est-purple)' }}
              >
                <Phone className="w-3.5 h-3.5" />
                {settings.contactNumber}
              </a>
            </InfoRow>
            <div className="py-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--est-muted)' }}>
                Email Address
              </p>
              <a
                href={`mailto:${settings.emailAddress}`}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--est-purple)' }}
              >
                <Mail className="w-3.5 h-3.5" />
                {settings.emailAddress}
              </a>
            </div>
          </div>

          {/* About text */}
          <div className="rounded-2xl p-7" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--est-text)' }}>
              About {settings.businessName}
            </h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--est-muted)' }}>
              {settings.businessName} is a licensed real estate brokerage based in San Fernando, Pampanga. We specialize in residential and commercial property sales, rentals, and lot listings across the Pampanga region.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--est-muted)' }}>
              Our licensed broker, {settings.brokerName} ({settings.brokerTitle}, PRC No. {settings.prcNumber}), brings expertise and dedication to every property transaction — helping buyers and investors find the right property at the right price.
            </p>
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="space-y-6">
          {/* Social */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--est-text)' }}>Follow Us</h2>
            <SocialLinks />
          </div>

          {/* CTA */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
          >
            {/* Glow */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--est-purple) 0%, transparent 70%)', opacity: 0.15 }}
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold mb-2 relative" style={{ color: 'var(--est-text)' }}>
              Interested in a Property?
            </h2>
            <p className="text-xs leading-relaxed mb-5 relative" style={{ color: 'var(--est-muted)' }}>
              Browse our listings or send us a message — we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col gap-2.5 relative">
              <Link
                href="/listings"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--est-purple)', color: '#fff' }}
              >
                View Listings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'transparent', color: 'var(--est-subtle)', border: '1px solid var(--est-border)' }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Server Component — no 'use client' needed
import Link from 'next/link'
import { TenantSettings } from '@/lib/types/public'
import SocialLinks from './SocialLinks'

interface PublicFooterProps {
  settings: TenantSettings
}

export default function PublicFooter({ settings }: PublicFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--est-surface)', borderTop: '1px solid var(--est-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'var(--est-purple)' }}
              >
                M
              </span>
              <span className="text-base font-semibold" style={{ color: 'var(--est-text)' }}>
                {settings.businessName}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--est-muted)' }}>
              Your trusted partner for properties in Pampanga.
            </p>
            <SocialLinks />
            <div>
              <p className='mt-5'>Your support, much appreciated</p>
              <a href='https://sgp.cloud.appwrite.io/v1/storage/buckets/6a56bc40003575bc257b/files/6a56d1310001992e517a/view?project=6a531d6800147ceec486&impersonateuserid=&mode=admin' >
              <img className='mt-2 w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-5' sizes="lg" 
              alt="Developer's QR Code"src="https://sgp.cloud.appwrite.io/v1/storage/buckets/6a56bc40003575bc257b/files/6a56d1310001992e517a/view?project=6a531d6800147ceec486&impersonateuserid=&mode=admin" /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--est-muted)' }}
            >
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home', href: '/' },
                { label: 'Listings', href: '/listings' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="transition-colors hover:opacity-80"
                    style={{ color: 'var(--est-subtle)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--est-muted)' }}
            >
              Contact
            </h3>
            <address className="not-italic space-y-2.5 text-sm" style={{ color: 'var(--est-subtle)' }}>
              {settings.officeAddress && <p className="leading-relaxed">{settings.officeAddress}</p>}
              {settings.contactNumber && (
                <p>
                  <a
                    href={`tel:${settings.contactNumber}`}
                    className="transition-colors hover:opacity-80"
                    style={{ color: 'var(--est-subtle)' }}
                  >
                    {settings.contactNumber}
                  </a>
                </p>
              )}
              {settings.emailAddress && (
                <p>
                  <a
                    href={`mailto:${settings.emailAddress}`}
                    className="transition-colors hover:opacity-80"
                    style={{ color: 'var(--est-subtle)' }}
                  >
                    {settings.emailAddress}
                  </a>
                </p>
              )}
            </address>
          </div>

          {/* Legal / PRC */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--est-muted)' }}
            >
              License
            </h3>
            <p className="text-sm" style={{ color: 'var(--est-subtle)' }}>
              PRC License No.<br />
              <span className="font-semibold" style={{ color: 'var(--est-text)' }}>
                {settings.prcNumber}
              </span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ borderTop: '1px solid var(--est-border)', color: 'var(--est-muted)' }}
        >
          <p>© {year} {settings.businessName}. All rights reserved.</p>
          <Link
            href="/admin/login"
            className="transition-colors hover:opacity-70"
            style={{ color: 'var(--est-elevated)' }}
          >
            Admin
          </Link>
          <p>Powered by RealtyPro</p>
        </div>
      </div>
    </footer>
  )
}

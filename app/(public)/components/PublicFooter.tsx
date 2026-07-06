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
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand Block */}
          <div>
            <h2 className="text-white text-lg font-bold mb-2">
              {settings.businessName}
            </h2>
            <p className="text-sm text-gray-400">
              Your trusted partner for properties in Pampanga
            </p>
            <div className="mt-4">
              <SocialLinks />
            </div>
          </div>

          {/* Contact Block */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">
              Contact
            </h3>
            <address className="not-italic space-y-2 text-sm text-gray-400">
              {settings.officeAddress && (
                <p>{settings.officeAddress}</p>
              )}
              {settings.contactNumber && (
                <p>
                  <a
                    href={`tel:${settings.contactNumber}`}
                    className="hover:text-white transition-colors"
                  >
                    {settings.contactNumber}
                  </a>
                </p>
              )}
              {settings.emailAddress && (
                <p>
                  <a
                    href={`mailto:${settings.emailAddress}`}
                    className="hover:text-white transition-colors"
                  >
                    {settings.emailAddress}
                  </a>
                </p>
              )}
              {settings.prcNumber && (
                <p>PRC License No. {settings.prcNumber}</p>
              )}
            </address>
          </div>

          {/* Links Block */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/listings"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© {year} {settings.businessName}. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/admin/login" className="text-gray-700 hover:text-gray-500 transition-colors">
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

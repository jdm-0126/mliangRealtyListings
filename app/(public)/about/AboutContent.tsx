'use client'

// app/(public)/about/AboutContent.tsx
// Client Component — uses useTenantSettings to read live localStorage values

import { useTenantSettings } from '@/lib/tenant'
import SocialLinks from '@/app/(public)/components/SocialLinks'
import Link from 'next/link'

export default function AboutContent() {
  const settings = useTenantSettings()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">About Us</h1>
        <p className="text-gray-600">
          Get to know {settings.businessName} and our licensed broker
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Brokerage Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brokerage Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              Brokerage Information
            </h2>

            {/* Business Name */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Brokerage Name
              </h3>
              <p className="text-gray-900 font-medium text-lg">
                {settings.businessName}
              </p>
            </div>

            {/* Broker Name & Title */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Licensed Broker
              </h3>
              <p className="text-gray-900 font-medium">{settings.brokerName}</p>
              <p className="text-gray-600 text-sm">{settings.brokerTitle}</p>
            </div>

            {/* PRC License Number */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                PRC License Number
              </h3>
              <p className="text-gray-900">PRC No. {settings.prcNumber}</p>
            </div>

            {/* Office Address */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Office Address
              </h3>
              <p className="text-gray-900 leading-relaxed">
                {settings.officeAddress}
              </p>
            </div>

            {/* Contact Number */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Contact Number
              </h3>
              <p className="text-gray-900">
                <a
                  href={`tel:${settings.contactNumber}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {settings.contactNumber}
                </a>
              </p>
            </div>

            {/* Email Address */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                Email Address
              </h3>
              <p className="text-gray-900">
                <a
                  href={`mailto:${settings.emailAddress}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {settings.emailAddress}
                </a>
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              About {settings.businessName}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              {settings.businessName} is a licensed real estate brokerage based in
              San Fernando, Pampanga. We specialize in residential and commercial
              property sales, rentals, and lot listings across the Pampanga region.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our licensed broker, {settings.brokerName} ({settings.brokerTitle},
              PRC No. {settings.prcNumber}), brings expertise and dedication to
              every property transaction, helping buyers and investors find the
              right property at the right price.
            </p>
          </div>
        </div>

        {/* Right Column — Contact & Social */}
        <div className="space-y-6">
          {/* Social Links Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Follow Us
            </h2>
            <SocialLinks />
          </div>

          {/* CTA Card */}
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">Interested in a Property?</h2>
            <p className="text-blue-100 text-sm mb-4 leading-relaxed">
              Browse our listings or send us a message and we'll get back to you
              as soon as possible.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/listings"
                className="block text-center px-4 py-2 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                View Listings
              </Link>
              <Link
                href="/contact"
                className="block text-center px-4 py-2 border border-white text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
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

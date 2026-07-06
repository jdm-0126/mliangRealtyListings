import type { Metadata } from 'next'
import { getTenantSettingsServer } from '@/lib/tenantServer'
import InquiryForm from '../components/InquiryForm'

export const metadata: Metadata = {
  title: 'Contact M. Liang Realty – Get in Touch',
  description:
    'Contact M. Liang Realty for all your property needs in Pampanga. Located in San Fernando, Pampanga. Call 09393440944 or send us a message.',
}

export default function ContactPage() {
  const settings = getTenantSettingsServer()

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600">
          We're here to help with your property needs in Pampanga
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column — Contact Information */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>

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
            <div className="mb-4">
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

            {/* PRC License */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                PRC License Number
              </h3>
              <p className="text-gray-900">{settings.prcNumber}</p>
            </div>
          </div>

          {/* Google Map */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Find Us</h2>
            <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Plaza+Cristina+Building+Dolores+San+Fernando+Pampanga+Philippines&output=embed&z=16"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="M. Liang Realty Office Location"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Plaza Cristina Building, Dolores, San Fernando, Pampanga
            </p>
          </div>
        </div>

        {/* Right Column — Inquiry Form */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Us a Message</h2>
            <InquiryForm contactNumber={settings.contactNumber} />
          </div>
        </div>
      </div>
    </main>
  )
}

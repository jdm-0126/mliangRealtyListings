// app/(public)/contact/page.tsx
import type { Metadata } from 'next'
import { getTenantSettingsServer } from '@/lib/tenantServer'
import ContactTabs from '../components/ContactTabs'
import { MapPin, Phone, Mail, Award } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact M. Liang Realty – Get in Touch',
  description:
    'Reach out to M. Liang Realty in San Fernando, Pampanga — inquire about a property or list yours with us.',
}

interface ContactPageProps {
  searchParams: Promise<{ property?: string; tab?: string }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const settings = getTenantSettingsServer()
  const { property, tab } = await searchParams
  const propertyOfInterest = property ? decodeURIComponent(property) : ''
  const initialTab = tab === 'sell' ? 'sell' : 'inquire'

  const contactItems = [
    { icon: MapPin, label: 'Office Address', value: settings.officeAddress, href: undefined },
    { icon: Phone, label: 'Contact Number', value: settings.contactNumber, href: `tel:${settings.contactNumber}` },
    { icon: Mail, label: 'Email Address', value: settings.emailAddress, href: `mailto:${settings.emailAddress}` },
    { icon: Award, label: 'PRC License', value: `PRC No. ${settings.prcNumber}`, href: undefined },
  ]

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
          Get in Touch
        </p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--est-text)' }}>Contact Us</h1>
        <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
          Looking for a property, or want to list yours? We can help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left — contact info + map */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-6" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--est-text)' }}>Contact Information</h2>
            <div className="space-y-5">
              {contactItems.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--est-purple)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--est-muted)' }}>{label}</p>
                    {href ? (
                      <a href={href} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--est-text)' }}>{value}</a>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--est-text)' }}>{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--est-border)' }}>
            <div className="w-full h-52">
              <iframe
                src="https://maps.google.com/maps?q=Plaza+Cristina+Building+Dolores+San+Fernando+Pampanga+Philippines&output=embed&z=16"
                width="100%" height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="M. Liang Realty Office Location"
              />
            </div>
            <div className="px-4 py-3" style={{ background: 'var(--est-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--est-muted)' }}>
                Plaza Cristina Building, Dolores, San Fernando, Pampanga
              </p>
            </div>
          </div>
        </div>

        {/* Right — tabbed forms */}
        <div className="lg:col-span-3">
          <ContactTabs
            contactNumber={settings.contactNumber}
            initialPropertyOfInterest={propertyOfInterest}
            initialTab={initialTab}
          />
        </div>
      </div>
    </main>
  )
}

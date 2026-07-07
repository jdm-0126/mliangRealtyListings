import type { Metadata } from 'next'
import { TENANT_DEFAULTS } from '@/lib/types/public'
import AboutContent from './AboutContent'

// Static metadata (uses TENANT_DEFAULTS for SSR since localStorage is client-only)
export const metadata: Metadata = {
  title: `About ${TENANT_DEFAULTS.businessName} – Licensed Real Estate Broker PRC No. ${TENANT_DEFAULTS.prcNumber}`,
  description: `Learn about ${TENANT_DEFAULTS.businessName}, a licensed real estate brokerage in San Fernando, Pampanga. Broker: ${TENANT_DEFAULTS.brokerName}, ${TENANT_DEFAULTS.brokerTitle}, PRC License No. ${TENANT_DEFAULTS.prcNumber}.`,
  openGraph: {
    title: `About ${TENANT_DEFAULTS.businessName}`,
    description: `Licensed Real Estate Broker in San Fernando, Pampanga – PRC No. ${TENANT_DEFAULTS.prcNumber}`,
    url: 'https://realtyprov1.com/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `About ${TENANT_DEFAULTS.businessName}`,
    description: `Licensed Real Estate Broker in San Fernando, Pampanga – PRC No. ${TENANT_DEFAULTS.prcNumber}`,
  },
  alternates: { canonical: 'https://realtyprov1.com/about' },
}

export default function AboutPage() {
  return <AboutContent />
}

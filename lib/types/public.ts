// lib/types/public.ts

export interface PublicListing {
  id: number
  displayId: number          // id > 2 ? id - 1 : id
  type: string
  location: string
  village?: string
  price: number | null
  lotArea: number | null
  floorArea: number | null
  bedrooms: number | null
  bathrooms: number | null
  previewPhoto: string | null
  photos: string[]
  notes: string
  status: string
  mapUrl?: string | null
  videoUrl?: string | null
  facebookVideoUrl?: string | null
  tiktokVideoUrl?: string | null
  featured?: boolean
  updatedAt?: string
}

export interface TenantSettings {
  businessName: string
  brokerName: string
  brokerTitle: string
  prcNumber: string
  officeAddress: string
  contactNumber: string
  emailAddress: string
}

export const TENANT_DEFAULTS: TenantSettings = {
  businessName:  'M. Liang Realty',
  brokerName:    'M. Liang',
  brokerTitle:   'Licensed Real Estate Broker',
  prcNumber:     '0019653',
  officeAddress: 'S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga',
  contactNumber: '09393440944',
  emailAddress:  'contact@realtyprov1.com',
}

export interface LeadInsert {
  full_name: string
  contact_number: string
  email: string
  property_of_interest?: string
  message: string
  created_at: string   // ISO 8601 UTC
}

export interface SocialConfig {
  facebook?:  string
  instagram?: string
  tiktok?:    string
  youtube?:   string
  viber?:     string
  whatsapp?:  string
}

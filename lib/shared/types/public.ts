// lib/types/public.ts

export interface Property {
    id: number
    propertyId: number
    displayId: string | number
    userId: string | number |null
    title?: string
    type?: string
    location?: string
    village?: string
    financingOptions?: string[]
    listingPrice?: number | null
    lotArea?: number | null
    floorArea?: number | null
    mapUrl?: string | null
    googleMapsUrl?: string
    bedrooms?: number | null
    bathrooms?: number | null
    cgt?: string
    tenantId?: string
    negotiable?: boolean
    transferTitle?: boolean
    preview_photo?: string
    photos?: string[]
    status?: string
    listingMode?: string
    listingAgent?: string
    fbLink?: string
    videoUrl?: string | null
    facebookVideoUrl?: string | null
    tiktokVideoUrl?: string | null
    notes?: string
    description?: string
    featured?: boolean
}

export const TABLES = {
  listings: "listings",
  gallery: "gallery",
  sytem_settings: "sytem_settings",
  leads: "leads",
  roles: "roles",
  users: "users",
  website_content: "website_content",
  tenant_registry: "tenant_registry"
} as const;

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

export interface TenantSettings {
  businessName: string
  brokerName: string
  brokerTitle: string
  prcNumber: string
  officeAddress: string
  contactNumber: string
  emailAddress: string
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

export interface MonthlyPayment {
  years: number;
  months: number;
  monthly: number;
  totalPaid: number;
  totalInterest: number;
}

export interface FinancingResult {
  totalPrice: number;
  equity: number;
  loanAmount: number;
  rawMortgage?: number;
  monthlyPayments: MonthlyPayment[];
}


export interface PropertyGalleryImage {
  id: string;
  listingId: number;
  url: string;
  publicId?: string;
  title?: string;
  isFeatured: boolean;
}
export interface UseFacebookPostProps {
  property: Property | null;
  tenantSettings: TenantSettings;
  hasPhotos?: boolean;
  hasVideo?: boolean;
}

export interface FacebookPreviewProps {
  property: any
  hasPhotos: boolean
  hasVideo: boolean
  tenantSettings: TenantSettings
}

export interface BuildFacebookPostOptions {
  property: Property | null;
  hasPhotos?: boolean;
  hasVideo?: boolean;
}

export interface WebsiteContentSection {
  key: string
  name: string
  entries: WebsiteContentEntry[]
}

export interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  category: 'property' | 'event' | 'general'
  cloudinary_secure_url: string
  is_featured: boolean
  created_at: string
}

export type WebsiteContentType = 'text' | 'html' | 'json'

export interface WebsiteContentEntry {
  id?: string
  section_key: string
  content_type: WebsiteContentType
  content_value: string
  is_active?: boolean
  display_order?: number
}

export interface FeaturedToggleProps {
  propertyId: number
  isFeatured: boolean | null | undefined
  canToggle: boolean
  onToggle?: (newValue: boolean) => void
}

export interface PropertyDialogProps {
    property?: any
    isOpen: boolean
    onClose(): void
    columns: string[]
    onSaved?(property: any): void
}

export interface ListingsClientWrapperProps {
  allListings: Property[]
  initialType?: string
  initialLocation?: string
  initialPrice?: string
  initialMode?: string
}


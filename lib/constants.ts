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

// lib/shared/constants.ts

// Pagination
export const DEFAULT_PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 48

// Local Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'tenantSettings',
  PUBLIC_VIEW_MODE: 'publicListingsViewMode',
  ADMIN_VIEW_MODE: 'adminPropertiesViewMode',
} as const

// Property Types
export const PROPERTY_TYPES = [
  'All',
  'House and Lot',
  'Lot Only',
  'Commercial',
  'Condo',
  'Apartment',
] as const

// Price Ranges
export const PRICE_RANGES = [
  'All',
  'Under ₱2M',
  '₱2M–₱5M',
  '₱5M–₱10M',
  'Above ₱10M',
  'Above ₱20M'
] as const

export const SORT_OPTIONS = [
  'newest',
  'oldest',
  'title_asc',
  'title_desc',
  'location_asc',
  'location_desc',
  'price-high',
  'price-low',
] as const

export const STATUS_OPTIONS = [
  'all',
  'active',
  'sold',
  'draft',
] as const

const floatFields = [
  "Listing_Price",
  "Lot Area sqm",
  "Floor Area sqm",
  // "Latitude",
  // "Longitude",
  // "HOA_Fee",
  // "Reservation_Fee",
  // "Downpayment",
  // "Monthly_Amortization",
  // "Monthly_Income_Required",
]

const intFields = [
  "property_id",
  "Bedroom",
  "T&B",
  "Garage",
]

// floatFields.forEach(field => {
//   if (clean[field] !== undefined && clean[field] !== "") {
//     clean[field] = parseFloat(
//       String(clean[field]).replace(/[₱,\s]/g, "")
//     )
//   }
// })

// intFields.forEach(field => {
//   if (clean[field] !== undefined && clean[field] !== "") {
//     clean[field] = Number(clean[field])
//   }
// })



export const VIEW_MODES = ['grid', 'list'] as const

export type PropertyType = typeof PROPERTY_TYPES[number]
export type SortOption = typeof SORT_OPTIONS[number]
export type ViewMode = typeof VIEW_MODES[number]

export const HASHTAGS = [
  'RealEstatePH',
  'PropertyPH',
  'BuyPhilippines',
  'SellPhilippines',
  'PhilippineProperty',
  'PropertyForSale',
  'PropertyForRent',
  'HouseAndLotPH',
  'CondoPH',
  'ApartmentPH',
  'CommercialPH',
  'LotOnlyPH',
  'RealEstateAgentPH',
  'PropertyInvestmentPH',
  'PhilippineRealEstate',
  'BuyPropertyPH',
  'SellPropertyPH',
  'PropertyListingPH',
  'RealEstateBrokerPH',
  'PropertyDealsPH',
  'BestPropertyPH',
  'AffordableHousingPH',
  'LuxuryPropertyPH',
  'NewPropertyPH',
  'ResalePropertyPH',
  'PropertySearchPH',
  'FindYourDreamHomePH',
  'RealEstateOpportunityPH',
  'InvestInPhilippinesPH',
  'PropertyMarketPH',
  'RealEstateTrendsPH',
  'PropertyManagementPH',
  'RealEstateServicesPH',
  'PropertyConsultationPH',
  'RealEstateSupportPH',
  'PropertyMarketingPH',
  'RealEstatePromotionPH',
  'PropertyAdvertisementPH',
  'RealEstateShowcasePH',
  'PropertyExhibitionPH',
  'RealEstateEventPH',
  'PropertyFairPH',
  'RealEstateConferencePH',
  'PropertyNetworkingPH',
  'RealEstateCommunityPH',
  'PropertyLoversPH',
  'RealEstateEnthusiastsPH',
  'PropertyHuntersPH',
  'RealEstateSeekersPH',
  'PropertyBuyersPH',
  'PropertySellersPH',
  'RealEstateInvestorsPH',
  'PropertyDevelopersPH',
  'RealEstateAgentsPH',
  'PropertyBrokersPH',
  'RealEstateExpertsPH',
  'PropertySpecialistsPH',
  'RealEstateProfessionalsPH',
  'PropertyGurusPH',
  'RealEstateMastersPH',
  'PropertyWhizzesPH',
  'RealEstateGeniusesPH',
  'PropertyNinjasPH',
  'RealEstateRockstarsPH',
  'PropertyLegendsPH',
  'RealEstateIconsPH',
  'PropertyVipsPH',
  'RealEstateElitePH',
  'PropertyChampionsPH',
  'RealEstate']
// lib/shared/components/property/PropertyConfig.ts

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'price'
  | 'select'
  | 'radio'
  | 'boolean'

export interface PropertyFieldConfig {
  key: string
  label: string
  type: FieldType

  options?: string[]

  required?: boolean

  hidden?: boolean

  section?: string

  fullWidth?: boolean
}
export const HIDDEN_FIELDS = [
  'id',
  'property_id',
  'tenant_id',
  'user_id',
  'created_at',
  'updated_at',
]
export const PROPERTY_FIELDS: Record<string, PropertyFieldConfig> = {

    title: {
    key: 'Title',
    label: 'Title',
    type: 'text',
  },

    status: {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['Draft', 'Active', 'Sold'],
    section: 'Basic',
  },

    type: {
    key: 'type',
    label: 'Property Type',
    type: 'select',
    options: [
      'Residential',
      'House and Lot',
      'Lot',
      'Commercial',
    ],
  },
    listingMode: {
    key: 'listingMode',
    label: 'Listing Mode',
    type: 'radio',
    options: ['For Sale', 'For Rent'],
    section: 'Basic',
  },

    location: {
    key: 'location',
    label: 'Location',
    type: 'text',
    required: true,
    section: 'Location',
    },

    village: {
    key: 'village',
    label: 'Village',
    type: 'text',
    required: true,
    section: 'Location',
    },

    price: {
    key: 'listing_price',
    label: 'Listing Price',
    type: 'price',
    section: 'Pricing',
    },

    lotArea: {
    key: 'lotArea',
    label: 'Lot Area',
    type: 'number',
    section: 'Measurements',
    },

    floorArea: {
    key: 'floorArea',
    label: 'Floor Area',
    type: 'number',
    section: 'Measurements',
  },

    bedrooms: {
    key: 'bedrooms',
    label: 'Bedrooms',
    type: 'number',
    section: 'Measurements',
  },

    bathrooms: {
    key: 'bathrooms',
    label: 'Bathrooms',
    type: 'number',
    section: 'Measurements',
  },
    description: {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    section: 'Description',
    fullWidth: true,
  },

    notes: {
    key: 'notes',
    label: 'Notes',
    type: 'textarea',
    section: 'Description',
    fullWidth: true,
  }
}


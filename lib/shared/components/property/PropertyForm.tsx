'use client'

import { useState } from 'react'
import { Property } from '@/lib/shared/types/public'
import PropertyField from './PropertyField'
import { PROPERTY_FIELDS, PropertyFieldConfig } from './propertyConfig'
import { Info, Home, DollarSign, MapPin, ExternalLink, Eye, EyeOff, Image as ImageIcon, FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PropertyFormProps {
  value: Property
  onChange: (property: Property) => void
  columns: string[]
  isLotOnly?: boolean
}

const PROPERTY_TYPES = [
  'Residential',
  'House and Lot',
  'Lot only',
  'Commercial',
  'Condo',
]

const DEFAULT_MAP_LOCATION = 'San Fernando, Pampanga'

// Keys that should be read-only/disabled
const READ_ONLY_KEYS = new Set([
  'id',
  'Id',
  'tenant_id',
  'tenantId',
  'Tenant Id',
  'display_id',
  'displayId',
  'DisplayId',
  'property_id',
  'propertyId',
  'Property_id',
  'user_id',
  'userId',
  'UserId',
])

// Keys that should render as a Textarea
const TEXTAREA_KEYS = new Set([
  'notes',
  'description',
])

// Structural building keys hidden when type is Lot/Lot Only
const HOUSE_ONLY_KEYS = new Set([
  'bedrooms',
  'bathrooms',
  'floor_area',
  'floor_area_sqm',
  'Floor_Area',
  'Bedrooms',
  'Bathrooms',
])

const BOOLEAN_KEYS = new Set([
  'featured',
  'is_featured',
  'negotiable',
  'is_negotiable',
])

// Capitalize keys into clean Title Case labels
const formatLabel = (key: string): string => {
  if (!key) return ''
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// Group fields by strict logical proximity
const SECTION_MAP: Record<string, 'basic' | 'pricing' | 'location' | 'details'> = {
  // Basic Info
  id: 'basic',
  Id: 'basic',
  tenant_id: 'basic',
  tenantId: 'basic',
  display_id: 'basic',
  displayId: 'basic',
  property_id: 'basic',
  propertyId: 'basic',
  user_id: 'basic',
  userId: 'basic',
  title: 'basic',
  type: 'basic',
  status: 'basic',
  listing_mode: 'basic',
  featured: 'basic',
  is_featured: 'basic',

  // Pricing & Specs
  listing_price: 'pricing',
  price: 'pricing',
  negotiable: 'pricing',
  is_negotiable: 'pricing',
  lot_area_sqm: 'pricing',
  lotArea: 'pricing',
  floor_area_sqm: 'pricing',
  floorArea: 'pricing',
  bedrooms: 'pricing',
  bathrooms: 'pricing',

  // Location & Map (grouped together)
  location: 'location',
  map_url: 'location',
  mapUrl: 'location',
  video_url: 'location',
  videoUrl: 'location',

  // preview_photo: 'details',
  listing_agent: 'details',
  listingAgent: 'details',
  notes: 'details',
  description: 'details',

}

export default function PropertyForm({
  value,
  onChange,
  columns,
  isLotOnly,
}: PropertyFormProps) {
  const [showMapPreview, setShowMapPreview] = useState(false)

  const propertyType = String(value?.type || '').toLowerCase()
  const lotOnlyActive = isLotOnly ?? (propertyType === 'lot' || propertyType === 'lot only')

  const handleFieldChange = (key: string, newValue: unknown) => {
    // Block mutations to read-only fields
    if (READ_ONLY_KEYS.has(key)) return

    const updatedValue = {
      ...value,
      [key]: newValue,
    }

    const updatedType = String(updatedValue.type || '').toLowerCase()
    if (updatedType === 'lot' || updatedType === 'lot only') {
      HOUSE_ONLY_KEYS.forEach((houseKey) => {
        delete updatedValue[houseKey as keyof Property]
      })
    }

    onChange(updatedValue)
  }

  // Generate Google Maps URL defaulting to San Fernando, Pampanga
  const handleFindOnMap = () => {
    const rawLocation = value.location?.trim() || value.title?.trim() || ''

    let locationQuery = rawLocation
    if (!locationQuery) {
      locationQuery = DEFAULT_MAP_LOCATION
    } else if (!locationQuery.toLowerCase().includes('pampanga')) {
      locationQuery = `${locationQuery}, ${DEFAULT_MAP_LOCATION}`
    }

    const generatedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`

    handleFieldChange('mapUrl', generatedMapUrl)
    setShowMapPreview(true)
  }

  const currentMapUrl = value.mapUrl || value.mapUrl || ''

  const getEmbedMapUrl = (url: string) => {
    if (!url) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(DEFAULT_MAP_LOCATION)}&output=embed`
    }
    if (url.includes('output=embed') || url.includes('maps/embed')) return url
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
  }

  const fields: PropertyFieldConfig[] = columns
    .filter((column) => !(lotOnlyActive && HOUSE_ONLY_KEYS.has(column)))
    .map((column) => {
      const fallbackConfig: PropertyFieldConfig = {
        key: column,
        label: formatLabel(column),
        type: 'text' as const,
      }

      const config = PROPERTY_FIELDS[column] ?? fallbackConfig

      return {
        ...config,
        label: formatLabel(config.label || column),
        optional: HOUSE_ONLY_KEYS.has(column) ? true : config,
      }
    })

  const sections = {
    basic: fields.filter((f) => (SECTION_MAP[f.key] || 'basic') === 'basic'),
    pricing: fields.filter((f) => SECTION_MAP[f.key] === 'pricing'),
    location: fields.filter((f) => SECTION_MAP[f.key] === 'location'),
    details: fields.filter((f) => SECTION_MAP[f.key] === 'details'),
  }

  // Render uniform grid item
  const renderField = (field: PropertyFieldConfig) => {
    const labelText = formatLabel(field.label || field.key)
    const rawVal = value[field.key as keyof Property]

    // 1. Non-Editable Read-Only Fields (Tenant Id, DisplayId, Property_id, Id, userId, etc.)
    if (READ_ONLY_KEYS.has(field.key)) {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500">{labelText}</label>
            <Lock className="w-3 h-3 text-slate-400" />
          </div>
          <input
            type="text"
            readOnly
            disabled
            value={rawVal !== undefined && rawVal !== null ? String(rawVal) : ''}
            className="w-full h-9 px-3 py-1.5 text-sm bg-slate-100 border border-slate-200 text-slate-500 rounded-lg cursor-not-allowed select-all focus:outline-none"
          />
        </div>
      )
    }

    // 2. Textarea Fields (Notes & Description)
    if (TEXTAREA_KEYS.has(field.key)) {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{labelText}</label>
          <textarea
            rows={3}
            value={rawVal !== undefined && rawVal !== null ? String(rawVal) : ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${labelText.toLowerCase()}...`}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all resize-y min-h-[80px]"
          />
        </div>
      )
    }

    // 3. Property Type Dropdown
    if (field.key === 'type') {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{labelText}</label>
          <select
            value={String(value.type || 'Residential')}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            className="w-full h-9 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )
    }

    // 4. Boolean Dropdowns (Featured / Negotiable)
    if (BOOLEAN_KEYS.has(field.key)) {
      const boolStringVal = rawVal === true || String(rawVal) === 'true' ? 'true' : 'false'

      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">{labelText}</label>
          <select
            value={boolStringVal}
            onChange={(e) => handleFieldChange(field.key, e.target.value === 'true')}
            className="w-full h-9 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      )
    }

    // 5. Map URL Field with inline "Find on Map" Trigger
    if (field.key === 'mapUrl') {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">{labelText}</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFindOnMap}
              className="h-5 px-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
            >
              <MapPin className="w-3 h-3" />
              Find
            </Button>
          </div>
          <PropertyField
            config={{ ...field, label: labelText }}
            value={value[field.key as keyof Property]}
            property={value}
            onChange={(newValue) => handleFieldChange(field.key, newValue)}
          />
        </div>
      )
    }

    // Default 3-column field
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <PropertyField
          config={{ ...field, label: labelText }}
          value={value[field.key as keyof Property]}
          property={value}
          onChange={(newValue) => handleFieldChange(field.key, newValue)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Lot-Only Notice Banner */}
      {lotOnlyActive && (
        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-medium">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Building-specific fields (Bedrooms, Bathrooms, Floor Area) are hidden for Lot-Only properties.</span>
        </div>
      )}

      {/* 1. Basic Information */}
      {sections.basic.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Home className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Basic Information</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sections.basic.map(renderField)}
          </div>
        </div>
      )}

      {/* 2. Pricing & Specs */}
      {sections.pricing.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pricing & Dimensions</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sections.pricing.map(renderField)}
          </div>
        </div>
      )}

      {/* 3. Location & Map (Grouped Location + Map URL + Map Preview) */}
      {sections.location.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Location & Map</h4>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!currentMapUrl) handleFindOnMap()
                setShowMapPreview(!showMapPreview)
              }}
              className="h-7 text-xs px-2.5 gap-1 text-slate-600 hover:text-slate-900"
            >
              {showMapPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showMapPreview ? 'Hide Map' : 'Preview Map'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sections.location.map(renderField)}
          </div>

          {/* Inline Embedded Map Preview */}
          {showMapPreview && (
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-red-500" /> San Fernando, Pampanga Default
                </span>
                <a
                  href={currentMapUrl || `https://maps.google.com/?q=${encodeURIComponent(DEFAULT_MAP_LOCATION)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                >
                  Open Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                src={getEmbedMapUrl(currentMapUrl)}
                className="w-full h-48 sm:h-56 border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location Map"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Additional Info & Media */}
      {sections.details.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Media & Additional Notes</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
            {sections.details.map(renderField)}
          </div>
        </div>
      )}
    </div>
  )
}
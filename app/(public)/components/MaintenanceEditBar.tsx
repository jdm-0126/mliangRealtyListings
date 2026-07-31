'use client'

import { useEffect, useState, useMemo } from 'react'
import { Property } from '@/lib/shared/types/public'
import { Pencil, X, MapPin, ExternalLink } from 'lucide-react'
import PropertyDialog from "@/lib/shared/components/property/PropertyDialog"
import { saveProperty } from "@/lib/shared/service/PropertyService"

interface Props {
  listing: Property
  onEdit?: (listing: Property) => void
  onUpdated?: (updated: Partial<Property>) => void
}

const TYPES = ['Residential', 'House and Lot', 'Lot only', 'Commercial', 'Condo']

export function useMaintenanceMode() {
  const [on, setOn] = useState(false)
  
  useEffect(() => {
    const sync = () => setOn(localStorage.getItem('maintenanceMode') === 'true')
    sync()
    window.addEventListener('maintenanceModeChange', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('maintenanceModeChange', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return on
}

// ── Map preview modal ─────────────────────────────────────────────────────────

function MapModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embedUrl = (() => {
    if (url.includes('maps/embed')) return url
    const q = encodeURIComponent(url)
    return `https://maps.google.com/maps?q=${q}&output=embed`
  })()

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" /> Location Map
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <iframe
          src={embedUrl}
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Property location map"
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MaintenanceEditBar({ listing, onUpdated }: Props) {
  const maintenance = useMaintenanceMode()
  const [open, setOpen] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [properties, setProperties] = useState(listing)
  
  // Fields
  const [type, setType] = useState(listing.type ?? '')
  const [notes, setNotes] = useState(listing.notes ?? '')
  const [photo, setPhoto] = useState(listing.preview_photo ?? '')
  const [listingAgent, setlistingAgent] = useState(listing.listingAgent ?? '')
  const [price, setPrice] = useState(listing.listingPrice != null ? String(listing.listingPrice) : '')
  const [lotArea, setLotArea] = useState(listing.lotArea != null ? String(listing.lotArea) : '')
  const [floorArea, setFloorArea] = useState(listing.floorArea != null ? String(listing.floorArea) : '')
  const [mapUrl, setMapUrl] = useState(listing.mapUrl ?? '')
  const [title, setTitle] = useState(listing.title ?? '')
  const [location, setLocation] = useState(listing.location ?? '')
  const [status, setStatus] = useState(listing.status ?? '')
  const [listingMode, setListingMode] = useState(listing.listingMode ?? '')
  const [form, setForm] = useState({ ...listing })
  const [bedrooms, setBedrooms] = useState(
    listing.bedrooms != null ? String(listing.bedrooms) : ''
  )
  const [bathrooms, setBathrooms] = useState(
    listing.bathrooms != null ? String(listing.bathrooms) : ''
  )
  const [videoUrl, setVideoUrl] = useState(listing.videoUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Safely extract FB link from listing prop (handling snake_case or camelCase)
  const fbLink = (listing as any)?.fb_link || (listing as any)?.fbLink

  useEffect(() => {
    if (!open) return

    setForm({
      ...listing,
    })

    setSaved(false)
  }, [listing, open])

  const handleSave = async () => {
    try {
      setSaving(true)
      const { getTenantScopedClient } = await import('@/lib/supabase/browserTenantClient')
      const { supabase, listingsTable } = await getTenantScopedClient()

      const payload: Record<string, any> = {
        title: form.title,
        location: form.location,
        type: form.type,
        listing_mode: form.listingMode,
        status: form.status,
        listing_price: form.listingPrice,
        lot_area_sqm: form.lotArea,
        floor_area_sqm: form.floorArea,
        bedroom: form.bedrooms,
        bathroom: form.bathrooms,
        preview_photo: form.preview_photo,
        notes: form.notes,
        listing_agent: form.listingAgent,
        map_url: form.mapUrl,
        video_url: form.videoUrl,
      }

      if (price.trim())
        payload.listing_price = parseFloat(price.replace(/,/g, ''))

      if (lotArea.trim())
        payload.lot_area_sqm = parseFloat(lotArea)

      if (floorArea.trim())
        payload.floor_area_sqm = parseFloat(floorArea)

      onUpdated?.({
        type,
        notes,
        title,
        listingAgent,
        preview_photo: photo,
        listingPrice: price.trim() ? parseFloat(price.replace(/,/g, '')) : listing.listingPrice,
        lotArea: lotArea.trim() ? parseFloat(lotArea) : listing.lotArea,
        floorArea: floorArea.trim() ? parseFloat(floorArea) : listing.floorArea,
        mapUrl: mapUrl,
      })

      const { error } = await supabase
        .from(listingsTable)
        .update(payload)
        .eq("property_id", listing.propertyId)

      if (error) {
        console.error(error)
        return
      }

      setSaved(true)
      setTimeout(() => { setShowDialog(false); setSaved(false) }, 800)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProperty = async (property: Property) => {
    const updated = await saveProperty(property)
    setSelectedProperty(updated)
    setShowDialog(false)
  }

  const columns = useMemo(() => {
    if (!properties) return []
    return Object.keys(properties)
  }, [properties])

  // NOTE: If you want the FB link to show ALL THE TIME (even when maintenance mode is off), 
  // remove the line below. Otherwise, both buttons will show when maintenance mode is active.
  if (!maintenance) return null

  return (
    <>
      {/* Top Right Action Controls Group */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        {fbLink && (
          <a
            href={fbLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md bg-blue-600 text-white transition-all hover:bg-blue-700 hover:scale-105"
            title="View listing on Facebook"
          >
            <ExternalLink className="w-3 h-3" /> Facebook
          </a>
        )}

        {/* Edit button */}
        <button
          onClick={e => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            setShowDialog(true);
          }}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md transition-all hover:scale-105"
          style={{ background: 'hsl(var(--primary))', color: '#fff' }}
          title="Edit listing (maintenance mode)"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </div>

      {/* Edit modal */}
      {showDialog && (
        <PropertyDialog
          property={listing}
          open={showDialog}
          onClose={() => setShowDialog(false)}
          columns={columns}
          onSave={handleSaveProperty}
        />
      )}

      {/* Map preview modal */}
      {showMap && mapUrl && (
        <MapModal url={mapUrl} onClose={() => setShowMap(false)} />
      )}
    </>
  )
}
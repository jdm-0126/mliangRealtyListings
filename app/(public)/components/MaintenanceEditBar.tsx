'use client'

import { useEffect, useState } from 'react'
import { PublicListing } from '@/lib/types/public'
import { Pencil, X, Check, Loader2, MapPin } from 'lucide-react'

interface Props {
  listing: PublicListing
  onUpdated?: (updated: Partial<PublicListing>) => void
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
  // Convert any Google Maps share URL to embeddable format
  const embedUrl = (() => {
    if (url.includes('maps/embed')) return url
    // https://maps.app.goo.gl/... or https://goo.gl/maps/...
    // Use the /maps?q= embed approach with the raw URL as query
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

  // Fields
  const [type, setType]       = useState(listing.type ?? '')
  const [notes, setNotes]     = useState(listing.notes ?? '')
  const [photo, setPhoto]     = useState(listing.previewPhoto ?? '')
  const [price, setPrice]     = useState(listing.price != null ? String(listing.price) : '')
  const [lotArea, setLotArea] = useState(listing.lotArea != null ? String(listing.lotArea) : '')
  const [floorArea, setFloorArea] = useState(listing.floorArea != null ? String(listing.floorArea) : '')
  const [mapUrl, setMapUrl]   = useState(listing.mapUrl ?? '')

  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    if (open) {
      setType(listing.type ?? '')
      setNotes(listing.notes ?? '')
      setPhoto(listing.previewPhoto ?? '')
      setPrice(listing.price != null ? String(listing.price) : '')
      setLotArea(listing.lotArea != null ? String(listing.lotArea) : '')
      setFloorArea(listing.floorArea != null ? String(listing.floorArea) : '')
      setMapUrl(listing.mapUrl ?? '')
      setSaved(false)
    }
  }, [open, listing])

  if (!maintenance) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const { getTenantScopedClient } = await import('@/lib/supabase/browserTenantClient')
      const { supabase, listingsTable } = await getTenantScopedClient()

      const payload: Record<string, unknown> = {
        Type: type,
        Notes: notes,
        'Preview Photo': photo || null,
        'Map URL': mapUrl || null,
      }
      if (price.trim())     payload['Listing Price'] = parseFloat(price.replace(/,/g, '')) || null
      if (lotArea.trim())   payload['Lot Area sqm']  = parseFloat(lotArea) || null
      if (floorArea.trim()) payload['Floor Area sqm'] = parseFloat(floorArea) || null

      const { error } = await supabase
        .from(listingsTable)
        .update(payload)
        .eq('property_id', listing.property_id)

      if (error) { alert('Save failed: ' + error.message); return }

      setSaved(true)
      onUpdated?.({
        type,
        notes,
        previewPhoto: photo || null,
        price: price.trim() ? parseFloat(price.replace(/,/g, '')) || null : listing.price,
        lotArea: lotArea.trim() ? parseFloat(lotArea) || null : listing.lotArea,
        floorArea: floorArea.trim() ? parseFloat(floorArea) || null : listing.floorArea,
        mapUrl: mapUrl || null,
      })
      setTimeout(() => { setOpen(false); setSaved(false) }, 800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Edit button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="absolute top-2 right-2 z-20 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg transition-all hover:scale-105"
        style={{ background: 'hsl(var(--primary))', color: '#fff' }}
        title="Edit listing (maintenance mode)"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>

      {/* Edit modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Listing #{listing.displayId}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{listing.location}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable fields */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  {!TYPES.includes(type) && type && <option value={type}>{type}</option>}
                </select>
              </div>

              {/* Price / Lot / Floor — 3 cols */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Price <span className="text-gray-300 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 3500000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Lot Area <span className="text-gray-300 font-normal normal-case">(sqm)</span>
                  </label>
                  <input
                    type="text"
                    value={lotArea}
                    onChange={e => setLotArea(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Floor Area <span className="text-gray-300 font-normal normal-case">(sqm)</span>
                  </label>
                  <input
                    type="text"
                    value={floorArea}
                    onChange={e => setFloorArea(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
              </div>

              {/* Preview Photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Preview Photo URL</label>
                <input
                  type="text"
                  value={photo}
                  onChange={e => setPhoto(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
                />
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>

              {/* Map URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Map Link <span className="text-gray-300 font-normal normal-case">(Google Maps URL — optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mapUrl}
                    onChange={e => setMapUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
                  />
                  {mapUrl && (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white shrink-0"
                      style={{ background: '#16a34a' }}
                    >
                      <MapPin className="w-3.5 h-3.5" /> Preview
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Paste a Google Maps share link. Visitors can view the map without leaving the page.</p>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-70"
                style={{ background: saved ? '#16a34a' : 'hsl(var(--primary))' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map preview modal */}
      {showMap && mapUrl && (
        <MapModal url={mapUrl} onClose={() => setShowMap(false)} />
      )}
    </>
  )
}

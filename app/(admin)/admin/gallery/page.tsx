'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { uploadManyToCloudinary } from '@/lib/cloudinary'
import { getGallery } from "@/lib/shared/gallery/getGallery";
import { supabase } from "@/lib/supabase/client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { TABLES } from "@/lib/supabase/tables"
import {
  Upload, Trash2, Star, StarOff, ImageIcon, X, CheckCircle2, Loader2, Link2,
} from 'lucide-react'

const TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '81b78be3-db0c-41f3-8f6f-e3989114eacf'

type GalleryCategory = 'property' | 'event' | 'general'

interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  category: GalleryCategory
  cloudinary_public_id: string
  cloudinary_secure_url: string
  width: number | null
  height: number | null
  is_featured: boolean
  display_order: number
  listing_id: number | null
  created_at: string
}

interface Listing {
  id: number
  location: string
  title: string
}

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  property: 'Property Photo',
  event:    'Event / News',
  general:  'General',
}

const CATEGORY_COLORS: Record<GalleryCategory, string> = {
  property: 'bg-blue-100 text-blue-800',
  event:    'bg-purple-100 text-purple-800',
  general:  'bg-gray-100 text-gray-700',
}

// ── Listing picker modal ──────────────────────────────────────────────────────

function ListingPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (listing: Listing) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from(TABLES.listings ?? 'listings')
          .select('id, location, title')
          .order('id', { ascending: false })
          .limit(50)

        if (search.trim()) {
          query = query.or(`location.ilike.%${search}%,title.ilike.%${search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        const formatted: Listing[] = (data ?? []).map((item: any) => ({
          id: item.id,
          location: item.location ?? '',
          title: item.title ?? '',
        }))

        setListings(formatted)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      run()
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Select Listing</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-3 border-b">
          <Input
            autoFocus
            placeholder="Search by location or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : listings.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No listings found</p>
          ) : (
            listings.map(l => (
              <button
                key={l.id}
                onClick={() => onSelect(l)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{l.location || l.title || `#${l.id}`}</p>
                <p className="text-xs text-gray-400">Property #{l.id}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<GalleryCategory | 'all'>('all')
  const [filterFeatured, setFilterFeatured] = useState(false)

  // Upload state
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [uploadCategory, setUploadCategory] = useState<GalleryCategory>('general')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadListing, setUploadListing] = useState<Listing | null>(null)
  const [showListingPicker, setShowListingPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDone, setUploadDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assign-to-listing state (for existing gallery items)
  const [assigningItem, setAssigningItem] = useState<GalleryItem | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getGallery(filterCategory, filterFeatured)
      setItems(data)
    } catch (err) {
      console.error('Failed to fetch items:', err)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterFeatured])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    setUploadFiles(files)
    setUploadDone(false)
  }

  // Extract public_id from a Cloudinary URL
  const extractPublicId = (url: string): string => {
    const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+?)(?:\.[a-z]+)?$/i)
      ?? url.match(/\/upload\/(.+?)(?:\.[a-z]+)?$/i)
    return match ? match[1] : url
  }

  const handleUrlSave = async () => {
    const url = urlInput.trim()
    if (!url || !url.startsWith('http')) { alert('Enter a valid Cloudinary URL'); return }
    setUploading(true)
    try {
      const secureUrl = url.replace('http://', 'https://')
      const publicId = extractPublicId(url)
      const row = {
        tenant_id:             TENANT_ID,
        category:              uploadCategory,
        title:                 uploadTitle || null,
        description:           null,
        cloudinary_public_id:  publicId,
        cloudinary_url:        secureUrl,
        cloudinary_secure_url: secureUrl,
        listing_id:            uploadCategory === 'property' ? (uploadListing?.id ?? null) : null,
        is_featured:           uploadCategory === 'event',
      }

      const { error } = await supabase.from(TABLES.gallery).insert(row)
      if (error) throw error

      setUploadDone(true)
      setUrlInput('')
      setUploadTitle('')
      setUploadListing(null)
      fetchItems()
    } catch (err: any) {
      alert('Failed: ' + (err?.message ?? String(err)))
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async () => {
  if (uploadFiles.length === 0) return
  setUploading(true)
  setUploadProgress(0)
  try {
    const folder = `GalleryMliang/${uploadCategory}`
    const results = await uploadManyToCloudinary(
      uploadFiles,
      folder,
      (done, total) => setUploadProgress(Math.round((done / total) * 100))
    )

    for (const r of results) {
      const { error } = await supabase
        .from(TABLES.gallery)
        .insert({
          tenant_id: TENANT_ID,
          category: uploadCategory,
          title: uploadTitle || null,
          description: null,
          cloudinary_public_id: r.public_id,
          cloudinary_url: r.secure_url, // <-- ADD THIS LINE
          cloudinary_secure_url: r.secure_url,
          width: r.width,
          height: r.height,
          listing_id:
            uploadCategory === "property"
              ? uploadListing?.id ?? null
              : null,
          is_featured: uploadCategory === "event",
        })

      if (error) throw error
    }

    setUploadDone(true)
    setUploadFiles([])
    setUploadTitle('')
    setUploadListing(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    fetchItems()
  } catch (err: any) {
    alert('Upload failed: ' + (err?.message ?? String(err)))
  } finally {
    setUploading(false)
  }
}

  // ── Assign existing gallery image to a listing ────────────────────────────

  const handleAssign = async (item: GalleryItem, listing: Listing) => {
    try {
      const { error } = await supabase
        .from(TABLES.gallery)
        .update({ listing_id: listing.id })
        .eq('id', item.id)

      if (error) throw error

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, listing_id: listing.id } : i))
      setAssigningItem(null)
      alert(`Photo assigned to Property #${listing.id} — ${listing.location}`)
    } catch (err: any) {
      alert('Failed to assign listing: ' + (err?.message ?? String(err)))
    }
  }

  const toggleFeatured = async (item: GalleryItem) => {
    const nextVal = !item.is_featured
    try {
      const { error } = await supabase
        .from(TABLES.gallery)
        .update({ is_featured: nextVal })
        .eq('id', item.id)

      if (error) throw error

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: nextVal } : i))
    } catch (err: any) {
      alert('Failed to update featured status: ' + (err?.message ?? String(err)))
    }
  }

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm(`Delete "${item.title ?? 'this image'}"? This cannot be undone.`)) return
    try {
      const { error } = await supabase
        .from(TABLES.gallery)
        .delete()
        .eq('id', item.id)

      if (error) throw error

      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (err: any) {
      alert('Failed to delete item: ' + (err?.message ?? String(err)))
    }
  }

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.gallery)
        .update({
          title: editTitle || null,
          description: editDescription || null,
        })
        .eq('id', id)

      if (error) throw error

      setItems(prev => prev.map(i => i.id === id ? { ...i, title: editTitle || null, description: editDescription || null } : i))
      setEditingId(null)
    } catch (err: any) {
      alert('Failed to save edits: ' + (err?.message ?? String(err)))
    }
  }

  const filtered = items.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false
    if (filterFeatured && !i.is_featured) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-500 mt-1">
            Upload property photos to assign as listing preview images, or upload event/general images for the homepage.
          </p>
        </div>

        {/* ── Upload Panel ── */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Images</h2>
              {/* Mode tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => { setUploadMode('file'); setUploadDone(false) }}
                  className={`px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                    uploadMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  onClick={() => { setUploadMode('url'); setUploadDone(false) }}
                  className={`px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                    uploadMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Paste URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={e => { setUploadCategory(e.target.value as GalleryCategory); setUploadListing(null) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
                >
                  <option value="general">General</option>
                  <option value="event">Event / News (featured on homepage)</option>
                  <option value="property">Property Photo (assign to listing)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <Input
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Seminar 2025, Property Turnover..."
                />
              </div>
            </div>

            {/* Listing picker — only for property category */}
            {uploadCategory === 'property' && (
              <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Assign to Listing <span className="text-blue-500 font-normal">(optional — can assign later)</span>
                </p>
                {uploadListing ? (
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadListing.location || uploadListing.title}</p>
                      <p className="text-xs text-gray-400">Property #{uploadListing.id}</p>
                    </div>
                    <button onClick={() => setUploadListing(null)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowListingPicker(true)}
                    className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:underline"
                  >
                    <Link2 className="w-4 h-4" />
                    Select a listing to assign this photo to
                  </button>
                )}
                <p className="text-xs text-blue-600">
                  The uploaded image will be set as the listing's preview photo on the website.
                </p>
              </div>
            )}

            {/* ── URL mode ── */}
            {uploadMode === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cloudinary Image URL</label>
                  <Input
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setUploadDone(false) }}
                    placeholder="https://res.cloudinary.com/..."
                    className="font-mono text-xs"
                  />
                </div>
                {urlInput.startsWith('http') && (
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlInput} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            )}

            {/* ── File mode ── */}
            {uploadMode === 'file' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {uploadFiles.length > 0
                      ? `${uploadFiles.length} image${uploadFiles.length !== 1 ? 's' : ''} selected`
                      : 'Click to select images'}
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG, WebP · Multiple files supported</span>
                </button>
                {uploadFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadFiles.slice(0, 8).map((f, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {uploadFiles.length > 8 && (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                        +{uploadFiles.length - 8}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadMode === 'file' ? `Uploading… ${uploadProgress}%` : 'Saving…'}
                </div>
                {uploadMode === 'file' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            )}

            {uploadDone && (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Saved to gallery!
              </div>
            )}

            <div className="flex gap-3">
              {uploadMode === 'url' ? (
                <Button
                  onClick={handleUrlSave}
                  disabled={!urlInput.trim() || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {uploading ? 'Saving…' : 'Save to Gallery'}
                </Button>
              ) : (
                <Button
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading…' : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                </Button>
              )}
              {uploadMode === 'file' && uploadFiles.length > 0 && (
                <Button variant="outline" onClick={() => { setUploadFiles([]); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                  <X className="w-4 h-4 mr-2" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['all', 'event', 'property', 'general'] as const).map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-4 py-2 font-medium transition-colors ${filterCategory === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterFeatured}
              onChange={e => setFilterFeatured(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">Featured only</span>
          </label>
          <span className="text-sm text-gray-500 ml-auto">{filtered.length} image{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Grid ── */}
        {/* ── Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No images yet. Upload some above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((item, index) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-gray-100 flex flex-col"
              >
                <div className="relative" style={{ aspectRatio: '4/3' }}>
                  <Image
                    src={item.cloudinary_secure_url}
                    alt={item.title ?? ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    // Set priority for the top items to optimize LCP, lazy load the rest
                    priority={index < 4}
                    loading={index < 4 ? undefined : "lazy"}
                  />

                  {/* ... rest of item content ... */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Listing picker for upload ── */}
      {showListingPicker && (
        <ListingPickerModal
          onSelect={l => { setUploadListing(l); setShowListingPicker(false) }}
          onClose={() => setShowListingPicker(false)}
        />
      )}

      {/* ── Listing picker for assign ── */}
      {assigningItem && (
        <ListingPickerModal
          onSelect={l => handleAssign(assigningItem, l)}
          onClose={() => setAssigningItem(null)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Edit Image Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Image title..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none text-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveEdit(editingId!)} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
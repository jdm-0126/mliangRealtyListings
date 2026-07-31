'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { uploadManyToCloudinary } from '@/lib/cloudinary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { matchesLocationSearch } from "@/lib/shared/matchesLocationSearch"
import {
  Upload, Trash2, Star, StarOff, ImageIcon, X, CheckCircle2, Loader2, Link2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/browserTenantClient'
import { Property } from "@/lib/shared/types/public"
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

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  property: 'Property Photo',
  event: 'Event / News',
  general: 'General',
}

const CATEGORY_COLORS: Record<GalleryCategory, string> = {
  property: 'bg-blue-100 text-blue-800',
  event: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-700',
}

// ── Listing picker modal ──────────────────────────────────────────────────────

function ListingPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (listing: Property) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)

  // useEffect(() => {
  //   const run = async () => {
  //     setLoading(true)
  //     try {
  //       const { data, error } = await supabase
  //         .from("listings")
  //         .select("*")
  //         .order("id", { ascending: false }) // Changed property_id to id
  //         .limit(500)

  //       if (error) throw error

        // const filtered: Property[]= (data ?? [])
        //   .filter((d) => matchesLocationSearch(d, search))
        //   .map((d) => {
        //     const rawId = d.id ?? d.property_id
        //     const id =
        //       typeof rawId === "number"
        //         ? rawId
        //         : typeof rawId === "string" && rawId.trim() !== ""
        //         ? Number(rawId)
        //         : 0

        //     return {
        //       id: Number.isFinite(id) ? id : 0,
        //       location: String(d.Location ?? d.location ?? ""),
        //       title: String(d.Title ?? d.title ?? ""),
        //     }
        //   })

      //   setListings(filtered)
      // } catch (e) {
      //   console.error(e)
      // } finally {
      //   setLoading(false)
      // }
  //   }
  //   run()
  // }, [search])

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
            placeholder="Search by location..."
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
  const [uploadListing, setUploadListing] = useState<Property | null>(null)
  const [showListingPicker, setShowListingPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDone, setUploadDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assign-to-listing state
  const [assigningItem, setAssigningItem] = useState<GalleryItem | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false })

      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory)
      }

      if (filterFeatured) {
        query = query.eq("is_featured", true)
      }

      const { data, error } = await query

      if (error) throw error

      setItems((data ?? []).map((d: any) => ({
        id: String(d.id),
        title: d.title ?? null,
        description: d.description ?? null,
        category: d.category,
        cloudinary_public_id: d.cloudinary_public_id,
        cloudinary_secure_url: d.cloudinary_secure_url,
        width: d.width ?? null,
        height: d.height ?? null,
        is_featured: d.is_featured ?? false,
        display_order: d.display_order ?? 0,
        listing_id: d.listing_id ?? null,
        created_at: d.created_at,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterFeatured])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    setUploadFiles(files)
    setUploadDone(false)
  }

  const extractPublicId = (url: string): string => {
    const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+?)(?:\.[a-z]+)?$/i)
      ?? url.match(/\/upload\/(.+?)(?:\.[a-z]+)?$/i)
    return match ? match[1] : url
  }

  // ── Handle Single URL Save ──────────────────────────────────────────────────
  const handleUrlSave = async () => {
    const url = urlInput.trim()
    if (!url || !url.startsWith('http')) { alert('Enter a valid Cloudinary URL'); return }
    setUploading(true)
    try {
      const secureUrl = url.replace('http://', 'https://')
      const publicId = extractPublicId(url)
      
      const targetListingId = uploadCategory === 'property' && uploadListing ? uploadListing.id : null

      // 1. Insert into GALLERY
      const { error: galleryError } = await supabase
        .from("gallery")
        .insert({
          category: uploadCategory,
          cloudinary_public_id: publicId,
          cloudinary_secure_url: secureUrl,
          listing_id: targetListingId,
        });

      if (galleryError) throw galleryError;

      // 2. Update LISTINGS (preview_photo)
      if (uploadCategory === "property" && targetListingId) {
        const { error: listingError } = await supabase
          .from("listings")
          .update({ 
            preview_photo: secureUrl 
          })
          .eq("property_id", targetListingId); // ✅ Changed property_id -> id

        if (listingError) throw listingError;
      }

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

  // ── Handle Multiple File Upload ─────────────────────────────────────────────
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

      const targetListingId = uploadCategory === 'property' && uploadListing ? uploadListing.id : null

      // 1. Insert each photo into 'gallery'
      for (const r of results) {
        const { error } = await supabase
          .from("gallery")
          .insert({
            tenant_id: TENANT_ID,
            category: uploadCategory,
            title: uploadTitle || null,
            cloudinary_public_id: r.public_id,
            cloudinary_url: r.url,
            cloudinary_secure_url: r.secure_url,
            width: r.width,
            height: r.height,
            format: r.format,
            bytes: r.bytes,
            listing_id: targetListingId,
            is_featured: uploadCategory === 'event',
          })
        if (error) throw error
      }

      // 2. Update ONLY preview_photo on 'listings' using the first photo URL
      if (uploadCategory === "property" && targetListingId && results.length > 0) {
        const { error } = await supabase
          .from("listings")
          .update({ preview_photo: results[0].secure_url })
          .eq("id", targetListingId) // ✅ Changed property_id -> id

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

  const handleAssign = async (item: GalleryItem, listing: Property) => {
    try {
      const { error: galleryError } = await supabase
        .from("gallery")
        .update({ listing_id: listing.id })
        .eq("id", item.id)

      if (galleryError) throw galleryError

      const { error: listingError } = await supabase
        .from("listings")
        .update({ preview_photo: item.cloudinary_secure_url })
        .eq("property_id", listing.id) // ✅ Changed property_id -> id

      if (listingError) throw listingError

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, listing_id: listing.id } : i
        )
      )

      setAssigningItem(null)
      alert(`Photo assigned to Property #${listing.id} — ${listing.location}`)
    } catch (err: any) {
      alert('Assigning failed: ' + (err?.message ?? String(err)))
    }
  }

  const toggleFeatured = async (item: GalleryItem) => {
    const { error } = await supabase
      .from("gallery")
      .update({ is_featured: !item.is_featured })
      .eq("id", item.id)

    if (error) throw error

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_featured: !i.is_featured } : i
      )
    )
  }

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm(`Delete "${item.title ?? "this image"}"? This cannot be undone.`)) return

    const { error } = await supabase
      .from("gallery")
      .delete()
      .eq("id", item.id)

    if (error) throw error

    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("gallery")
      .update({
        title: editTitle || null,
        description: editDescription || null,
      })
      .eq("id", id)

    if (error) throw error

    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, title: editTitle || null, description: editDescription || null } : i
      )
    )

    setEditingId(null)
  }

  const filtered = items.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false
    if (filterFeatured && !i.is_featured) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-500 mt-1">
            Upload property photos to assign as listing preview images, or upload event/general images for the homepage.
          </p>
        </div>

        {/* Upload Panel */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Images</h2>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => { setUploadMode('file'); setUploadDone(false) }}
                  className={`px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${uploadMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  onClick={() => { setUploadMode('url'); setUploadDone(false) }}
                  className={`px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${uploadMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
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

        {/* Filter Bar */}
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

        {/* Grid */}
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
                key={item.id ? `${item.id}-${index}` : index}
                className="group relative rounded-xl overflow-hidden bg-gray-100"
              >
                <div className="relative" style={{ aspectRatio: '4/3' }}>
                  <Image
                    src={item.cloudinary_secure_url}
                    alt={item.title ?? ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2">
                    <div className="flex items-start justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category]}`}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      {item.is_featured && (
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">Featured</span>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.category !== 'property' && (
                        <button
                          onClick={() => toggleFeatured(item)}
                          title={item.is_featured ? 'Remove from featured' : 'Feature on homepage'}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-yellow-100 transition-colors"
                        >
                          {item.is_featured
                            ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            : <StarOff className="w-4 h-4 text-gray-600" />}
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingId(item.id); setEditTitle(item.title ?? ''); setEditDescription(item.description ?? '') }}
                        title="Edit title"
                        className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-blue-100 transition-colors text-xs font-bold text-gray-600"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        title="Delete"
                        className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {item.category === 'property' && (
                  <div className="bg-white border-t border-gray-100 px-2 py-1.5">
                    {item.listing_id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Property #{item.listing_id}
                        </span>
                        <button
                          onClick={() => setAssigningItem(item)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningItem(item)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-700 font-medium py-0.5 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Assign to listing
                      </button>
                    )}
                  </div>
                )}

                {item.title && item.category !== 'property' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{item.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showListingPicker && (
        <ListingPickerModal
          onSelect={l => { setUploadListing(l); setShowListingPicker(false) }}
          onClose={() => setShowListingPicker(false)}
        />
      )}

      {assigningItem && (
        <ListingPickerModal
          onSelect={l => handleAssign(assigningItem, l)}
          onClose={() => setAssigningItem(null)}
        />
      )}

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
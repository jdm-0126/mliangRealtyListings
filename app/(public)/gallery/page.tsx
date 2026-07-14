'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { Query } from 'appwrite'
import { SortKey, SORT_OPTIONS } from '../../../lib/shared/sorting'
const COL_GALLERY = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GALLERY!
import { X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  category: 'property' | 'event' | 'general'
  cloudinary_secure_url: string
  is_featured: boolean
  created_at: string
}

function sortItems(items: GalleryItem[], key: SortKey): GalleryItem[] {
  return [...items].sort((a, b) => {
    switch (key) {
      case 'title_asc':        return (a.title ?? '').localeCompare(b.title ?? '')
      case 'title_desc':       return (b.title ?? '').localeCompare(a.title ?? '')
      case 'description_asc':  return (a.description ?? '').localeCompare(b.description ?? '')
      case 'description_desc': return (b.description ?? '').localeCompare(a.description ?? '')
      default:                 return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ items, index, onClose }: { items: GalleryItem[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index)
  const item = items[current]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  setCurrent(p => (p - 1 + items.length) % items.length)
      if (e.key === 'ArrowRight') setCurrent(p => (p + 1) % items.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X className="w-7 h-7" />
      </button>
      {items.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(p => (p - 1 + items.length) % items.length) }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(p => (p + 1) % items.length) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      <div className="relative max-w-4xl max-h-[85vh] w-full mx-12" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.cloudinary_secure_url}
          alt={item.title ?? 'Gallery image'}
          className="w-full h-full object-contain max-h-[80vh] rounded-xl"
        />
        {(item.title || item.description) && (
          <div className="mt-3 text-center">
            {item.title && <p className="text-white font-semibold text-sm">{item.title}</p>}
            {item.description && <p className="text-white/60 text-xs mt-0.5">{item.description}</p>}
          </div>
        )}
        <p className="text-center text-white/40 text-xs mt-2">{current + 1} / {items.length}</p>
      </div>
    </div>
  )
}

// ── Gallery section ───────────────────────────────────────────────────────────

function GalleryGrid({ items, onOpen }: { items: GalleryItem[]; onOpen: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <button
          key={item.id}
          onClick={() => onOpen(idx)}
          className="relative rounded-xl overflow-hidden group text-left focus:outline-none"
          style={{ aspectRatio: '4/3', background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
        >
          <Image
            src={item.cloudinary_secure_url}
            alt={item.title ?? 'Gallery image'}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {(item.title || item.description) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.title && <p className="text-xs text-white font-semibold truncate">{item.title}</p>}
              {item.description && <p className="text-xs text-white/70 truncate mt-0.5">{item.description}</p>}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [allItems, setAllItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortKey>('newest')
  const [lightboxItems, setLightboxItems] = useState<GalleryItem[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COL_GALLERY, [
          Query.orderDesc('$createdAt'),
          // Query.limit(200),
        ])
        setAllItems(res.documents.map(d => ({
          id: d.$id,
          title: d['title'] as string | null,
          description: d['description'] as string | null,
          category: d['category'] as 'property' | 'event' | 'general',
          cloudinary_secure_url: d['cloudinary_secure_url'] as string,
          is_featured: d['is_featured'] as boolean,
          created_at: d['$createdAt'] as string,
        })))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  // General: all items; Events/Property: featured only
 const general = useMemo(
  () => sortItems(
    allItems.filter(i => i.category === "general"),
    sort
  ),
  [allItems, sort]
)

const events = useMemo(
  () => sortItems(
    allItems.filter(i => i.category === "event"),
    sort
  ),
  [allItems, sort]
)

const properties = useMemo(
  () => sortItems(
    allItems.filter(i => i.category === "property"),
    sort
  ),
  [allItems, sort]
)

  const openLightbox = (items: GalleryItem[], idx: number) => {
    setLightboxItems(items)
    setLightboxIndex(idx)
  }

  const isEmpty = !loading && general.length === 0 && events.length === 0 && properties.length === 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
            Photos
          </p>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--est-text)' }}>Gallery</h1>
          <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
            Events, property highlights, and more from M. Liang Realty.
          </p>
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--est-muted)' }} />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{
              background: 'var(--est-elevated)',
              border: '1px solid var(--est-border)',
              color: 'var(--est-text)',
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--est-purple)', borderTopColor: 'transparent' }} />
        </div>
      ) : isEmpty ? (
        <div className="py-20 text-center rounded-2xl" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
          <p className="text-sm" style={{ color: 'var(--est-muted)' }}>No gallery images yet.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {general.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--est-text)' }}>General</h2>
                <span className="text-xs" style={{ color: 'var(--est-muted)' }}>{general.length} photo{general.length !== 1 ? 's' : ''}</span>
              </div>
              <GalleryGrid items={general} onOpen={idx => openLightbox(general, idx)} />
            </section>
          )}
          {events.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--est-text)' }}>Events &amp; News</h2>
                <span className="text-xs" style={{ color: 'var(--est-muted)' }}>{events.length} photo{events.length !== 1 ? 's' : ''}</span>
              </div>
              <GalleryGrid items={events} onOpen={idx => openLightbox(events, idx)} />
            </section>
          )}
          {properties.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--est-text)' }}>Property Highlights</h2>
                <span className="text-xs" style={{ color: 'var(--est-muted)' }}>{properties.length} photo{properties.length !== 1 ? 's' : ''}</span>
              </div>
              <GalleryGrid items={properties} onOpen={idx => openLightbox(properties, idx)} />
            </section>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxItems && (
        <Lightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxItems(null)}
        />
      )}
    </main>
  )
}

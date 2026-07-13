'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { Query } from 'appwrite'
import { Button } from './ui/button'
const MAX_FEATURED = 9
const COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

interface FeaturedToggleProps {
  propertyId: number
  isFeatured: boolean | null | undefined
  canToggle: boolean
  onToggle?: (newValue: boolean) => void
}

export default function FeaturedToggle({ propertyId, isFeatured, canToggle, onToggle }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState<boolean>(!!isFeatured)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setFeatured(!!isFeatured) }, [isFeatured])

  if (!canToggle) {
    return featured ? (
      <Button onClick={handleToggle} variant="outline" size="sm"
        title="Featured on homepage"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-yellow-600 bg-yellow-50 border border-yellow-200"
      >
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        Featured
      </Button>
    ) : (
    <Button
      onClick={handleToggle} size="sm"
      title="Replace current featured listing"
      variant="outline"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
    >
      <Star className="w-3.5 h-3.5" />
      Featured
    </Button>
  );
  }

  async function handleToggle() {
    if (saving) return
    const newValue = !featured

    if (newValue) {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COL, [
          Query.equal('featured', true),
          Query.limit(1),
          Query.offset(MAX_FEATURED - 1),
        ])
        // If we can still get a doc at position MAX_FEATURED-1, count >= MAX_FEATURED
        const countRes = await databases.listDocuments(DATABASE_ID, COL, [
          Query.equal('featured', true),
          Query.limit(100),
        ])
        if (countRes.total >= MAX_FEATURED) {
          alert(`Maximum of ${MAX_FEATURED} featured listings allowed.\nPlease remove one before adding another.`)
          return
        }
      } catch (e) {
        alert('Could not verify featured count. Please try again.')
        return
      }
    }

    setSaving(true)
    try {
      // Find the document $id by property_id
      const res = await databases.listDocuments(DATABASE_ID, COL, [
        Query.equal('property_id', propertyId),
        Query.limit(1),
      ])
      if (!res.documents.length) { alert('Property not found.'); return }
      await databases.updateDocument(DATABASE_ID, COL, res.documents[0].$id, { featured: newValue })
      setFeatured(newValue)
      onToggle?.(newValue)
    } catch (err: any) {
      alert('Failed to save: ' + (err?.message ?? String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      title={featured ? 'Remove from homepage featured' : 'Feature on homepage'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-wait ${
        featured
          ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100'
          : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-yellow-600 hover:border-yellow-300'
      }`}
    >
      <Star
        className={`w-3.5 h-3.5 transition-colors ${
          featured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
        } ${saving ? 'animate-pulse' : ''}`}
      />
      {saving ? 'Saving…' : featured ? 'Featured ✓' : 'Feature'}
    </button>
  )
}

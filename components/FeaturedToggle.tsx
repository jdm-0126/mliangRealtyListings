'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from './ui/button'
import { supabase } from '@/lib/supabase/client'
import { TABLES } from '@/lib/constants'

import { FeaturedToggleProps } from '@/lib/shared/types/public'
const MAX_FEATURED = 9

export default function FeaturedToggle({ propertyId, isFeatured, canToggle, onToggle }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(!!isFeatured)
  const [saving, setSaving] = useState(false)

  useEffect(() => {  
    setFeatured(!!isFeatured)
  }, [isFeatured])

  if (!canToggle) {
    return featured ? (
      <Button
        onClick={handleToggle}
        variant="outline"
        size="sm"
        disabled={saving}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-yellow-600 bg-yellow-50 border-yellow-200"
      >
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        Featured
      </Button>
    ) : (
      <Button
        onClick={handleToggle}
        variant="outline"
        size="sm"
        disabled={saving}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
      >
        <Star className="w-3.5 h-3.5" />
        Feature
      </Button>
    )
  }

  async function handleToggle() {
    if (saving) return

    const newValue = !featured

    setSaving(true)

    try {
      // Enforce maximum featured listings
      if (newValue) {
        const { count, error: countError } = await supabase
          .from(TABLES.listings)
          .select('*', { count: 'exact', head: true })
          .eq('featured', true)

        if (countError) throw countError

        if ((count ?? 0) >= MAX_FEATURED) {
          alert(`Only ${MAX_FEATURED} listings can be featured.`)
          return
        }
      }

      const { error } = await supabase
        .from(TABLES.listings)
        .update({ featured: newValue })
        .eq('property_id', propertyId)

      if (error) throw error

      setFeatured(newValue)
      onToggle?.(newValue)
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Failed to update featured status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      title={featured ? 'Remove from homepage' : 'Feature on homepage'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-50 ${
        featured
          ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100'
          : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-yellow-600'
      }`}
    >
      <Star
        className={`w-3.5 h-3.5 ${
          featured
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-400'
        } ${saving ? 'animate-pulse' : ''}`}
      />
      {saving ? 'Saving...' : featured ? 'Featured ✓' : 'Feature'}
    </button>
  )
}
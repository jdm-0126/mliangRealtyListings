'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/app/lib/supabaseClient'

const MAX_FEATURED = 6

interface FeaturedToggleProps {
  propertyId: number
  /** Value from DB row — may be undefined if column doesn't exist yet */
  isFeatured: boolean | null | undefined
  canToggle: boolean
  onToggle?: (newValue: boolean) => void
}

export default function FeaturedToggle({ propertyId, isFeatured, canToggle, onToggle }: FeaturedToggleProps) {
  // Normalise: treat null/undefined as false
  const [featured, setFeatured] = useState<boolean>(!!isFeatured)
  const [saving, setSaving] = useState(false)

  // Keep in sync if parent re-renders with updated DB value
  useEffect(() => {
    setFeatured(!!isFeatured)
  }, [isFeatured])

  if (!canToggle) {
    return featured ? (
      <span
        title="Featured on homepage"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-yellow-600 bg-yellow-50 border border-yellow-200"
      >
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        Featured
      </span>
    ) : null
  }

  async function handleToggle() {
    if (!supabase || saving) return

    const newValue = !featured

    // Enforce max 6 when turning ON
    if (newValue) {
      const { count, error: countError } = await supabase
        .from('mlianglistings')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)

      if (countError) {
        alert('Could not verify featured count. Please try again.')
        return
      }
      if ((count ?? 0) >= MAX_FEATURED) {
        alert(`Maximum of ${MAX_FEATURED} featured listings allowed.\nPlease remove one before adding another.`)
        return
      }
    }

    setSaving(true)

    const { error } = await supabase
      .from('mlianglistings')
      .update({ featured: newValue })
      .eq('Property ID', propertyId)

    if (error) {
      console.error('[FeaturedToggle] Supabase update error:', error)
      alert('Failed to save: ' + error.message + '\n\nCode: ' + error.code)
      setSaving(false)
      return
    }

    console.log('[FeaturedToggle] Saved featured=%s for Property ID=%s', newValue, propertyId)

    // Optimistically update local state
    setFeatured(newValue)
    onToggle?.(newValue)
    setSaving(false)
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

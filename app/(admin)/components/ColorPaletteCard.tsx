'use client'
// ColorPaletteCard — lets the admin pick a public website accent color.
// Saves to localStorage('siteAccentColor') and applies it live via CSS custom property.

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Check } from 'lucide-react'

const STORAGE_KEY = 'siteAccentColor'
const DEFAULT_COLOR = '#703BF7'

// Curated preset palette
const PRESETS: { name: string; value: string }[] = [
  { name: 'Estatein Purple', value: '#703BF7' },
  { name: 'Royal Blue',      value: '#2563EB' },
  { name: 'Sky Blue',        value: '#0EA5E9' },
  { name: 'Teal',            value: '#0D9488' },
  { name: 'Emerald',         value: '#10B981' },
  { name: 'Amber',           value: '#F59E0B' },
  { name: 'Orange',          value: '#F97316' },
  { name: 'Rose',            value: '#F43F5E' },
  { name: 'Crimson',         value: '#DC2626' },
  { name: 'Pink',            value: '#EC4899' },
  { name: 'Violet',          value: '#7C3AED' },
  { name: 'Indigo',          value: '#4F46E5' },
]

/** Apply color live — sets the CSS custom property on <html> */
function applyColor(hex: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--est-purple', hex)
  }
}

/** Persist and apply */
function saveColor(hex: string) {
  applyColor(hex)
  try { localStorage.setItem(STORAGE_KEY, hex) } catch {}
}

export default function ColorPaletteCard() {
  const [active, setActive] = useState(DEFAULT_COLOR)
  const [custom, setCustom] = useState(DEFAULT_COLOR)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Sync from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && /^#[0-9a-fA-F]{6}$/.test(stored)) {
        setActive(stored)
        setCustom(stored)
      }
    } catch {}
  }, [])

  function handlePreset(hex: string) {
    setActive(hex)
    setCustom(hex)
    saveColor(hex)
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value
    setCustom(hex)
    setActive(hex)
    saveColor(hex)
  }

  function handleReset() {
    setActive(DEFAULT_COLOR)
    setCustom(DEFAULT_COLOR)
    saveColor(DEFAULT_COLOR)
  }

  const isCustom = !PRESETS.some(p => p.value.toLowerCase() === active.toLowerCase())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Public Website Color Palette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div>
          <p className="text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>Accent Color</p>
          <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Controls the primary accent color across the entire public website — buttons, badges, links, borders, and icons.
            Changes are applied live and persist across sessions.
          </p>

          {/* Preset swatches */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PRESETS.map(({ name, value }) => {
              const isSelected = active.toLowerCase() === value.toLowerCase()
              return (
                <button
                  key={value}
                  title={name}
                  aria-label={`${name} (${value})`}
                  aria-pressed={isSelected}
                  onClick={() => handlePreset(value)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus-visible:ring-2"
                  style={{
                    background: value,
                    boxShadow: isSelected ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${value}` : 'none',
                  }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              )
            })}
          </div>

          {/* Custom color picker row */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => colorInputRef.current?.click()}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 border-2 border-dashed"
                style={{
                  background: isCustom ? custom : 'transparent',
                  borderColor: isCustom ? custom : 'hsl(var(--border))',
                  boxShadow: isCustom ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${custom}` : 'none',
                }}
                title="Custom color"
                aria-label="Pick a custom color"
              >
                {isCustom
                  ? <Check className="w-4 h-4 text-white drop-shadow" />
                  : <span className="text-lg leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>+</span>
                }
              </button>
              {/* Hidden native color input */}
              <input
                ref={colorInputRef}
                type="color"
                value={custom}
                onChange={handleCustomChange}
                className="sr-only"
                aria-label="Custom accent color"
                tabIndex={-1}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {isCustom ? 'Custom' : PRESETS.find(p => p.value.toLowerCase() === active.toLowerCase())?.name ?? 'Custom'}
              </span>
              <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {active.toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleReset}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
              style={{
                color: 'hsl(var(--muted-foreground))',
                borderColor: 'hsl(var(--border))',
                background: 'transparent',
              }}
            >
              Reset to default
            </button>
          </div>
        </div>

        {/* Live preview strip */}
        <div
          className="rounded-xl p-4 flex flex-wrap gap-3 items-center"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Preview
          </span>

          {/* Filled button */}
          <span
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: active }}
          >
            Browse Listings
          </span>

          {/* Outlined button */}
          <span
            className="px-4 py-1.5 rounded-lg text-sm font-semibold border"
            style={{ color: active, borderColor: active, background: 'transparent' }}
          >
            Contact Us
          </span>

          {/* Badge */}
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
            style={{ background: active }}
          >
            House & Lot
          </span>

          {/* Icon */}
          <svg
            className="w-5 h-5"
            style={{ color: active }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>

          {/* Text link */}
          <span className="text-sm font-medium underline underline-offset-2" style={{ color: active }}>
            View all listings →
          </span>
        </div>

      </CardContent>
    </Card>
  )
}

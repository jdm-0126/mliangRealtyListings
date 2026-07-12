'use client'

import React, { useState, useCallback } from 'react'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { Query } from 'appwrite'
import {
  X, AlertTriangle, Copy, Image as ImageIcon, Layers,
  ChevronDown, ChevronUp, Pencil, Trash2,
} from 'lucide-react'
import { Button } from './ui/button'

const COL_LISTINGS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

interface DuplicateGroup {
  reason: 'image' | 'price+lot' | 'price+lot+floor'
  label: string
  properties: any[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: any) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  if (!n) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)
}

function norm(v: any): string { return String(v ?? '').trim().toLowerCase() }

function numVal(v: any): number | null {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function detectDuplicates(rows: any[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []

  const byImage = new Map<string, any[]>()
  for (const r of rows) {
    const img = norm(r['Preview_Photo'])
    if (!img || img.length < 10) continue
    if (!byImage.has(img)) byImage.set(img, [])
    byImage.get(img)!.push(r)
  }
  for (const [img, props] of byImage) {
    if (props.length < 2) continue
    groups.push({ reason: 'image', label: `Same preview photo (${img.slice(0, 60)}${img.length > 60 ? '…' : ''})`, properties: props })
  }

  const byPriceLot = new Map<string, any[]>()
  for (const r of rows) {
    const price = numVal(r['Listing_Price']); const lot = numVal(r['Lot_Area_sqm'])
    if (!price || !lot) continue
    const key = `${price}|${lot}`
    if (!byPriceLot.has(key)) byPriceLot.set(key, [])
    byPriceLot.get(key)!.push(r)
  }
  for (const [key, props] of byPriceLot) {
    if (props.length < 2) continue
    const [price, lot] = key.split('|')
    groups.push({ reason: 'price+lot', label: `Same price (${formatPrice(price)}) + lot area (${lot} sqm)`, properties: props })
  }

  const byAll = new Map<string, any[]>()
  for (const r of rows) {
    const price = numVal(r['Listing_Price']); const lot = numVal(r['Lot_Area_sqm']); const floor = numVal(r['Floor_Area_sqm'])
    if (!price || !lot || !floor) continue
    const key = `${price}|${lot}|${floor}`
    if (!byAll.has(key)) byAll.set(key, [])
    byAll.get(key)!.push(r)
  }
  for (const [key, props] of byAll) {
    if (props.length < 2) continue
    const [price, lot, floor] = key.split('|')
    const alreadyCovered = groups.some(
      g => g.reason === 'price+lot' && g.properties.length === props.length && g.properties.every(p => props.includes(p))
    )
    if (alreadyCovered) continue
    groups.push({ reason: 'price+lot+floor', label: `Same price (${formatPrice(price)}) + lot (${lot} sqm) + floor (${floor} sqm)`, properties: props })
  }

  return groups
}

const REASON_ICON: Record<DuplicateGroup['reason'], React.ReactNode> = {
  'image': <ImageIcon className="w-4 h-4 text-orange-500" />,
  'price+lot': <Copy className="w-4 h-4 text-red-500" />,
  'price+lot+floor': <Layers className="w-4 h-4 text-red-700" />,
}

const REASON_COLOR: Record<DuplicateGroup['reason'], string> = {
  'image': 'border-orange-200 bg-orange-50',
  'price+lot': 'border-red-200 bg-red-50',
  'price+lot+floor': 'border-red-300 bg-red-100',
}

// ─── GroupRow ─────────────────────────────────────────────────────────────────

interface GroupRowProps {
  group: DuplicateGroup
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], select: boolean) => void
  onEdit: (p: any) => void
  onDeleteOne: (p: any) => void
}

function GroupRow({ group, selected, onToggle, onToggleAll, onEdit, onDeleteOne }: GroupRowProps) {
  const [open, setOpen] = useState(true)
  const ids = group.properties.map(p => p['$id'] as string)
  const allSelected = ids.every(id => selected.has(id))
  const someSelected = ids.some(id => selected.has(id))

  return (
    <div className={`rounded-xl border ${REASON_COLOR[group.reason]} mb-3 overflow-hidden`}>
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Select-all checkbox */}
        <input
          type="checkbox"
          checked={allSelected}
          ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
          onChange={e => onToggleAll(ids, e.target.checked)}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded accent-red-500 cursor-pointer flex-shrink-0"
          title={allSelected ? 'Deselect all in group' : 'Select all in group'}
        />
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setOpen(v => !v)}
        >
          {REASON_ICON[group.reason]}
          <span className="flex-1 text-sm font-medium text-gray-800">{group.label}</span>
          <span className="text-xs text-gray-500 mr-2">{group.properties.length} entries</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-inherit divide-y divide-inherit">
          {group.properties.map((p) => {
            const rawId = Number(p['property_id'])
            const displayId = rawId > 2 ? rawId - 1 : rawId
            const location = [p['Village'], p['Location']].filter(Boolean).join(', ') || '—'
            const lot = numVal(p['Lot_Area_sqm'])
            const floor = numVal(p['Floor_Area_sqm'])
            const img = p['Preview_Photo']
            const isSelected = selected.has(p['$id'])

            return (
              <div
                key={p['$id']}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isSelected ? 'bg-red-50/60' : ''}`}
              >
                {/* Row checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(p['$id'])}
                  className="w-4 h-4 rounded accent-red-500 cursor-pointer flex-shrink-0"
                />

                {/* Thumbnail */}
                {img ? (
                  <img src={img} alt="" className="w-12 h-10 object-cover rounded flex-shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-12 h-10 rounded flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">#{displayId} · {p['Type'] || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{location}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(p['Listing_Price'])}
                    {lot ? ` · ${lot} sqm lot` : ''}
                    {floor ? ` · ${floor} sqm floor` : ''}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    (p['Status'] || '').toLowerCase() === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p['Status'] || 'Draft'}
                  </span>
                  <button
                    onClick={() => onEdit(p)}
                    title="Edit property"
                    className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteOne(p)}
                    title="Delete property"
                    className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  onEdit: (property: any) => void
  onDelete: (property: any) => void
}

export default function DuplicateDetector({ onClose, onEdit, onDelete }: Props) {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [totalScanned, setTotalScanned] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleOne = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleGroup = (ids: string[], select: boolean) =>
    setSelected(prev => {
      const s = new Set(prev)
      ids.forEach(id => select ? s.add(id) : s.delete(id))
      return s
    })

  const clearSelection = () => setSelected(new Set())

  // ── Remove deleted ids from groups state ──────────────────────────────────
  const removeFromGroups = (ids: Set<string>) =>
    setGroups(prev =>
      prev
        .map(g => ({ ...g, properties: g.properties.filter(x => !ids.has(x['$id'])) }))
        .filter(g => g.properties.length >= 2)
    )

  // ── Single delete ─────────────────────────────────────────────────────────
  const handleDeleteOne = async (p: any) => {
    const rawId = Number(p['property_id'])
    const displayId = rawId > 2 ? rawId - 1 : rawId
    if (!confirm(`Delete Property #${displayId}? This cannot be undone.`)) return
    try {
      await databases.deleteDocument(DATABASE_ID, COL_LISTINGS, p['$id'])
      removeFromGroups(new Set([p['$id']]))
      setSelected(prev => { const s = new Set(prev); s.delete(p['$id']); return s })
      onDelete(p)
    } catch (e: any) {
      alert('Error deleting: ' + e.message)
    }
  }

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} selected propert${selected.size > 1 ? 'ies' : 'y'}? This cannot be undone.`)) return
    setBulkDeleting(true)
    const failed: string[] = []
    for (const id of selected) {
      try {
        await databases.deleteDocument(DATABASE_ID, COL_LISTINGS, id)
      } catch {
        failed.push(id)
      }
    }
    const deleted = new Set([...selected].filter(id => !failed.includes(id)))
    removeFromGroups(deleted)
    setSelected(new Set(failed)) // keep only failed ones selected
    if (failed.length) alert(`${failed.length} item(s) could not be deleted.`)
    onDelete(null) // signal parent to refresh
    setBulkDeleting(false)
  }

  // ── Scan ──────────────────────────────────────────────────────────────────
  const runScan = useCallback(async () => {
    setScanning(true)
    setScanned(false)
    setGroups([])
    setSelected(new Set())
    try {
      const all: any[] = []
      let offset = 0
      while (true) {
        const res = await databases.listDocuments(DATABASE_ID, COL_LISTINGS, [
          Query.limit(100), Query.offset(offset), Query.orderDesc('property_id'),
        ])
        all.push(...(res.documents as unknown as any[]))
        if (all.length >= res.total) break
        offset += 100
      }
      setTotalScanned(all.length)
      setGroups(detectDuplicates(all))
    } catch (e: any) {
      alert('Scan error: ' + e.message)
    }
    setScanning(false)
    setScanned(true)
  }, [])

  const totalDupes = groups.reduce((s, g) => s + g.properties.length, 0)

  // All selectable ids across all groups
  const allIds = groups.flatMap(g => g.properties.map(p => p['$id'] as string))
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = allIds.some(id => selected.has(id))

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Duplicate Detector</h2>
            <p className="text-xs text-gray-500">Detects entries with same image, lot area, or price</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!scanned && !scanning && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="text-gray-600 text-sm max-w-xs">
                Scan all listings to find entries that share the same preview photo, lot area + price, or lot + floor area + price.
              </p>
              <Button onClick={runScan} className="bg-amber-500 hover:bg-amber-600 text-white">
                Start Scan
              </Button>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Scanning all listings…</p>
            </div>
          )}

          {scanned && (
            <>
              {/* Summary banner */}
              <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
                groups.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                {groups.length === 0 ? (
                  <>
                    <span className="text-green-600 text-xl">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-green-700">No duplicates found</p>
                      <p className="text-xs text-green-600">Scanned {totalScanned} listings — all clear.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {groups.length} duplicate group{groups.length > 1 ? 's' : ''} found
                      </p>
                      <p className="text-xs text-amber-700">{totalDupes} entries affected · {totalScanned} total scanned</p>
                    </div>
                  </>
                )}
                <Button variant="outline" size="sm" className="ml-auto text-xs" onClick={runScan}>
                  Re-scan
                </Button>
              </div>

              {/* Select-all bar */}
              {groups.length > 0 && (
                <div className="flex items-center gap-3 mb-3 px-1">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={e => e.target.checked ? setSelected(new Set(allIds)) : clearSelection()}
                    className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                    title="Select / deselect all"
                  />
                  <span className="text-xs text-gray-500">
                    {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                  </span>
                  {selected.size > 0 && (
                    <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
                      Clear
                    </button>
                  )}

                  {/* Legend pushed right */}
                  <div className="flex flex-wrap gap-3 ml-auto text-xs text-gray-400">
                    <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-orange-500" /> Image</span>
                    <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5 text-red-500" /> Price+lot</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-red-700" /> +floor</span>
                  </div>
                </div>
              )}

              {/* Groups */}
              {groups.map((g, i) => (
                <GroupRow
                  key={i}
                  group={g}
                  selected={selected}
                  onToggle={toggleOne}
                  onToggleAll={toggleGroup}
                  onEdit={(p) => { onClose(); onEdit(p) }}
                  onDeleteOne={handleDeleteOne}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer — bulk action bar when items selected, else just Close */}
        <div className="px-6 py-4 border-t flex items-center gap-3">
          {selected.size > 0 ? (
            <>
              <span className="text-sm text-gray-600 flex-1">
                <span className="font-semibold text-red-600">{selected.size}</span> item{selected.size > 1 ? 's' : ''} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={bulkDeleting}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}</>
                }
              </Button>
            </>
          ) : (
            <Button variant="outline" className="ml-auto" onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    </div>
  )
}

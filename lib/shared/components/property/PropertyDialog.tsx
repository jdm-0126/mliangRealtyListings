'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import PropertyPhotos from './PropertyPhotos'
import PropertyForm from './PropertyForm'
import PropertyActions from './PropertyActions'
import PropertyExcelImport from './PropertyExcelImport'

import { Property } from '@/lib/shared/types/public'

interface PropertyDialogProps {
  open: boolean
  property?: Property | null
  columns: string[]
  loading?: boolean
  showExcelImport?: boolean
  onClose: () => void
  onSave: (property: Property) => Promise<void> | void
}

export default function PropertyDialog({
  open,
  property,
  columns,
  loading = false,
  showExcelImport = true,
  onClose,
  onSave,
}: PropertyDialogProps) {
  const [formData, setFormData] = useState<Property>({} as Property)

  // Reset or populate state whenever the dialog opens or property changes
  useEffect(() => {
    if (open) {
      if (property) {
        setFormData(property)
      } else {
        setFormData({ type: 'residential' } as Property)
      }
    }
  }, [open, property])

  // Handle escape key press to close dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    },
    [open, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open) return null

  const propertyType = String(formData.type || '').toLowerCase()
  const isLotOnly = propertyType === 'lot' || propertyType === 'lot only'

  async function handleSave() {
    try {
      let payload = { ...formData }

      // Nullify house-specific attributes if property is Lot Only
      if (isLotOnly) {
        payload = {
          ...payload,
          bedrooms: null,
          bathrooms: null,
          floor_area_sqm: null,
          floor_area: null,
          Floor_Area: null,
          Bedrooms: null,
          Bathrooms: null,
        } as Property
      }

      await onSave(payload)
      onClose()
    } catch (error) {
      console.error('Failed to save property:', error)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 leading-none">
                {property ? 'Edit Property Details' : 'Add New Property'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {property ? 'Update property specifications and media.' : 'Enter details or import spreadsheet data.'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          {/* Photos Section */}
          <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Property Media</h3>
            <PropertyPhotos
              property={formData}
              onChange={setFormData}
            />
          </section>

          {/* Import Section */}
          {showExcelImport && !property && (
            <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Quick Import</h3>
              <PropertyExcelImport
                columns={columns}
                onImport={(parsed) =>
                  setFormData(prev => ({
                    ...prev,
                    ...parsed,
                  }))
                }
              />
            </section>
          )}

          {/* Main Form Fields */}
          <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Property Information</h3>
            <PropertyForm
              columns={columns}
              value={formData}
              isLotOnly={isLotOnly}
              onChange={setFormData}
            />
          </section>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-white">
          <PropertyActions
            loading={loading}
            isEdit={!!property}
            onCancel={onClose}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
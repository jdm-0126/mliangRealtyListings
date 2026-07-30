'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  useEffect(() => {

    if (!property) return

    setFormData(property)
  }, [property])

  if (!open) return null
  
 async function handleSave() {
    await onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">

        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">

          <h2 className="text-xl font-semibold">

            {property ? 'Edit Property' : 'New Property'}

          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          <PropertyPhotos
            property={formData}
            onChange={setFormData}
          />

          {showExcelImport && !property && (
            <PropertyExcelImport
              columns={columns}
              onImport={(parsed) =>
                setFormData(prev => ({
                  ...prev,
                  ...parsed,
                }))
              }
            />
          )}

          <PropertyForm
            columns={columns}
            value={formData}
            onChange={setFormData}
          />

        </div>

        {/* Footer */}

        <PropertyActions
          loading={loading}
          isEdit={!!property}
          onCancel={onClose}
          onSave={handleSave}
        />

      </div>

    </div>
  )
}
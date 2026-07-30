// lib/shared/components/property/PropertyActions.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Save, X } from 'lucide-react'

interface PropertyActionsProps {
  isEdit: Boolean
  loading?: boolean
  onSave: () => void 
  onCancel: () => void
}

export default function PropertyActions({
  loading,
  isEdit = false,
  onCancel,
  onSave,
}: PropertyActionsProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-white px-6 py-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        <X className="mr-2 h-4 w-4" />
        Cancel
      </Button>

      <Button
        type="button"
        onClick={onSave}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Update Property' : 'Create Property'}
          </>
        )}
      </Button>
    </div>
  )
}
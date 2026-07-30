'use client'

import { Property } from '@/lib/shared/types/public'
import { useMemo } from 'react'
import PropertyField from './PropertyField'
import { PROPERTY_FIELDS, HIDDEN_FIELDS } from './propertyConfig'

interface PropertyFormProps {

    value: Property

    onChange: (property: Property) => void

    columns: string[]
}

export default function PropertyForm({
  value,
  onChange,
  columns
}: PropertyFormProps) {
    const fields = columns.map(column => {

      return (
          PROPERTY_FIELDS[column] ?? {
              key: column,
              label: column,
              type: 'text',
          }
      )
  })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {fields.map(field => (

        <PropertyField
          key={field.key}
          config={field}
          value={value[field.key as keyof Property]}
          property={value}
          onChange={(newValue) =>
            onChange({
              ...value,
              [field.key]: newValue,
            })
          }
        />

      ))}

    </div>
  )
}
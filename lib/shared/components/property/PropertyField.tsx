// lib/shared/components/property/PropertyField.tsx

'use client'

import { PropertyFieldConfig } from './propertyConfig'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Eye, EyeOff } from 'lucide-react'
import { Property } from "@/lib/shared/types/public"

export interface PropertyFieldProps {
    config: PropertyFieldConfig

    value: any

    property: Property

    onChange: (value: any) => void
}

const HIDE_FIELDS = [
  '$id',
  '$createdAt',
  '$updatedAt',
  '$databaseId',
  '$collectionId',
  '$permissions',
]

export default function PropertyField({
  config,
  value,
  property,
  onChange,
}: PropertyFieldProps) {

  const key = config.key
  const label = config.label

  const update = (newValue: any) => {
    onChange(newValue)
  }

  const [showListingAgent, setShowListingAgent] =
    React.useState(false)

  //----------------------------------------------------
  // Listing Agent Toggle
  //----------------------------------------------------

  if (config.key  === 'Listing Agent') {
    return (
      <div>
        <label className="flex items-center justify-between mb-2 font-medium">
          Listing Agent

          <button
            type="button"
            onClick={() =>
              setShowListingAgent?.(!showListingAgent)
            }
            className="text-xs flex items-center gap-1 text-blue-600"
          >
            {showListingAgent ? (
              <>
                <EyeOff className="w-3 h-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Show
              </>
            )}
          </button>
        </label>

        {!showListingAgent ? (
          <div className="rounded border border-dashed p-3 text-sm text-gray-400">
            Hidden
          </div>
        ) : (
          <Input
            value={value ?? ''}
            onChange={(e) => update(e.target.value)}
          />
        )}
      </div>
    )
  }

  //----------------------------------------------------
  // Property ID
  //----------------------------------------------------

  if (config.key  === 'property_id') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Property ID
        </label>

        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => update(e.target.value)}
          placeholder={
            property
              ? ''
              : 'Leave blank for auto generated'
          }
        />
      </div>
    )
  }

  //----------------------------------------------------
  // STATUS
  //----------------------------------------------------

  if (config.key === 'Status') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Status
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Draft'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Draft</option>
          <option>Active</option>
          <option>Sold</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // TYPE
  //----------------------------------------------------

  if (config.key  === 'Type') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Type
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Residential'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Residential</option>
          <option>House and Lot</option>
          <option>Lot</option>
          <option>Commercial</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // LISTING MODE
  //----------------------------------------------------

  if (config.key  === 'Listing Mode') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Listing Mode
        </label>

        <div className="grid grid-cols-2 gap-2">
          {['For Sale', 'For Rent'].map((mode) => (
            <Button
              key={mode}
              type="button"
              variant={
                value === mode ? 'default' : 'outline'
              }
              onClick={() => update(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  //----------------------------------------------------
  // YES / NO
  //----------------------------------------------------

  if (config.key  === 'Negotiable') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Negotiable
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Yes'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // CGT
  //----------------------------------------------------

  if (config.key  === 'CGT') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          CGT
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Seller'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Seller</option>
          <option>Buyer</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // Transfer Title
  //----------------------------------------------------

  if (config.key  === 'Transfer Title') {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Transfer Title
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Buyer'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Buyer</option>
          <option>Seller</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // Financing
  //----------------------------------------------------

  if (
    config.key  === 'Financing options' ||
    config.key  === 'Financing_options' ||
    config.key  === 'MOP'
  ) {
    return (
      <div>
        <label className="block mb-2 font-medium">
          Financing
        </label>

        <select
          className="w-full border rounded-md p-2"
          value={value ?? 'Bank Financing'}
          onChange={(e) => update(e.target.value)}
        >
          <option>Cash</option>
          <option>Bank Financing</option>
          <option>Pagibig</option>
          <option>Inhouse</option>
          <option>Others</option>
        </select>
      </div>
    )
  }

  //----------------------------------------------------
  // Numeric Stepper
  //----------------------------------------------------

  if (
  [
    'lotArea',
    'floorArea',
    'bedrooms',
    'bathrooms',
  ].includes(config.key)
) {
    const number = Number(value ?? 0)

    return (
      <div>
        <label className="block mb-2 font-medium">
          {label}
        </label>

        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              update(Math.max(0, number - 1))
            }
          >
            <Minus className="w-4 h-4" />
          </Button>

          <Input
            type="number"
            className="text-center"
            value={number}
            onChange={(e) =>
              update(Number(e.target.value))
            }
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => update(number + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  //----------------------------------------------------
  // Textarea
  //----------------------------------------------------

  if (
    [
      'description',
      'notes',
      'directions',
      'remarks',
    ].includes(label)
  ) {
    return (
      <div className="md:col-span-2">
        <label className="block mb-2 font-medium">
          {label}
        </label>

        <textarea
          rows={5}
          className="w-full rounded-md border p-3"
          value={value ?? ''}
          onChange={(e) => update(e.target.value)}
        />
      </div>
    )
  }

  //----------------------------------------------------
  // Price
  //----------------------------------------------------

  if (label.toLowerCase().includes('price')) {
    return (
      <div>
        <label className="block mb-2 font-medium">
          {label}
        </label>

        <div className="relative">
          <span className="absolute left-3 top-2.5">
            ₱
          </span>

          <Input
            className="pl-8"
            value={value ?? ''}
            onChange={(e) => update(e.target.value)}
          />
        </div>
      </div>
    )
  }

  //----------------------------------------------------
  // Default Input
  //----------------------------------------------------

  return (
    <div>
      <label className="block mb-2 font-medium">
        {label}
      </label>

      <Input
        value={value ?? ''}
        onChange={(e) => update(e.target.value)}
      />
    </div>
  )
}
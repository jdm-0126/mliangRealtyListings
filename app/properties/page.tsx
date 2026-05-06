'use client'

import React, { Suspense } from 'react'
import PropertiesContent from './PropertiesContent'

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}

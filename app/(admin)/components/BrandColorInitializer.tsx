'use client'

import { useEffect } from 'react'
import { hydrateBrandColor } from '@/lib/theme/brandColor'

export default function BrandColorInitializer() {
  useEffect(() => {
    void hydrateBrandColor()
  }, [])

  return null
}

'use client'

import React from 'react'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  MapPin, 
  Home, 
  Maximize, 
  DollarSign, 
  Edit, 
  Share2, 
  Copy, 
  ExternalLink,
  Camera,
  Video
} from 'lucide-react'

interface PropertyCardProps {
  property: any;
  viewMode: 'grid' | 'list';
  onEdit?: (property: any) => void;
  onShare?: (property: any) => void;
  onCopy?: (property: any) => void;
  onFacebookPost?: (property: any) => void;
}

export default function PropertyCard({ 
  property, 
  onEdit, 
  onShare, 
  onCopy, 
  onFacebookPost,
  viewMode,
}: PropertyCardProps) {
  const hasPhotos = Object.keys(property).some(key => 
    key.toLowerCase().includes('photo') && property[key]
  )
  const hasVideo = Object.keys(property).some(key => 
    key.toLowerCase().includes('video') && property[key]
  )

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success'
      case 'draft': return 'warning'
      case 'sold': return 'secondary'
      default: return 'default'
    }
  }

  const formatPrice = (price: string | number) => {
    if (!price) return 'Price on request'
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price
    if (isNaN(numPrice)) return price
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice)
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200">
      {/* Preview Photo Thumbnail */}
      {property['Preview Photo'] && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <img 
            src={property['Preview Photo']} 
            alt={`Property #${property['Property ID']}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant={getStatusVariant(property.Status)} className="shadow-md">
              {property.Status || 'Draft'}
            </Badge>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {!property['Preview Photo'] && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusVariant(property.Status)}>
                  {property.Status || 'Draft'}
                </Badge>
                <Badge variant="outline">
                  {property.Type || 'Residential'}
                </Badge>
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>
              Property #{property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}
            </h3>
            
            <div className="flex items-center mb-2" style={{ color: '#4b5563' }}>
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {property.Village && `${property.Village}, `}
                {property.Location}
              </span>
            </div>
          </div>
          
          {!property['Preview Photo'] && (
            <div className="flex items-center gap-1">
              {hasPhotos && (
                <div className="p-1 bg-blue-50 rounded">
                  <Camera className="w-4 h-4 text-blue-600" />
                </div>
              )}
              {hasVideo && (
                <div className="p-1 bg-green-50 rounded">
                  <Video className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(property['Listing Price'] || property.ListingPrice || property.Price)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {property['Lot Area'] && (
              <div className="flex items-center">
                <Maximize className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>Lot: {property['Lot Area']} sqm</span>
              </div>
            )}
            {property['Floor Area'] && (
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>Floor: {property['Floor Area']} sqm</span>
              </div>
            )}
          </div>

          {property.Notes && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm line-clamp-2" style={{ color: '#374151' }}>
                {property.Notes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs" style={{ color: '#6b7280' }}>
            <span>CGT: {property.CGT || 'Seller'}</span>
            <span>Transfer: {property['Transfer Title'] || 'Buyer'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            const displayId = property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']
            window.location.href = `/properties/${displayId}`
          }}
          className="flex-1"
        >
          View Details
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit?.(property)}
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFacebookPost?.(property)}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
        >
          <Share2 className="w-4 h-4 mr-1" />
          FB Post
        </Button>
      </CardFooter>
    </Card>
  )
}
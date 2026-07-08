'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip } from './ui/tooltip'
import FeaturedToggle from './FeaturedToggle'
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
  Video,
  Trash2,
  EyeOff,
  ImagePlus,
  X
} from 'lucide-react'

interface PropertyCardProps {
  property: any;
  viewMode: 'grid' | 'list';
  onEdit?: (property: any) => void;
  onShare?: (property: any) => void;
  onCopy?: (property: any) => void;
  onFacebookPost?: (property: any) => void;
  onFacebookLinkSave?: (property: any, fbLink: string) => void;
  onInstagramPost?: (property: any) => void;
  onTikTokPost?: (property: any) => void;
  onDelete?: (property: any) => void;
  onHide?: (property: any) => void;
  onFeaturedChange?: () => void;
  canFeature?: boolean;
}

export default function PropertyCard({ 
  property, 
  onEdit, 
  onShare, 
  onCopy, 
  onFacebookPost,
  onFacebookLinkSave,
  onInstagramPost,
  onTikTokPost,
  onDelete,
  onHide,
  viewMode,
  onFeaturedChange,
  canFeature = false,
}: PropertyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingPhoto, setIsEditingPhoto] = useState(false)
  const [isEditingFBLink, setIsEditingFBLink] = useState(false)
  const [fbLinkValue, setFbLinkValue] = useState('')
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [savingFBLink, setSavingFBLink] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFBLinkSave = async () => {
    if (onFacebookLinkSave) {
      setSavingFBLink(true)
      await onFacebookLinkSave(property, fbLinkValue.trim())
      setSavingFBLink(false)
      setIsEditingFBLink(false)
    }
  }
  
  const hasPhotos = Object.keys(property).some(key => 
    key.toLowerCase().includes('photo') && property[key]
  )
  const hasVideo = Object.keys(property).some(key => 
    key.toLowerCase().includes('video') && property[key]
  )

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    const reader = new FileReader()
    
    reader.onload = () => {
      const base64String = reader.result as string
      setNewPhotoUrl(base64String)
      setUploadingImage(false)
    }
    
    reader.onerror = () => {
      alert('Error reading file')
      setUploadingImage(false)
    }
    
    reader.readAsDataURL(file)
  }

  const handlePhotoUpdate = async () => {
    if (!newPhotoUrl.trim()) {
      alert('Please enter a valid image URL or upload an image')
      return
    }

    try {
      const { supabase } = await import('@/app/lib/supabaseClient.js')
      
      if (!supabase) {
        alert('Database connection error')
        return
      }

      const { error } = await supabase
        .from('mlianglistings')
        .update({ 'Preview Photo': newPhotoUrl })
        .eq('Property ID', property['Property ID'])

      if (error) {
        alert('Error updating photo: ' + error.message)
      } else {
        alert('Photo updated successfully!')
        setIsEditingPhoto(false)
        setNewPhotoUrl('')
        window.location.reload()
      }
    } catch (err) {
      alert('Error updating photo: ' + err)
    }
  }

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
      {/* Preview Photo Thumbnail - Only show in grid view */}
      {viewMode === 'grid' && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg group/photo">
          <img
            src={property['Preview Photo'] || 'https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_200,g_face/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png'}
            alt={`Property #${property['Property ID']}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer${!property['Preview Photo'] ? ' opacity-60' : ''}`}
            loading="lazy"
            decoding="async"
            onClick={() => property['Preview Photo'] && setIsFullscreen(true)}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant={getStatusVariant(property.Status)} className="shadow-md">
              {property.Status || 'Draft'}
            </Badge>
          </div>
          
          {/* Edit Photo Overlay - Only visible in edit mode */}
          {onEdit && onDelete && (
            <div 
              onClick={() => setIsEditingPhoto(true)}
              className="absolute inset-0 bg-gray bg-opacity-70 group-hover/photo:bg-opacity-60 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <div className="opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                <ImagePlus className="w-10 h-10" />
                <span className="text-sm font-medium">Update Featured Preview Photo</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Fullscreen Image Modal */}
      {isFullscreen && property['Preview Photo'] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={property['Preview Photo']}
            alt={`Property #${property['Property ID']}`}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* Shared Photo Upload Modal */}
      {isEditingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h4 className="text-lg font-medium text-center" style={{ color: '#000000' }}>
              {property['Preview Photo'] ? 'Update Featured Preview Photo' : 'Add Featured Preview Photo'}
            </h4>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-4 py-3 rounded font-medium flex items-center justify-center gap-2"
            >
              <ImagePlus className="w-5 h-5" />
              {uploadingImage ? 'Uploading...' : 'Upload Image from Computer'}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            {/* URL input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>
                Enter Image URL
              </label>
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                style={{ color: '#000000' }}
              />
            </div>
            
            {/* Preview */}
            {newPhotoUrl && (
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: '#4b5563' }}>
                  Preview
                </label>
                <div className="w-full h-48 rounded overflow-hidden border border-gray-300">
                  <img 
                    src={newPhotoUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => alert('Invalid image URL or unable to load image')}
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePhotoUpdate}
                disabled={!newPhotoUrl || uploadingImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium"
              >
                Save Photo
              </button>
              <button
                onClick={() => {
                  setIsEditingPhoto(false)
                  setNewPhotoUrl('')
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* FB Link Edit Modal */}
      {isEditingFBLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h4 className="text-lg font-medium text-center" style={{ color: '#000000' }}>
              Edit Facebook Link
            </h4>
            <p className="text-sm text-gray-500 text-center">
              {property['FB Link'] ? 'Update the Facebook post or marketplace link for this property.' : 'Add a Facebook post or marketplace link for this property.'}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>
                Facebook URL
              </label>
              <input
                type="url"
                value={fbLinkValue}
                onChange={(e) => setFbLinkValue(e.target.value)}
                placeholder="https://www.facebook.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                style={{ color: '#000000' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFBLinkSave()
                  if (e.key === 'Escape') setIsEditingFBLink(false)
                }}
              />
            </div>
            {fbLinkValue.trim() && (
              <a
                href={fbLinkValue.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Preview link
              </a>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFBLinkSave}
                disabled={savingFBLink}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium"
              >
                {savingFBLink ? 'Saving...' : 'Save Link'}
              </button>
              <button
                onClick={() => setIsEditingFBLink(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Show badges when in list view OR when no preview photo in grid view */}
            {(viewMode === 'list' || !property['Preview Photo']) && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusVariant(property.Status)}>
                  {property.Status || 'Draft'}
                </Badge>
                <Badge variant="outline">
                  {property.Type || 'Residential'}
                </Badge>
              </div>
            )}
            
            {/* <h3 className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>
              Property #{property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}
            </h3> */}
            
            <div className="flex items-center mb-2" style={{ color: '#4b5563' }}>
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {property.Village && `${property.Village}, `}
                {property.Location}
              </span>
            </div>
          </div>
          
          {/* Show camera/video icons only in grid view when no preview photo */}
          {viewMode === 'grid' && !property['Preview Photo'] && (
            <div className="flex items-center gap-1">
              {hasPhotos && (
                <Tooltip content={onEdit && onDelete ? "Click to add Featured Preview Photo" : "Has photos"}>
                  <div 
                    className={`p-1 bg-blue-50 rounded ${onEdit && onDelete ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                    onClick={() => {
                      if (onEdit && onDelete) {
                        setIsEditingPhoto(true)
                      }
                    }}
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                  </div>
                </Tooltip>
              )}
              {hasVideo && (
                <div className="p-1 bg-green-50 rounded">
                  <Video className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(property['Listing Price'] || property.ListingPrice || property.Price)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Left column: Lot Area or Bedroom */}
            {(property['Lot Area sqm'] || property['Lot Area']) ? (
              <div className="flex items-center">
                <Maximize className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>
                  Lot: {property['Lot Area sqm'] || property['Lot Area']} {property['Lot Area sqm'] ? '' : 'sqm'}
                </span>
              </div>
            ) : property.Bedroom ? (
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>{property.Bedroom} BR</span>
              </div>
            ) : (
              <div></div>
            )}
            
            {/* Right column: Floor Area or Garage */}
            {(property['Floor Area sqm'] || property['Floor Area']) ? (
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>
                  Floor: {property['Floor Area sqm'] || property['Floor Area']} {property['Floor Area sqm'] ? '' : 'sqm'}
                </span>
              </div>
            ) : property.Garage ? (
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-400" />
                <span style={{ color: '#4b5563' }}>{property.Garage} Garage</span>
              </div>
            ) : (
              <div></div>
            )}
          </div>

          {property.Notes && (
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <div className="p-4">
                <p 
                  className={`text-sm leading-relaxed whitespace-pre-line ${isExpanded ? '' : 'line-clamp-3'}`}
                  style={{ color: '#374151' }}
                >
                  {property.Notes}
                </p>
              </div>
              {property.Notes.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors text-center border-t border-gray-200"
                >
                  {isExpanded ? '↑ Show less' : '↓ Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-0 flex flex-col">
        {/* Main Action Buttons - Edit/Delete or View Details */}
        <div className="px-6 pb-4">
          <div className="flex gap-2 w-full">
            {onEdit && onDelete ? (
              // Editing mode: Show Edit, Delete, and Featured toggle
              <>
                <Tooltip content="Edit this property">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(property)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </Tooltip>
                
                <Tooltip content="Delete this property">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(property)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Tooltip>

                <FeaturedToggle
                  propertyId={property['Property ID']}
                  isFeatured={!!property.featured}
                  canToggle={canFeature}
                  onToggle={onFeaturedChange}
                />
              </>
            ) : (
              // Normal mode: Show View Details button
              <Tooltip content="View full property details">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const displayId = property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']
                    window.location.href = `/properties/${displayId}`
                  }}
                  className="w-full"
                >
                  View Details
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Social Media Footer - Distinct Background */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-4 py-3 rounded-b-lg">
          <div className="flex items-center justify-center gap-2">
            <Tooltip content={onEdit && onDelete ? (property['FB Link'] ? "Edit Facebook link" : "Add Facebook link") : "Copy Facebook post to clipboard"}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onEdit && onDelete) {
                    // Edit mode: open FB link editor
                    setFbLinkValue(property['FB Link'] || '')
                    setIsEditingFBLink(true)
                  } else {
                    // Normal mode: copy post to clipboard
                    onFacebookPost?.(property)
                  }
                }}
                className={`flex-1 border ${
                  onEdit && onDelete
                    ? property['FB Link']
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                <span className="text-xs font-medium">
                  {onEdit && onDelete
                    ? property['FB Link'] ? 'FB Linked ✓' : 'Add FB Link'
                    : 'Facebook'}
                </span>
              </Button>
            </Tooltip>

            {onInstagramPost && (
              <Tooltip content="Copy Instagram caption to clipboard">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onInstagramPost(property)}
                  className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200"
                >
                  <span className="mr-1">📸</span>
                  <span className="text-xs font-medium">Instagram</span>
                </Button>
              </Tooltip>
            )}

            {onTikTokPost && (
              <Tooltip content="Copy TikTok caption to clipboard">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTikTokPost(property)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
                >
                  <span className="mr-1">🎵</span>
                  <span className="text-xs font-medium">TikTok</span>
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
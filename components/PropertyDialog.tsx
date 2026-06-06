'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X, Plus, Minus, Upload, Eye, EyeOff } from 'lucide-react'

interface PropertyDialogProps {
  property: any
  isOpen: boolean
  onClose: () => void
  columns: string[]
}

export default function PropertyDialog({ property, isOpen, onClose, columns }: PropertyDialogProps) {
  const [formData, setFormData] = useState<any>({})
  const [pasteData, setPasteData] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showListingAgent, setShowListingAgent] = useState(false)

  useEffect(() => {
    if (property) {
      setFormData({ ...property })
      setPreviewImage(property['Preview Photo'] || '')
    } else {
      // Don't auto-generate Property ID - let user enter it manually or leave empty
      setFormData({
          // 'Property ID' is optional - user can provide it
          Status: 'Active',
          Type: 'Residential',
          CGT: 'Seller',
          'Transfer Title': 'Buyer',
          'Listing Mode': 'For Sale',
          'Lot Area sqm': '100',
          'Floor Area sqm': '100',
          Location: 'City of San Fernando',
          'Listing Price': '',
          Negotiable: 'Yes',
          'Preview Photo': '',
          'Financing options': 'Bank Financing'
        })
      setPreviewImage('')
    }
  }, [property, columns])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploadingImage(true)

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreviewImage(base64String)
        setFormData((prev: any) => ({ ...prev, 'Preview Photo': base64String }))
        setUploadingImage(false)
      }
      reader.onerror = () => {
        alert('Error reading file')
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert('Error uploading image')
      setUploadingImage(false)
    }
  }

  const removePreviewImage = () => {
    setPreviewImage('')
    setFormData((prev: any) => ({ ...prev, 'Preview Photo': '' }))
  }

  const parseExcelData = () => {
    if (!pasteData.trim()) return
    const values = pasteData.split('\t')
    const parsed: any = {}
    
    columns.forEach((key, index) => {
      if (values[index] && key !== 'Property ID') {
        parsed[key] = values[index].trim()
      }
    })
    
    setFormData((prev: any) => ({ ...prev, ...parsed }))
    setPasteData('')
  }

  const handleCreate = async () => {
    if (!supabase) return
    setLoading(true)
    
    // Prepare data for insertion - remove Property ID if empty
    const dataToInsert = { ...formData }
    
    // If Property ID is not provided, empty, or invalid, remove it so database can auto-generate it
    const propertyId = dataToInsert['Property ID']
    if (!propertyId || 
        String(propertyId).trim() === '' || 
        propertyId === 0 || 
        propertyId === '0' ||
        isNaN(Number(propertyId))) {
      delete dataToInsert['Property ID']
    } else {
      // Convert to number if it's a valid ID
      dataToInsert['Property ID'] = Number(propertyId)
    }
    
    const { error } = await supabase.from('mlianglistings').insert(dataToInsert)
    if (error) {
      alert('Record not added. Error: ' + error.message)
    } else {
      alert('Record successfully added!')
      onClose()
    }
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!supabase) return
    setLoading(true)
    const { error } = await supabase
      .from('mlianglistings')
      .update(formData)
      .eq('Property ID', property['Property ID'])
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      alert('Record successfully updated!')
      onClose()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Photo Upload/Link Section - At the top */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Property Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3" style={{ color: '#000000' }}>
                    Featured Preview Photo
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#4b5563' }}>
                    Upload a featured image that will be displayed in property cards
                  </p>
                  
                  {previewImage ? (
                    <div className="relative">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                        onClick={() => {
                          // Open fullscreen view
                          const viewer = document.createElement('div')
                          viewer.className = 'fixed inset-0 z-[100] bg-black flex items-center justify-center'
                          viewer.onclick = () => viewer.remove()
                          viewer.innerHTML = `
                            <button class="absolute top-4 right-4 text-white hover:text-gray-300 z-10" onclick="this.parentElement.remove()">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <img src="${previewImage}" alt="Preview" class="max-w-full max-h-full object-contain" onclick="event.stopPropagation()">
                          `
                          document.body.appendChild(viewer)
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPreviewImage('')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Change Photo
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removePreviewImage}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                        id="featured-photo-upload"
                      />
                      
                      {/* Upload button */}
                      <button
                        onClick={() => document.getElementById('featured-photo-upload')?.click()}
                        disabled={uploadingImage}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-4 py-3 rounded font-medium flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
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
                          value={previewImage}
                          onChange={(e) => {
                            setPreviewImage(e.target.value)
                            setFormData((prev: any) => ({ ...prev, 'Preview Photo': e.target.value }))
                          }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          style={{ color: '#000000' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Google Photos Link (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData['Photos'] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, 'Photos': e.target.value }))}
                    placeholder="Paste Google Photos album link here..."
                  />
                  <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                    Paste a link to a Google Photos album or any photo gallery
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    FB Link (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData['FB Link'] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, 'FB Link': e.target.value }))}
                    placeholder="Paste Facebook post or marketplace link here..."
                  />
                  <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                    Link to the Facebook post or marketplace listing
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Excel Paste Section - Only for new properties */}
            {!property && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Import from Excel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="Paste copied Excel row here (tab-separated values)..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm text-black resize-none"
                  />
                  <Button
                    onClick={parseExcelData}
                    disabled={!pasteData.trim()}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Parse Data
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {columns
                .filter(key => {
                  // Filter out photo-related columns (they have their own section above)
                  const photoColumns = ['Photos', 'FB Link', 'Google Photos Link', 'Preview Photo', 'Featured Preview Photo']
                  return !photoColumns.some(col => col.toLowerCase() === key.toLowerCase())
                })
                .filter(key => {
                  // Hide house-specific fields when Type is "Lot"
                  const isLotOnly = formData['Type'] === 'Lot'
                  const houseOnlyFields = ['Floor Area sqm', 'Bedroom', 'T&B', 'Garage', 'Formal Kitchen', 'Informal kitchen']
                  if (isLotOnly && houseOnlyFields.includes(key)) {
                    return false
                  }
                  return true
                })
                .map(key => (
                <div key={key} className={key === 'Notes' || key === 'Description' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key}
                    {key === 'Property ID' && !property && (
                      <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span>
                    )}
                    {['Village', 'Location', 'Listing Agent'].includes(key) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {/* Toggle button for Listing Agent */}
                    {key === 'Listing Agent' && (
                      <button
                        type="button"
                        onClick={() => setShowListingAgent(v => !v)}
                        className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-blue-600 hover:text-blue-800"
                      >
                        {showListingAgent
                          ? <><EyeOff className="w-3 h-3" /> Hide</>
                          : <><Eye className="w-3 h-3" /> Show</>}
                      </button>
                    )}
                  </label>

                  {/* Hide Listing Agent field behind toggle */}
                  {key === 'Listing Agent' && !showListingAgent ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-dashed border-gray-300">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400 italic">Hidden — click Show to edit</span>
                    </div>
                  ) : key === 'Property ID' ? (
                    <div>
                      <Input
                        type="number"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Leave empty for auto-generated ID (optional)"
                        className="bg-gray-50"
                      />
                      {!property && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Optional: Enter a specific Property ID or leave empty for database to assign one
                        </p>
                      )}
                    </div>
                  ) : key === 'Status' ? (
                    <select
                      value={formData[key] || 'Draft'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Sold">Sold</option>
                    </select>
                  ) : key === 'Type' ? (
                    <select
                      value={formData[key] || 'Residential'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Lot">Lot</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  ) : key === 'CGT' ? (
                    <select
                      value={formData[key] || 'Seller'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Seller">Seller</option>
                      <option value="Buyer">Buyer</option>
                    </select>
                  ) : key === 'Transfer Title' ? (
                    <select
                      value={formData[key] || 'Buyer'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </select>
                  ) : key === 'Negotiable' ? (
                    <select
                      value={formData[key] || 'Yes'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (key === 'MOP' || key === 'Financing options') ? (
                    <select
                      value={formData[key] || 'Bank Financing'}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Financing">Bank Financing</option>
                      <option value="Pagibig">Pagibig</option>
                      <option value="Inhouse">Inhouse</option>
                      <option value="Others">Others</option>
                    </select>
                  ) : key === 'Listing Mode' ? (
                    <div className="flex gap-3">
                      {(['For Sale', 'For Rent'] as const).map(mode => (
                        <label
                          key={mode}
                          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                            formData[key] === mode
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="listingMode"
                            value={mode}
                            checked={formData[key] === mode}
                            onChange={() => setFormData((prev: any) => ({ ...prev, [key]: mode }))}
                            className="hidden"
                          />
                          {mode === 'For Sale' ? '🏷️' : '🔑'} {mode}
                        </label>
                      ))}
                    </div>
                  ) : key === 'Lot Area sqm' || key === 'Floor Area sqm' ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData((prev: any) => ({ 
                          ...prev, 
                          [key]: Math.max(0, (Number(prev[key]) || 0) - 1) 
                        }))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={formData[key] || 0}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData((prev: any) => ({ 
                          ...prev, 
                          [key]: (Number(prev[key]) || 0) + 1 
                        }))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-500">sqm</span>
                    </div>
                  ) : key === 'Photos' || key === 'FB Link' ? (
                    <textarea
                      value={formData[key] || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md text-black resize-none"
                      placeholder={key === 'Photos' ? "Enter property description..." : "Enter property details, features, and additional information..."}
                    />  
                  ) : key === 'Notes' || key === 'Description' ? (
                    <textarea
                      value={formData[key] || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md text-black resize-none"
                      placeholder={key === 'Description' ? "Enter property description..." : "Enter property details, features, and additional information..."}
                    />
                  ) : key.toLowerCase().includes('price') ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <Input
                        type="text"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                        className="pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={formData[key] || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      required={['Village', 'Location', 'Listing Agent'].includes(key)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={property ? handleUpdate : handleCreate}
            disabled={loading}
          >
            {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </div>
    </div>
  )
}
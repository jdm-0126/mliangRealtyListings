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
      // Fetch the latest Property ID from database to avoid duplicates
      const fetchMaxId = async () => {
        if (!supabase) return
        const { data, error } = await supabase
          .from('mlianglistings')
          .select('Property ID')
          .order('Property ID', { ascending: false })
          .limit(1)
        
        const maxId = data && data.length > 0 ? Number((data[0] as any)['Property ID']) : 0
        
        setFormData({
          'Property ID': maxId + 1,
          Status: 'Active',
          Type: 'Residential',
          CGT: 'Seller',
          'Transfer Title': 'Buyer',
          'Lot Area': '100',
          'Floor Area': '100',
          Location: 'City of San Fernando',
          Video: '',
          'Listing Price': '',
          Negotiable: 'Yes',
          'Preview Photo': ''
        })
      }
      
      fetchMaxId()
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
    const { error } = await supabase.from('mlianglistings').insert(formData)
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Photo Upload/Link Section - At the top */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Property Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Google Photos Link
                  </label>
                  <Input
                    type="text"
                    value={formData['Google Photos Link'] || formData['Photos'] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, 'Google Photos Link': e.target.value, 'Photos': e.target.value }))}
                    placeholder="Paste Google Photos album link here..."
                  />
                  <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                    Paste a link to a Google Photos album or any photo gallery
                  </p>
                </div>

                <div className="border-t pt-4">
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
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removePreviewImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        PNG, JPG up to 5MB
                      </p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <Button variant="outline" size="sm" disabled={uploadingImage} asChild>
                          <span>
                            {uploadingImage ? 'Uploading...' : 'Choose File'}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Photo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Featured Preview Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-600">
                  Upload a featured image that will be displayed in property details before viewing the full Google Photos album
                </p>
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
              {columns.map(key => (
                <div key={key} className={key === 'Notes' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key}
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
                    <Input
                      type="number"
                      value={formData[key] || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="bg-gray-50"
                    />
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
                  ) : key === 'Lot Area' || key === 'Floor Area' ? (
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
                  ) : key === 'Notes' ? (
                    <textarea
                      value={formData[key] || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md text-black resize-none"
                      placeholder="Enter property details, features, and additional information..."
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
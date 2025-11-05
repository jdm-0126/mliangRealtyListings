'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [watermarkText, setWatermarkText] = useState('MLiang Listings')
  const [contactNumber, setContactNumber] = useState('09393440944')
  const [propertyId, setPropertyId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
      
      // Generate previews
      const previewUrls = await Promise.all(
        files.map(file => addWatermark(file).then(blob => URL.createObjectURL(blob)))
      )
      setPreviews(previewUrls)
    }
  }

  const addWatermark = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      const watermarkImg = new Image()

      watermarkImg.onload = () => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          
          ctx.drawImage(img, 0, 0)
          
          // Add watermark image with maintained aspect ratio
          const maxWatermarkWidth = img.width * 0.2
          const scale = maxWatermarkWidth / watermarkImg.width
          const watermarkWidth = watermarkImg.width * scale
          const watermarkHeight = watermarkImg.height * scale
          
          const x = img.width - watermarkWidth - 20
          const y = img.height - watermarkHeight - 20
          
          ctx.globalAlpha = 0.7
          ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight)
          
          // Add text watermark if watermarkText has value
          // if (watermarkText.trim()) {
          //   ctx.font = `${Math.max(16, img.width / 40)}px Arial`
          //   ctx.fillStyle = 'white'
          //   ctx.textAlign = 'left'
          //   ctx.fillText(watermarkText, x + watermarkWidth + 10, y + watermarkHeight / 2)
          // }
          
          // Add contact number if provided
          if (contactNumber.trim()) {
            ctx.font = `${Math.max(14, img.width / 50)}px Arial`
            ctx.fillStyle = 'white'
            ctx.textAlign = 'left'
            ctx.fillText(contactNumber, x + watermarkWidth + 10, y + watermarkHeight / 2 + 25)
          }
          
          ctx.globalAlpha = 1.0
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
          }, 'image/jpeg', 0.9)
        }
        img.src = URL.createObjectURL(file)
      }

      watermarkImg.src = '/mliangrealty.png'
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !supabase) {
      alert('Please select files')
      return
    }

    setUploading(true)
    let uploaded = 0
    const uploadedUrls: string[] = []
    
    try {
      for (const file of selectedFiles) {
        setProgress(`Processing ${uploaded + 1}/${selectedFiles.length}...`)
        
        const watermarkedBlob = await addWatermark(file)
        const timestamp = new Date().getTime()
        const random = Math.floor(Math.random() * 1000000)
        const fileName = `uploads/${timestamp}-${random}.jpg`
        
        const { data, error } = await supabase.storage
          .from('mliangwatermarklistings')
          .upload(fileName, watermarkedBlob, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('mliangwatermarklistings')
          .getPublicUrl(fileName)
        
        uploadedUrls.push(publicUrl)
        uploaded++
      }
      
      // Update database with uploaded photos
      if (uploadedUrls.length > 0) {
        const photosUrl = uploadedUrls.join(', ')
        
        try {
          const { data: dbData, error: dbError } = await supabase
            .from('mlianglistings')
            .insert({
              'Property ID': propertyId ? parseInt(propertyId) : Date.now() + Math.floor(Math.random() * 1000),
              'Photos': photosUrl,
              'Status': 'Active',
              'Notes': `Uploaded ${new Date().toLocaleDateString()}`
            })
            .select()
          
          if (dbError) {
            console.error('Database error details:', dbError)
            alert(`Photos uploaded successfully but database update failed: ${dbError.message}`)
          } else {
            console.log('Database updated successfully:', dbData)
            alert(`${uploaded} photos uploaded and database updated successfully!`)
          }
        } catch (dbErr: any) {
          console.error('Database operation failed:', dbErr)
          alert(`Photos uploaded but database error: ${dbErr.message}`)
        }
      }
      
      setSelectedFiles([])
      setPreviews([])
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed after ${uploaded} files: ${error.message}`)
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">📸 Upload Photo</h1>
      
      <div className="space-y-4">
        {/* <div>
          <label className="block text-sm font-medium mb-2">Watermark Text</label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div> */}

        <div>
          <label className="block text-sm font-medium mb-2">Property ID (Optional)</label>
          <input
            type="text"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="Enter property ID"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contact Number</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Enter contact number"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Photo</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFiles.length} file(s)
          </div>
        )}
        
        {previews.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Preview with Watermark:</h3>
            <div className="grid grid-cols-2 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <button
                    onClick={async () => {
                      if (!mounted) return
                      // Convert blob URL to base64 for storage
                      const response = await fetch(preview)
                      const blob = await response.blob()
                      const reader = new FileReader()
                      reader.onload = () => {
                        sessionStorage.setItem('editFile', JSON.stringify({
                          file: selectedFiles[index].name,
                          data: reader.result
                        }))
                        window.location.href = '/editor'
                      }
                      reader.readAsDataURL(blob)
                    }}
                    className="absolute top-1 right-1 bg-blue-500 text-white px-2 py-1 text-xs rounded"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!mounted) return
                  // Store all files and redirect to editor
                  sessionStorage.setItem('editFiles', JSON.stringify(
                    previews.map((preview, index) => ({
                      file: selectedFiles[index].name,
                      data: preview
                    }))
                  ))
                  window.location.href = '/editor'
                }}
                className="flex-1 bg-green-500 text-white p-2 rounded text-sm"
              >
                Edit All ({previews.length} files)
              </button>
              <button
                onClick={() => {
                  previews.forEach((preview, index) => {
                    const a = document.createElement('a')
                    a.href = preview
                    a.download = `watermarked-${selectedFiles[index].name}`
                    a.click()
                  })
                }}
                className="flex-1 bg-blue-500 text-white p-2 rounded text-sm"
              >
                Save All
              </button>
            </div>
          </div>
        )}
        
        {progress && (
          <div className="text-sm text-blue-600">
            {progress}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="w-full bg-blue-500 text-white p-3 rounded disabled:bg-gray-300"
        >
          {uploading ? 'Uploading...' : 'Upload with Watermark'}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  )
}
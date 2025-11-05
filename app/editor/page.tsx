'use client'
import { useState, useRef, useEffect } from 'react'

export default function Editor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 0.8, y: 0.8 })
  const [contactNumber, setContactNumber] = useState('09123456789')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load file from sessionStorage if available
    const editFile = sessionStorage.getItem('editFile')
    if (editFile) {
      const { file, data } = JSON.parse(editFile)
      // Convert base64 data URL back to blob
      fetch(data)
        .then(res => res.blob())
        .then(blob => {
          const newFile = new File([blob], file, { type: 'image/jpeg' })
          setSelectedFile(newFile)
        })
        .catch(() => {
          sessionStorage.removeItem('editFile')
        })
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setImageLoaded(false)
    }
  }

  const drawCanvas = () => {
    if (!selectedFile || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const watermarkImg = new Image()

    watermarkImg.onload = () => {
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0)
        
        // Add watermark at current position
        const maxWatermarkWidth = img.width * 0.2
        const scale = maxWatermarkWidth / watermarkImg.width
        const watermarkWidth = watermarkImg.width * scale
        const watermarkHeight = watermarkImg.height * scale
        
        const x = (img.width - watermarkWidth) * watermarkPosition.x
        const y = (img.height - watermarkHeight) * watermarkPosition.y
        
        ctx.globalAlpha = 0.7
        ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight)
        
        // Add text watermark next to image
        ctx.font = `${Math.max(16, img.width / 40)}px Arial`
        ctx.fillStyle = 'white'
        ctx.textAlign = 'left'
        ctx.fillText('MliangRealty', x + watermarkWidth + 10, y + watermarkHeight / 2)
        
        // Add contact number if provided
        if (contactNumber.trim()) {
          ctx.font = `${Math.max(14, img.width / 50)}px Arial`
          ctx.fillStyle = 'white'
          ctx.textAlign = 'left'
          ctx.fillText(contactNumber, x + watermarkWidth + 10, y + watermarkHeight / 2 + 25)
        }
        
        ctx.globalAlpha = 1.0
        
        setImageLoaded(true)
      }
      img.src = URL.createObjectURL(selectedFile)
    }
    watermarkImg.src = '/mliangrealty.png'
  }

  useEffect(() => {
    drawCanvas()
  }, [selectedFile, watermarkPosition])

  const handleSave = () => {
    if (!canvasRef.current) return
    
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        // Save to downloads
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `watermarked-${selectedFile?.name || 'image.jpg'}`
        a.click()
        
        // Update sessionStorage with edited image and go back
        const reader = new FileReader()
        reader.onload = () => {
          const editFile = sessionStorage.getItem('editFile')
          if (editFile) {
            const fileData = JSON.parse(editFile)
            fileData.data = reader.result
            sessionStorage.setItem('editFile', JSON.stringify(fileData))
          }
          window.history.back()
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.9)
  }

  if (!mounted) {
    return null
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-500 text-white px-3 py-2 rounded text-sm"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">🎨 Watermark Editor</h1>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
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

        {selectedFile && (
          <>
            <div className="border rounded p-4">
              <canvas 
                ref={canvasRef} 
                className="max-w-full h-auto border"
                style={{ maxHeight: '400px' }}
              />
            </div>

            {imageLoaded && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horizontal Position: {Math.round(watermarkPosition.x * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={watermarkPosition.x}
                    onChange={(e) => setWatermarkPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vertical Position: {Math.round(watermarkPosition.y * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={watermarkPosition.y}
                    onChange={(e) => setWatermarkPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setWatermarkPosition({ x: 0.05, y: 0.05 })}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Top Left
                  </button>
                  <button
                    onClick={() => setWatermarkPosition({ x: 0.95, y: 0.05 })}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Top Right
                  </button>
                  <button
                    onClick={() => setWatermarkPosition({ x: 0.05, y: 0.95 })}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Bottom Left
                  </button>
                  <button
                    onClick={() => setWatermarkPosition({ x: 0.95, y: 0.95 })}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Bottom Right
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-500 text-white p-3 rounded"
                  >
                    Save & Go Back
                  </button>
                  <button
                    onClick={() => {
                      if (!canvasRef.current) return
                      canvasRef.current.toBlob((blob) => {
                        if (blob) {
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `watermarked-${selectedFile?.name || 'image.jpg'}`
                          a.click()
                        }
                      }, 'image/jpeg', 0.9)
                    }}
                    className="flex-1 bg-green-500 text-white p-3 rounded"
                  >
                    Download Only
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
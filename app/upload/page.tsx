'use client';
import React, { useState, useRef } from 'react';

interface ImageSettings {
  file: File;
  watermarkType: 'logo-contact' | 'logo-only' | 'contact-only';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  scale: number;
  opacity: number;
}

export default function Upload() {
  const [imageSettings, setImageSettings] = useState<ImageSettings[]>([]);
  const [contactNumber, setContactNumber] = useState('+63 123 456 7890');
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [albumName, setAlbumName] = useState('Property Photos');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoImage(img);
    img.src = '/mliangrealty.png';
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newSettings = files.map(file => ({
        file,
        watermarkType: 'logo-contact' as const,
        position: 'bottom-right' as const,
        scale: 1,
        opacity: 0.9
      }));
      setImageSettings(newSettings);
    }
  };

  const updateImageSetting = (index: number, key: keyof Omit<ImageSettings, 'file'>, value: any) => {
    setImageSettings(prev => prev.map((setting, i) => 
      i === index ? { ...setting, [key]: value } : setting
    ));
  };

  const addWatermark = (setting: ImageSettings): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const baseLogoSize = Math.min(img.width, img.height) * 0.15 * setting.scale;
        const logoWidth = logoImage ? baseLogoSize * (logoImage.width / logoImage.height) : baseLogoSize;
        const logoHeight = baseLogoSize;
        const fontSize = Math.max(14, img.width / 40) * setting.scale;
        const padding = 20;
        
        ctx.font = `${fontSize}px Arial`;
        ctx.globalAlpha = setting.opacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${setting.opacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${setting.opacity * 0.7})`;
        ctx.lineWidth = 1;
        
        const textWidth = ctx.measureText(contactNumber).width;
        const totalWidth = Math.max(logoWidth, textWidth);
        const totalHeight = logoHeight + fontSize + 15;
        
        let x = 0, y = 0;
        switch (setting.position) {
          case 'top-left': 
            x = padding; 
            y = padding; 
            break;
          case 'top-right': 
            x = img.width - padding - totalWidth; 
            y = padding; 
            break;
          case 'bottom-left': 
            x = padding; 
            y = img.height - padding - totalHeight; 
            break;
          case 'bottom-right': 
            x = img.width - padding - totalWidth; 
            y = img.height - padding - totalHeight; 
            break;
          case 'center': 
            x = (img.width - totalWidth) / 2; 
            y = (img.height - totalHeight) / 2; 
            break;
        }
        
        if (setting.watermarkType === 'contact-only') {
          ctx.textAlign = 'left';
          ctx.strokeText(contactNumber, x, y + fontSize);
          ctx.fillText(contactNumber, x, y + fontSize);
        } else if (setting.watermarkType === 'logo-contact' && logoImage) {
          const logoX = x + (totalWidth - logoWidth) / 2;
          ctx.drawImage(logoImage, logoX, y, logoWidth, logoHeight);
          
          const textX = x + (totalWidth - textWidth) / 2;
          const textY = y + logoHeight + fontSize + 5;
          ctx.textAlign = 'left';
          ctx.strokeText(contactNumber, textX, textY);
          ctx.fillText(contactNumber, textX, textY);
        } else if (logoImage) {
          const logoX = x + (totalWidth - logoWidth) / 2;
          ctx.drawImage(logoImage, logoX, y, logoWidth, logoHeight);
        }
        
        ctx.globalAlpha = 1;
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      };
      
      img.src = URL.createObjectURL(setting.file);
    });
  };

  const processAndSaveImages = async () => {
    if (imageSettings.length === 0) return;
    
    setProcessing(true);
    const processedFiles: { blob: Blob; name: string }[] = [];
    
    for (const setting of imageSettings) {
      const watermarkedBlob = await addWatermark(setting);
      processedFiles.push({
        blob: watermarkedBlob,
        name: `${albumName}_${setting.file.name}`
      });
    }
    
    // Create and download zip file
    const zip = new (window as any).JSZip();
    const folder = zip.folder(albumName);
    
    processedFiles.forEach(({ blob, name }) => {
      folder.file(name, blob);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${albumName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    setProcessing(false);
    alert(`${processedFiles.length} images processed and saved to ${albumName}.zip!`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>← Back to Dashboard</button>
      </div>
      
      <h1>📤 Upload & Watermark Images</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contact Number:</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Album Name:</label>
          <input
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }}>📁 Select Images</button>
      </div>
      
      {imageSettings.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Configure Watermarks ({imageSettings.length} images):</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {imageSettings.map((setting, index) => (
              <div key={index} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px' }}>
                <img src={URL.createObjectURL(setting.file)} alt={setting.file.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                <div>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{setting.file.name}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Watermark Type:</label>
                      <select value={setting.watermarkType} onChange={(e) => updateImageSetting(index, 'watermarkType', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}>
                        <option value="logo-contact">Logo + Contact</option>
                        <option value="logo-only">Logo Only</option>
                        <option value="contact-only">Contact Only</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Position:</label>
                      <select value={setting.position} onChange={(e) => updateImageSetting(index, 'position', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Scale: {setting.scale}x</label>
                      <input type="range" min="0.5" max="2" step="0.1" value={setting.scale} onChange={(e) => updateImageSetting(index, 'scale', parseFloat(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Opacity: {Math.round(setting.opacity * 100)}%</label>
                      <input type="range" min="0.1" max="1" step="0.1" value={setting.opacity} onChange={(e) => updateImageSetting(index, 'opacity', parseFloat(e.target.value))} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {imageSettings.length > 0 && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={processAndSaveImages}
            disabled={processing}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: processing ? '#6c757d' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? '⏳ Processing...' : `💾 Save to ${albumName}`}
          </button>
          <button
            onClick={() => setImageSettings([])}
            disabled={processing}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
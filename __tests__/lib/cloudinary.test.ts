import { buildPropertyUploadFolder, buildPropertyGalleryRecord, buildSharpenedCloudinaryUrl } from '../../lib/cloudinary'

describe('property Cloudinary upload helpers', () => {
  it('builds a predictable folder path for a property upload', () => {
    expect(buildPropertyUploadFolder(42)).toBe('GalleryMliang/property/42')
  })

  it('builds the gallery payload for a property image upload', () => {
    const record = buildPropertyGalleryRecord({
      tenantId: 'tenant-1',
      propertyId: 42,
      title: 'Living Room',
      secureUrl: 'https://example.com/photo.jpg',
      publicId: 'gallery/42/living-room',
      category: 'property',
      isFeatured: false,
    })

    expect(record).toMatchObject({
      tenant_id: 'tenant-1',
      category: 'property',
      listing_id: 42,
      title: 'Living Room',
      cloudinary_public_id: 'gallery/42/living-room',
      cloudinary_secure_url: 'https://example.com/photo.jpg',
      is_featured: false,
    })
  })

  it('adds a sharpened Cloudinary transformation to preview URLs', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg'
    expect(buildSharpenedCloudinaryUrl(url)).toBe('https://res.cloudinary.com/demo/image/upload/e_sharpen:100,q_auto,f_auto/v1234/sample.jpg')
  })
})

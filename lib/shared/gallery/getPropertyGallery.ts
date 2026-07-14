// lib/shared/gallery/getPropertyGallery.ts

import { Query } from "node-appwrite";
import { getServerClient, DATABASE_ID } from "@/lib/appwrite/server";

const GALLERY_COLLECTION =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GALLERY!;

export interface PropertyGalleryImage {
  id: string;
  listingId: number;
  url: string;
  publicId?: string;
  title?: string;
  isFeatured: boolean;
}

export async function getPropertyGallery(
  listingId: number
): Promise<PropertyGalleryImage[]> {
  const db = getServerClient();

  try {
    const res = await db.listDocuments(
      DATABASE_ID,
      GALLERY_COLLECTION,
      [
        Query.equal("listing_id", listingId),
        Query.orderAsc("$createdAt"),
        Query.limit(500),
      ]
    );

    return res.documents.map(doc => ({
      id: String(doc.$id),
      listingId: Number(doc.listing_id),
      url: String(
        doc.cloudinary_secure_url ??
        doc.cloudinary_url ??
        ""
      ),
      publicId:
        typeof doc.cloudinary_public_id === "string"
          ? doc.cloudinary_public_id
          : undefined,
      title:
        typeof doc.title === "string"
          ? doc.title
          : undefined,
      isFeatured: doc.is_featured === true,
    }));
  } catch (err) {
    console.error("[getPropertyGallery]", err);
    return [];
  }
}

export async function getPropertyGalleryUrls(
  listingId: number
): Promise<string[]> {
  const gallery = await getPropertyGallery(listingId);

  return gallery
    .map(img => img.url)
    .filter(Boolean);
}
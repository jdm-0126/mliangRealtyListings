import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { ID, Query } from 'appwrite'

const COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WEBSITE_CONTENT!

export type WebsiteContentType = 'text' | 'html' | 'json'

export interface WebsiteContentEntry {
  id?: string
  section_key: string
  content_type: WebsiteContentType
  content_value: string
  is_active?: boolean
  display_order?: number
}

export async function readWebsiteContent(sectionKey: string): Promise<WebsiteContentEntry | null> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL, [
      Query.equal('section_key', sectionKey),
      Query.equal('is_active', true),
      Query.limit(1),
    ])
    if (!res.documents.length) return null
    const doc = res.documents[0]
    return {
      id: doc.$id,
      section_key: doc['section_key'] as string,
      content_type: doc['content_type'] as WebsiteContentType,
      content_value: doc['content_value'] as string,
      is_active: doc['is_active'] as boolean,
      display_order: doc['display_order'] as number,
    }
  } catch (e) {
    console.error('[readWebsiteContent]', e)
    return null
  }
}

export async function writeWebsiteContent(
  sectionKey: string,
  value: string | Record<string, unknown> | Array<unknown>,
  contentType: WebsiteContentType = 'json'
) {
  const content_value = typeof value === 'string' ? value : JSON.stringify(value)
  const payload = { section_key: sectionKey, content_type: contentType, content_value, is_active: true, display_order: 0 }

  // check if exists
  const existing = await readWebsiteContent(sectionKey)
  if (existing?.id) {
    return databases.updateDocument(DATABASE_ID, COL, existing.id, payload)
  }
  return databases.createDocument(DATABASE_ID, COL, ID.unique(), payload)
}

export async function readWebsiteContentValue<T = unknown>(sectionKey: string, fallback?: T): Promise<T | undefined> {
  const entry = await readWebsiteContent(sectionKey)
  if (!entry) return fallback
  if (entry.content_type === 'json') {
    try { return JSON.parse(entry.content_value) as T } catch { return fallback }
  }
  return entry.content_value as T
}

export async function readWebsiteContentJson<T = unknown>(sectionKey: string, fallback?: T): Promise<T | undefined> {
  return readWebsiteContentValue<T>(sectionKey, fallback)
}

export async function writeWebsiteContentJson(sectionKey: string, value: Record<string, unknown> | Array<unknown>) {
  return writeWebsiteContent(sectionKey, value, 'json')
}

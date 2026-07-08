import { supabase } from '@/app/lib/supabaseClient.js'

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
  if (typeof window === 'undefined' || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('website_content')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Failed to load website content:', error)
      return null
    }
    if (!data) {
      return null
    }
    return data as WebsiteContentEntry
  } catch (error) {
    console.error('Failed to load website content:', error)
    return null
  }
}

export async function writeWebsiteContent(sectionKey: string, value: string | Record<string, unknown> | Array<unknown>, contentType: WebsiteContentType = 'json') {
  if (typeof window === 'undefined' || !supabase) {
    throw new Error('Supabase client is not initialized in the browser.')
  }

  const contentValue = typeof value === 'string' ? value : JSON.stringify(value)
  const payload = {
    section_key: sectionKey,
    content_type: contentType,
    content_value: contentValue,
    is_active: true,
    display_order: 0,
  }

  const { data, error } = await supabase.from('website_content').upsert(payload, { onConflict: 'section_key' })
  if (error) {
    console.error('Failed to save website content:', error)
    throw new Error(error.message || 'Unable to save website content.')
  }
  return data
}

export async function readWebsiteContentValue<T = unknown>(sectionKey: string, fallback?: T): Promise<T | undefined> {
  const entry = await readWebsiteContent(sectionKey)
  if (!entry) return fallback

  if (entry.content_type === 'json') {
    try {
      return JSON.parse(entry.content_value) as T
    } catch {
      return fallback
    }
  }

  return entry.content_value as T
}

export async function readWebsiteContentJson<T = unknown>(sectionKey: string, fallback?: T): Promise<T | undefined> {
  return readWebsiteContentValue<T>(sectionKey, fallback)
}

export async function writeWebsiteContentJson(sectionKey: string, value: Record<string, unknown> | Array<unknown>) {
  return writeWebsiteContent(sectionKey, value, 'json')
}

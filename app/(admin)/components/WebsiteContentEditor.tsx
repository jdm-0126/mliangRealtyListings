'use client'

import { useEffect, useMemo, useState } from 'react'
import { readWebsiteContentJson, writeWebsiteContentJson } from '@/lib/websiteContent'
import { WEBSITE_SECTIONS } from '@/lib/websiteContentSections'

interface WebsiteContentEditorProps {
  title: string
  sectionKey: string
  initialValue?: Record<string, unknown> | Array<unknown>
  description?: string
  defaultOpen?: boolean
}

export default function WebsiteContentEditor({
  title,
  sectionKey,
  initialValue,
  description,
  defaultOpen = true,
}: WebsiteContentEditorProps) {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    let active = true
    const load = async () => {
      const current = await readWebsiteContentJson(sectionKey, initialValue)
      if (active) {
        setValue(typeof current === 'string' ? current : JSON.stringify(current ?? initialValue ?? {}, null, 2))
        setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [sectionKey, initialValue])

  const save = async () => {
    setIsSaving(true)
    setStatus(null)

    try {
      const parsed = JSON.parse(value)
      await writeWebsiteContentJson(sectionKey, parsed)
      setStatus({ type: 'success', message: `${title} saved successfully.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please enter valid JSON for this section.'
      setStatus({ type: 'error', message })
    } finally {
      setIsSaving(false)
    }
  }

  const preview = useMemo(() => {
    if (!value.trim()) return 'No content yet.'
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }, [value])

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description ? <p className="text-xs text-gray-500">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-200 p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-48 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs"
            spellCheck={false}
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">Stored in Appwrite via the website_content collection.</p>
            <div className="flex items-center gap-2">
              {status ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {status.message}
                </span>
              ) : null}
              <button
                onClick={save}
                disabled={loading || isSaving}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Loading…' : isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{preview}</pre>
        </div>
      )}
    </div>
  )
}

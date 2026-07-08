'use client'

import { useEffect, useMemo, useState } from 'react'
import { readWebsiteContentJson, writeWebsiteContentJson } from '@/lib/websiteContent'
import { WEBSITE_SECTIONS } from '@/lib/websiteContentSections'

interface WebsiteContentEditorProps {
  title: string
  sectionKey: string
  initialValue?: Record<string, unknown> | Array<unknown>
  description?: string
}

export default function WebsiteContentEditor({
  title,
  sectionKey,
  initialValue,
  description,
}: WebsiteContentEditorProps) {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
    try {
      const parsed = JSON.parse(value)
      await writeWebsiteContentJson(sectionKey, parsed)
      alert(`${title} saved successfully.`)
    } catch {
      alert('Please enter valid JSON for this section.')
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        className="min-h-48 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs"
        spellCheck={false}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">Stored in Supabase via the website_content table.</p>
        <button onClick={save} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
          {loading ? 'Loading…' : 'Save'}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{preview}</pre>
    </div>
  )
}

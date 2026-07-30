// lib/shared/components/property/PropertyExcelImport.tsx

'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PropertyExcelImportProps {
  columns: string[]
  onImport: (values: Record<string, any>) => void
}

export default function PropertyExcelImport({
  columns,
  onImport,
}: PropertyExcelImportProps) {
  const [pasteData, setPasteData] = useState('')

  function parseExcelData() {
    if (!pasteData.trim()) return

    const values = pasteData.split('\t')

    const parsed: Record<string, any> = {}

    columns.forEach((column, index) => {
      if (!values[index]) return

      if (column.startsWith('$')) return

      parsed[column] = values[index].trim()
    })

    onImport(parsed)

    setPasteData('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Quick Import from Excel
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <textarea
          rows={5}
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          placeholder="Copy one row from Excel then paste it here..."
          className="w-full rounded-md border p-3 resize-none text-black"
        />

        <Button
          variant="outline"
          onClick={parseExcelData}
          disabled={!pasteData.trim()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import Row
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>✔ Supports Microsoft Excel</p>
          <p>✔ Supports Google Sheets</p>
          <p>✔ Supports LibreOffice Calc</p>
          <p>✔ Uses the current column order.</p>
        </div>
      </CardContent>
    </Card>
  )
}
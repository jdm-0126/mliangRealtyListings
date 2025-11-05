
'use client';
import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'

export default function Home() {
  const [data, setDatas] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({})
  const [editingRow, setEditingRow] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedNotes, setExpandedNotes] = useState<{[key: number]: boolean}>({})

  const fetchData = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('mlianglistings').select('*')
    if (error) console.error('Error:', error)
    else setDatas(data || [])
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSearch = search === '' || Object.values(row).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
      const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue) return true
        return String(row[column] || '').toLowerCase().includes(filterValue.toLowerCase())
      })
      return matchesSearch && matchesColumnFilters
    }).sort((a, b) => {
      const aVal = Number(a['Property ID']) || 0
      const bVal = Number(b['Property ID']) || 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [data, search, columnFilters, sortOrder])
  
  const { totalPages, startIndex, paginatedData } = useMemo(() => {
    const total = Math.ceil(filteredData.length / recordsPerPage)
    const start = (currentPage - 1) * recordsPerPage
    return {
      totalPages: total,
      startIndex: start,
      paginatedData: filteredData.slice(start, start + recordsPerPage)
    }
  }, [filteredData, recordsPerPage, currentPage])
  
  const handleColumnFilter = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }))
    setCurrentPage(1)
  }, [])

  const resetForm = useCallback(() => {
    setShowAddForm(false)
    setEditingRow(null)
    setFormData({})
  }, [])

  const handleCreate = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.from('mlianglistings').insert(formData)
    if (error) alert(`Error: ${error.message}`)
    else { resetForm(); fetchData() }
  }, [formData, fetchData, resetForm])

  const handleUpdate = useCallback(async () => {
    if (!supabase || !editingRow) return
    const { error } = await supabase
      .from('mlianglistings')
      .update(formData)
      .eq('Property ID', editingRow['Property ID'])
    if (error) alert(`Error: ${error.message}`)
    else { resetForm(); fetchData() }
  }, [formData, editingRow, fetchData, resetForm])

  const startEdit = useCallback((row: any) => {
    setEditingRow(row)
    setFormData({ ...row })
  }, [])

  const startAdd = useCallback(() => {
    setShowAddForm(true)
    setFormData({})
  }, [])

  const toggleNotes = useCallback((rowIndex: number) => {
    setExpandedNotes(prev => ({ ...prev, [rowIndex]: !prev[rowIndex] }))
  }, [])

  const handleFormChange = useCallback((key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const getRowText = useCallback((row: any) => 
    Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n'), [])

  const copyToClipboard = useCallback((row: any) => {
    navigator.clipboard.writeText(getRowText(row))
    alert('Details copied to clipboard!')
  }, [getRowText])

  const shareItem = useCallback((row: any) => {
    const text = getRowText(row)
    if (navigator.share) {
      navigator.share({ title: 'MLiang Listing', text })
    } else {
      copyToClipboard(row)
    }
  }, [getRowText, copyToClipboard])

  const renderPhotoCell = (val: any) => (
    val ? (
      <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        View Photos
      </a>
    ) : (
      <button
        onClick={() => window.location.href = '/upload'}
        className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
      >
        Upload Photos
      </button>
    )
  )

  const renderNotesCell = (val: any, index: number, expanded: boolean) => (
    <div>
      <button
        onClick={() => toggleNotes(index)}
        className="font-medium text-gray-600 text-sm flex items-center gap-1 mb-1"
      >
        Notes: {expanded ? '▼' : '▶'}
      </button>
      {expanded && (
        <div className="text-sm text-left whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border mt-2 leading-relaxed">
          {String(val)}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">🏠 MliangRealty</h1>
            <button onClick={startAdd} className="bg-green-500 text-white px-4 py-2 rounded text-sm font-medium">
              + Add Record
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mb-4 text-base"
          />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Show:</label>
              <select 
                value={recordsPerPage} 
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                className="p-2 border border-gray-300 rounded text-sm"
              >
                {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm">records</span>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Property ID {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <p className="mb-0 text-sm sm:text-base">
            Showing {startIndex + 1}-{Math.min(startIndex + recordsPerPage, filteredData.length)} of {filteredData.length} records ({data.length} total)
          </p>
        </div>
      </div>
      
      <main className="p-4 sm:p-6">
      
      {data.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No data found in mlianglistings table. Please add some records to your Supabase table.
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No results match your search.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {paginatedData.map((row, i) => (
              <div key={row['Property ID'] || i} className="border border-gray-300 rounded p-4 bg-white shadow-sm">
                {Object.entries(row).map(([key, val]) => (
                  <div key={key} className={key.toLowerCase() === 'notes' ? 'py-1 border-b border-gray-100 last:border-b-0' : 'flex justify-between py-1 border-b border-gray-100 last:border-b-0'}>
                    {key.toLowerCase() === 'notes' ? (
                      renderNotesCell(val, i, expandedNotes[i])
                    ) : (
                      <>
                        <span className="font-medium text-gray-600 text-sm">{key}:</span>
                        <span className="text-sm text-right ml-2">
                          {key.toLowerCase() === 'photos' ? renderPhotoCell(val) : String(val)}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => startEdit(row)}
                    className="flex-1 bg-orange-500 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => copyToClipboard(row)}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => shareItem(row)}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="border-collapse border border-gray-400 w-full min-w-full">
              <thead>
                <tr>
                  {data[0] && Object.keys(data[0]).map((key) => (
                    <th key={key} className="border border-gray-300 p-2 bg-gray-50 text-left whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-medium">{key}</div>
                        <input
                          type="text"
                          placeholder={`Filter ${key}...`}
                          value={columnFilters[key] || ''}
                          onChange={(e) => handleColumnFilter(key, e.target.value)}
                          className="w-full p-1 text-xs border border-gray-200 rounded"
                        />
                      </div>
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 bg-gray-50 text-left whitespace-nowrap">
                    <div className="font-medium">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={row['Property ID'] || i} className="hover:bg-gray-50">
                    {Object.entries(row).map(([key, val], j) => (
                      <td key={j} className="border border-gray-300 p-2 whitespace-nowrap">
                        {key.toLowerCase() === 'photos' ? renderPhotoCell(val) : String(val)}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(row)}
                        className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + recordsPerPage, filteredData.length)} of {filteredData.length} records
            </div>
          </div>
        </>
      )}
      
      {/* Form Modal */}
      {(showAddForm || editingRow) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingRow ? 'Edit Record' : 'Add New Record'}
            </h2>
            <div className="space-y-3">
              {data[0] && Object.keys(data[0]).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{key}</label>
                  {key.toLowerCase() === 'notes' ? (
                    <textarea
                      value={formData[key] || ''}
                      onChange={(e) => handleFormChange(key, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-vertical"
                      placeholder="Enter notes..."
                    />
                  ) : (
                    <input
                      type={key.toLowerCase().includes('id') ? 'number' : 'text'}
                      value={formData[key] || ''}
                      onChange={(e) => handleFormChange(key, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={editingRow ? handleUpdate : handleCreate}
                className="flex-1 bg-blue-500 text-white py-2 rounded"
              >
                {editingRow ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} className="flex-1 bg-gray-500 text-white py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  )
}

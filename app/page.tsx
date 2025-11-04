
'use client'
import { createClient } from '@/utils/supabase/server'


import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function Home() {
  const [data, setDatas] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching data...')
      const { data, error } = await supabase.from('mlianglistings').select('*')
      console.log('Response:', { data, error })
      if (error) console.error('Error:', error)
      else {
        console.log('Data received:', data)
        setDatas(data || [])
      }
    }
    fetchData()
  }, [])

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  )

  const copyToClipboard = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n')
    navigator.clipboard.writeText(text)
    alert('Details copied to clipboard!')
  }

  const shareItem = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n')
    if (navigator.share) {
      navigator.share({ title: 'MLiang Listing', text })
    } else {
      copyToClipboard(row)
    }
  }

  return (
    <>
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">📊 MLiang Listings</h1>
          
          <input
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mb-4 text-base"
          />
          
          <p className="mb-0 text-sm sm:text-base">Records found: {filteredData.length} of {data.length}</p>
        </div>
      </div>
      
      <main className="p-4 sm:p-6">
      
      {data.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No data found in mlianglistings table. Please add some records to your Supabase table.
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No results match your search.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {filteredData.map((row, i) => (
              <div key={i} className="border border-gray-300 rounded p-4 bg-white shadow-sm">
                {Object.entries(row).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-600 text-sm">{key}:</span>
                    <span className="text-sm text-right ml-2">
                      {key.toLowerCase() === 'photos' && val ? (
                        <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          View all in Google Photos
                        </a>
                      ) : (
                        String(val)
                      )}
                    </span>
                  </div>
                ))}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
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
                    <th key={key} className="border border-gray-300 p-2 bg-gray-50 text-left whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {Object.entries(row).map(([key, val], j) => (
                      <td key={j} className="border border-gray-300 p-2 whitespace-nowrap">
                        {key.toLowerCase() === 'photos' && val ? (
                          <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            View Photos
                          </a>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </main>
    </>
  )
}

'use client'

interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  // Build page list with ellipsis
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1)
        acc.push('…')
      acc.push(p)
      return acc
    }, [])

  const base = 'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
  const inactive = `${base} bg-white border-gray-400 text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700`
  const active   = `${base} bg-blue-600 border-blue-600 text-white cursor-default`
  const disabled = `${base} bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60`

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={currentPage === 1 ? disabled : inactive}
        title="First page"
      >«</button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={currentPage === 1 ? disabled : inactive}
        title="Previous page"
      >‹ Prev</button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-500 select-none">…</span>
          : <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={currentPage === p ? active : inactive}
            >{p}</button>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={currentPage === totalPages ? disabled : inactive}
        title="Next page"
      >Next ›</button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={currentPage === totalPages ? disabled : inactive}
        title="Last page"
      >»</button>
    </div>
  )
}

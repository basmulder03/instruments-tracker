import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_DEFAULT = 25

/**
 * usePagination — slices an array and exposes page controls.
 *
 * Usage:
 *   const { page, paged, PaginationBar } = usePagination(items, 25)
 *   // render paged instead of items in the table body
 *   // render <PaginationBar /> below the table
 */
export function usePagination<T>(items: T[], pageSize = PAGE_SIZE_DEFAULT) {
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the item list changes (e.g. after a search)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  )

  function prev() { setPage((p) => Math.max(1, p - 1)) }
  function next() { setPage((p) => Math.min(totalPages, p + 1)) }

  const start = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, items.length)

  function PaginationBar() {
    if (items.length <= pageSize) return null
    return (
      <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
        <span>
          {start}–{end} of {items.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prev} disabled={safePage <= 1}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="tabular-nums px-1">
            {safePage} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={next} disabled={safePage >= totalPages}>
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    )
  }

  return { page: safePage, paged, PaginationBar }
}

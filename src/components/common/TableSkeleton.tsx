import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

interface TableSkeletonProps {
  /** Number of columns — determines colSpan and skeleton widths */
  cols: number
  /** Number of skeleton rows to render (default 5) */
  rows?: number
}

/**
 * Drop-in loading skeleton for any shadcn Table.
 * Renders `rows` placeholder <TableRow>s with animated skeletons.
 */
export function TableSkeleton({ cols, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <TableRow key={ri}>
          {Array.from({ length: cols }).map((_, ci) => (
            <TableCell key={ci}>
              <Skeleton
                className="h-4"
                style={{ width: ci === 0 ? '6rem' : ci === cols - 1 ? '2rem' : '100%' }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SortDir } from '@/hooks/useSorting'

interface SortableHeadProps {
  label: string
  /** The sort direction for this column; null = unsorted */
  dir: SortDir | undefined
  onClick: () => void
  className?: string
}

/**
 * A <TableHead> that shows a sort direction indicator and is clickable.
 * Pass `dir={undefined}` (or omit it) for non-sortable columns — renders
 * a plain header with no icon.
 */
export function SortableHead({ label, dir, onClick, className }: SortableHeadProps) {
  const Icon =
    dir === 'asc' ? ChevronUp : dir === 'desc' ? ChevronDown : ChevronsUpDown

  return (
    <TableHead
      className={cn('cursor-pointer select-none whitespace-nowrap', className)}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className="size-3.5 text-muted-foreground shrink-0" />
      </span>
    </TableHead>
  )
}

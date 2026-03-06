import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, History, Download } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { listAllMaintenance, type MaintenanceWithId } from '@/features/operations/services/maintenanceService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { format, parseISO } from 'date-fns'
import { downloadCsv } from '@/lib/csvExport'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { SortableHead } from '@/components/common/SortableHead'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'

export const Route = createFileRoute('/_authenticated/maintenance/')({
  component: MaintenancePage,
})

type SortKey = 'id' | 'instrument' | 'category' | 'cost' | 'performedAt'

function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'PP') } catch { return iso }
}

function MaintenancePage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const CATEGORY_LABEL: Record<string, string> = {
    PADS: t('maintenance.cat.pads'),
    OVERHAUL: t('maintenance.cat.overhaul'),
    ADJUSTMENT: t('maintenance.cat.adjustment'),
    CLEANING: t('maintenance.cat.cleaning'),
    REPAIR_OTHER: t('maintenance.cat.repair'),
  }

  const { data: records = [], isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: listAllMaintenance })
  const { data: instruments = [] } = useQuery({ queryKey: ['instruments'], queryFn: listInstruments })

  const instrMap = Object.fromEntries(instruments.map((i) => [i.id, i.data.naam]))

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.id.toLowerCase().includes(q) ||
      (instrMap[r.data.instrumentId] ?? '').toLowerCase().includes(q) ||
      (CATEGORY_LABEL[r.data.category] ?? r.data.category).toLowerCase().includes(q)
    )
  })

  const getValue = useCallback((r: MaintenanceWithId, key: SortKey) => {
    if (key === 'id') return r.id
    if (key === 'instrument') return instrMap[r.data.instrumentId] ?? r.data.instrumentId
    if (key === 'category') return r.data.category
    if (key === 'cost') return r.data.cost
    if (key === 'performedAt') return r.data.performedAt ?? ''
    return ''
  }, [instrMap])

  const { sortState, sorted, onSort } = useSorting<MaintenanceWithId, SortKey>(
    filtered, getValue, 'performedAt', 'desc',
  )

  const { paged, PaginationBar } = usePagination(sorted)

  function handleExport() {
    const headers = ['ID', 'Instrument', 'Category', 'Cost', 'Major', 'Performed', 'Notes']
    const rows = records.map((r) => [
      r.id,
      instrMap[r.data.instrumentId] ?? r.data.instrumentId,
      CATEGORY_LABEL[r.data.category] ?? r.data.category,
      r.data.cost,
      r.data.isMajor ? 'Yes' : 'No',
      r.data.performedAt,
      r.data.notes,
    ])
    downloadCsv('maintenance.csv', [headers, ...rows])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('maintenance.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('maintenance.subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
          <Download className="mr-2 size-4" />
          {t('common.exportCsv')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('maintenance.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label={t('common.id')} dir={sortState.key === 'id' ? sortState.dir : null} onClick={() => onSort('id')} />
              <SortableHead label={t('maintenance.col.instrument')} dir={sortState.key === 'instrument' ? sortState.dir : null} onClick={() => onSort('instrument')} />
              <SortableHead label={t('maintenance.col.category')} dir={sortState.key === 'category' ? sortState.dir : null} onClick={() => onSort('category')} />
              <SortableHead label={t('maintenance.col.cost')} dir={sortState.key === 'cost' ? sortState.dir : null} onClick={() => onSort('cost')} />
              <TableHead>{t('maintenance.col.major')}</TableHead>
              <SortableHead label={t('maintenance.col.performed')} dir={sortState.key === 'performedAt' ? sortState.dir : null} onClick={() => onSort('performedAt')} />
              <TableHead>{t('common.notes')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={8} />
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {search ? t('maintenance.empty.search') : t('maintenance.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                  <TableCell>
                    <Link
                      to="/instruments/$instrumentId"
                      params={{ instrumentId: r.data.instrumentId }}
                      className="hover:underline font-medium"
                    >
                      {instrMap[r.data.instrumentId] ?? r.data.instrumentId}
                    </Link>
                  </TableCell>
                  <TableCell>{CATEGORY_LABEL[r.data.category] ?? r.data.category}</TableCell>
                  <TableCell>€{r.data.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    {r.data.isMajor && <Badge variant="destructive" className="text-xs">{t('maintenance.badge.major')}</Badge>}
                  </TableCell>
                  <TableCell>{fmtDate(r.data.performedAt)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {r.data.notes || '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/instruments/$instrumentId" params={{ instrumentId: r.data.instrumentId }}>
                        <History className="size-4" />
                        <span className="sr-only">{t('maintenance.viewHistoryLabel')}</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar />
    </div>
  )
}

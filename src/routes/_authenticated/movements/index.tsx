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
import { listMovements, type MovementWithId } from '@/features/operations/services/movementService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { listPeople } from '@/features/people/services/personService'
import { listLocations } from '@/features/locations/services/locationService'
import { format, parseISO } from 'date-fns'
import { downloadCsv } from '@/lib/csvExport'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { SortableHead } from '@/components/common/SortableHead'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'

export const Route = createFileRoute('/_authenticated/movements/')({
  component: MovementsPage,
})

type SortKey = 'id' | 'instrument' | 'person' | 'checkoutAt' | 'returnAt' | 'status'

function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'PP') } catch { return iso }
}

function MovementsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const { data: movements = [], isLoading } = useQuery({ queryKey: ['movements'], queryFn: listMovements })
  const { data: instruments = [] } = useQuery({ queryKey: ['instruments'], queryFn: listInstruments })
  const { data: people = [] } = useQuery({ queryKey: ['people'], queryFn: listPeople })
  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: listLocations })

  const instrMap = Object.fromEntries(instruments.map((i) => [i.id, i.data.naam]))
  const personMap = Object.fromEntries(people.map((p) => [p.id, p.data.naam]))
  const locationMap = Object.fromEntries(locations.map((l) => [l.id, l.data.naam]))

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.id.toLowerCase().includes(q) ||
      (instrMap[m.data.instrumentId] ?? '').toLowerCase().includes(q) ||
      (personMap[m.data.checkoutPersonId] ?? '').toLowerCase().includes(q)
    )
  })

  const getValue = useCallback((m: MovementWithId, key: SortKey) => {
    if (key === 'id') return m.id
    if (key === 'instrument') return instrMap[m.data.instrumentId] ?? m.data.instrumentId
    if (key === 'person') return personMap[m.data.checkoutPersonId] ?? m.data.checkoutPersonId
    if (key === 'checkoutAt') return m.data.checkoutAt ?? ''
    if (key === 'returnAt') return m.data.returnAt ?? ''
    if (key === 'status') return m.data.status
    return ''
  }, [instrMap, personMap])

  const { sortState, sorted, onSort } = useSorting<MovementWithId, SortKey>(
    filtered, getValue, 'checkoutAt', 'desc',
  )

  const { paged, PaginationBar } = usePagination(sorted)

  function handleExport() {
    const headers = ['ID', 'Instrument', 'Person', 'Checkout location', 'Checked out', 'Return location', 'Returned', 'Status', 'Notes']
    const rows = movements.map((m) => [
      m.id,
      instrMap[m.data.instrumentId] ?? m.data.instrumentId,
      personMap[m.data.checkoutPersonId] ?? m.data.checkoutPersonId,
      locationMap[m.data.checkoutLocationId] ?? m.data.checkoutLocationId,
      m.data.checkoutAt,
      m.data.returnLocationId ? (locationMap[m.data.returnLocationId] ?? m.data.returnLocationId) : '',
      m.data.returnAt ?? '',
      m.data.status,
      m.data.notes,
    ])
    downloadCsv('movements.csv', [headers, ...rows])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('movements.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('movements.subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={movements.length === 0}>
          <Download className="mr-2 size-4" />
          {t('common.exportCsv')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('movements.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label={t('common.id')} dir={sortState.key === 'id' ? sortState.dir : null} onClick={() => onSort('id')} />
              <SortableHead label={t('movements.col.instrument')} dir={sortState.key === 'instrument' ? sortState.dir : null} onClick={() => onSort('instrument')} />
              <SortableHead label={t('movements.col.person')} dir={sortState.key === 'person' ? sortState.dir : null} onClick={() => onSort('person')} />
              <SortableHead label={t('movements.col.checkedOut')} dir={sortState.key === 'checkoutAt' ? sortState.dir : null} onClick={() => onSort('checkoutAt')} />
              <SortableHead label={t('movements.col.returned')} dir={sortState.key === 'returnAt' ? sortState.dir : null} onClick={() => onSort('returnAt')} />
              <TableHead>{t('movements.col.returnLocation')}</TableHead>
              <SortableHead label={t('movements.col.status')} dir={sortState.key === 'status' ? sortState.dir : null} onClick={() => onSort('status')} />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={8} />
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {search ? t('movements.empty.search') : t('movements.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                  <TableCell>
                    <Link
                      to="/instruments/$instrumentId"
                      params={{ instrumentId: m.data.instrumentId }}
                      className="hover:underline font-medium"
                    >
                      {instrMap[m.data.instrumentId] ?? m.data.instrumentId}
                    </Link>
                  </TableCell>
                  <TableCell>{personMap[m.data.checkoutPersonId] ?? m.data.checkoutPersonId}</TableCell>
                  <TableCell>{fmtDate(m.data.checkoutAt)}</TableCell>
                  <TableCell>{fmtDate(m.data.returnAt)}</TableCell>
                  <TableCell>{m.data.returnLocationId ? (locationMap[m.data.returnLocationId] ?? m.data.returnLocationId) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={m.data.status === 'OPEN' ? 'default' : 'secondary'}>
                      {m.data.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/instruments/$instrumentId" params={{ instrumentId: m.data.instrumentId }}>
                        <History className="size-4" />
                        <span className="sr-only">{t('movements.viewHistoryLabel')}</span>
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, History, Download } from 'lucide-react'
import { useState } from 'react'
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
import { listMovements } from '@/features/operations/services/movementService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { listPeople } from '@/features/people/services/personService'
import { listLocations } from '@/features/locations/services/locationService'
import { format, parseISO } from 'date-fns'
import { downloadCsv } from '@/lib/csvExport'

export const Route = createFileRoute('/_authenticated/movements/')({
  component: MovementsPage,
})

function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'PP') } catch { return iso }
}

function MovementsPage() {
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
          <h1 className="text-2xl font-bold">Movements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All checkout and return transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={movements.length === 0}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search movements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Instrument</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Checked out</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Return location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {search ? 'No movements match your search.' : 'No movements yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
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
                        <span className="sr-only">View instrument history</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

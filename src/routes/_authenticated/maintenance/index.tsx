import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, History } from 'lucide-react'
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
import { listAllMaintenance } from '@/features/operations/services/maintenanceService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { format, parseISO } from 'date-fns'

export const Route = createFileRoute('/_authenticated/maintenance/')({
  component: MaintenancePage,
})

const CATEGORY_LABEL: Record<string, string> = {
  PADS: 'Pads',
  OVERHAUL: 'Overhaul',
  ADJUSTMENT: 'Adjustment',
  CLEANING: 'Cleaning',
  REPAIR_OTHER: 'Repair / Other',
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'PP') } catch { return iso }
}

function MaintenancePage() {
  const [search, setSearch] = useState('')

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All maintenance records across all instruments.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search maintenance…"
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
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Major</TableHead>
              <TableHead>Performed</TableHead>
              <TableHead>Notes</TableHead>
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
                  {search ? 'No records match your search.' : 'No maintenance records yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
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
                    {r.data.isMajor && <Badge variant="destructive" className="text-xs">Major</Badge>}
                  </TableCell>
                  <TableCell>{fmtDate(r.data.performedAt)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {r.data.notes || '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/instruments/$instrumentId" params={{ instrumentId: r.data.instrumentId }}>
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

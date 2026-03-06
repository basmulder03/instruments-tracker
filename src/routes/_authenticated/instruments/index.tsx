import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Can } from '@/contexts/AbilityContext'
import {
  listInstruments,
  deleteInstrument,
  type InstrumentWithId,
} from '@/features/instruments/services/instrumentService'
import { InstrumentDialog } from '@/features/instruments/components/InstrumentDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'

export const Route = createFileRoute('/_authenticated/instruments/')({
  component: InstrumentsPage,
})

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  IN_STORAGE: 'secondary',
  CHECKED_OUT: 'default',
  IN_REPAIR: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  IN_STORAGE: 'In storage',
  CHECKED_OUT: 'Checked out',
  IN_REPAIR: 'In repair',
}

function InstrumentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InstrumentWithId | null>(null)
  const [deleting, setDeleting] = useState<InstrumentWithId | null>(null)

  const { data: instruments = [], isLoading } = useQuery({
    queryKey: ['instruments'],
    queryFn: listInstruments,
  })

  const filtered = instruments.filter((i) => {
    const q = search.toLowerCase()
    return (
      i.data.naam.toLowerCase().includes(q) ||
      i.data.type.toLowerCase().includes(q) ||
      i.data.merk.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    )
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['instruments'] })
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteInstrument(deleting.id)
    setDeleting(null)
    invalidate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instruments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the instrument inventory.
          </p>
        </div>
        <Can I="create" a="Instrument">
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="mr-2 size-4" />
            Add instrument
          </Button>
        </Can>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search instruments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? 'No instruments match your search.' : 'No instruments yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{ins.id}</TableCell>
                  <TableCell className="font-medium">{ins.data.naam}</TableCell>
                  <TableCell>{ins.data.type}</TableCell>
                  <TableCell>{ins.data.merk}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[ins.data.currentStatus] ?? 'secondary'}>
                      {STATUS_LABEL[ins.data.currentStatus] ?? ins.data.currentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Can I="update" a="Instrument">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(ins); setDialogOpen(true) }}>
                          <Pencil className="size-4" />
                        </Button>
                      </Can>
                      <Can I="delete" a="Instrument">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(ins)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InstrumentDialog
        instrument={editing ?? undefined}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSaved={invalidate}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title={`Delete "${deleting?.data.naam}"?`}
        description="This will permanently remove the instrument. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  )
}

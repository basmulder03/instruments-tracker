import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  listLocations,
  deleteLocation,
  type LocationWithId,
} from '@/features/locations/services/locationService'
import { LocationDialog } from '@/features/locations/components/LocationDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'

export const Route = createFileRoute('/_authenticated/locations/')({
  component: LocationsPage,
})

function LocationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LocationWithId | null>(null)
  const [deleting, setDeleting] = useState<LocationWithId | null>(null)

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: listLocations,
  })

  const filtered = locations.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.data.naam.toLowerCase().includes(q) ||
      l.data.adres.toLowerCase().includes(q)
    )
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['locations'] })
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteLocation(deleting.id)
    setDeleting(null)
    invalidate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Physical storage locations for instruments.
          </p>
        </div>
        <Can I="create" a="Location">
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="mr-2 size-4" />
            Add location
          </Button>
        </Can>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search locations…"
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
              <TableHead>Address</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? 'No locations match your search.' : 'No locations yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.id}</TableCell>
                  <TableCell className="font-medium">{l.data.naam}</TableCell>
                  <TableCell className="text-muted-foreground">{l.data.adres}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{l.data.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Can I="update" a="Location">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(l); setDialogOpen(true) }}>
                          <Pencil className="size-4" />
                        </Button>
                      </Can>
                      <Can I="delete" a="Location">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(l)}>
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

      <LocationDialog
        location={editing ?? undefined}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSaved={invalidate}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title={`Delete "${deleting?.data.naam}"?`}
        description="This will permanently remove this location."
        onConfirm={handleDelete}
      />
    </div>
  )
}

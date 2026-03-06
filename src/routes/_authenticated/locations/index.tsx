import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
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
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { usePagination } from '@/hooks/usePagination'

export const Route = createFileRoute('/_authenticated/locations/')({
  component: LocationsPage,
})

function LocationsPage() {
  const { t } = useTranslation()
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

  const { paged, PaginationBar } = usePagination(filtered)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['locations'] })
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteLocation(deleting.id)
      toast.success(t('locations.toast.deleted', { name: deleting.data.naam }))
    } catch {
      toast.error(t('locations.toast.deleteError'))
    }
    setDeleting(null)
    invalidate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('locations.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('locations.subtitle')}
          </p>
        </div>
        <Can I="create" a="Location">
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="mr-2 size-4" />
            {t('locations.addButton')}
          </Button>
        </Can>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('locations.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.id')}</TableHead>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('locations.col.address')}</TableHead>
              <TableHead>{t('common.notes')}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? t('locations.empty.search') : t('locations.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((l) => (
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
      <PaginationBar />

      <LocationDialog
        location={editing ?? undefined}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSaved={invalidate}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title={t('locations.deleteTitle', { name: deleting?.data.naam })}
        description={t('locations.deleteDescription')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

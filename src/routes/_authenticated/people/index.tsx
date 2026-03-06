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
  listPeople,
  deletePerson,
  type PersonWithId,
} from '@/features/people/services/personService'
import { PersonDialog } from '@/features/people/components/PersonDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'

export const Route = createFileRoute('/_authenticated/people/')({
  component: PeoplePage,
})

function PeoplePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PersonWithId | null>(null)
  const [deleting, setDeleting] = useState<PersonWithId | null>(null)

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: listPeople,
  })

  const filtered = people.filter((p) =>
    p.data.naam.toLowerCase().includes(search.toLowerCase()),
  )

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['people'] })
  }

  async function handleDelete() {
    if (!deleting) return
    await deletePerson(deleting.id)
    setDeleting(null)
    invalidate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            People who can borrow instruments.
          </p>
        </div>
        <Can I="create" a="Person">
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="mr-2 size-4" />
            Add person
          </Button>
        </Can>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search people…"
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
              <TableHead>Notes</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {search ? 'No people match your search.' : 'No people yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.data.naam}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{p.data.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Can I="update" a="Person">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setDialogOpen(true) }}>
                          <Pencil className="size-4" />
                        </Button>
                      </Can>
                      <Can I="delete" a="Person">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(p)}>
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

      <PersonDialog
        person={editing ?? undefined}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSaved={invalidate}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title={`Delete "${deleting?.data.naam}"?`}
        description="This will permanently remove this person."
        onConfirm={handleDelete}
      />
    </div>
  )
}

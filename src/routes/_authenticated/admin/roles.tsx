import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/config/firebase'
import { Badge } from '@/components/ui/badge'
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
import type { Role } from '@/lib/types/users'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'
import { SortableHead } from '@/components/common/SortableHead'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { Can, useAbility } from '@/contexts/AbilityContext'
import { RoleDialog } from '@/features/users/components/RoleDialog'
import { deleteRole } from '@/features/users/services/roleService'

export const Route = createFileRoute('/_authenticated/admin/roles')({
  component: RolesPage,
})

interface RoleWithId {
  id: string
  data: Role
}

type SortKey = 'name' | 'description' | 'permCount'

async function listRoles(): Promise<RoleWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'roles'), orderBy('name')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Role }))
}

function RolesPage() {
  const { t } = useTranslation()
  const ability = useAbility()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleWithId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleWithId | null>(null)
  const [, setDeleting] = useState(false)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.data.name.toLowerCase().includes(q) ||
      r.data.description.toLowerCase().includes(q)
    )
  })

  const getValue = useCallback((r: RoleWithId, key: SortKey) => {
    if (key === 'name') return r.data.name
    if (key === 'description') return r.data.description
    if (key === 'permCount') return r.data.permissions.includes('*:*') ? Infinity : r.data.permissions.length
    return ''
  }, [])

  const { sortState, sorted, onSort } = useSorting<RoleWithId, SortKey>(
    filtered, getValue, 'name',
  )

  const { paged, PaginationBar } = usePagination(sorted)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRole(deleteTarget.id)
      toast.success(t('roles.toast.deleted', { name: deleteTarget.data.name }))
      invalidate()
      setDeleteTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('roles.toast.deleteError')
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('roles.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('roles.subtitle')}
          </p>
        </div>
        <Can I="create" a="Role">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t('roles.createButton')}
          </Button>
        </Can>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('roles.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label={t('roles.col.role')} dir={sortState.key === 'name' ? sortState.dir : null} onClick={() => onSort('name')} />
              <SortableHead label={t('roles.col.description')} dir={sortState.key === 'description' ? sortState.dir : null} onClick={() => onSort('description')} />
              <SortableHead label={t('roles.col.permissions')} dir={sortState.key === 'permCount' ? sortState.dir : null} onClick={() => onSort('permCount')} />
              <TableHead>{t('roles.col.type')}</TableHead>
              {(ability.can('update', 'Role') || ability.can('delete', 'Role')) && (
                <TableHead className="w-24">{t('common.actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? t('roles.empty.search') : t('roles.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.data.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">
                    {r.data.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {r.data.permissions.includes('*:*')
                        ? t('roles.badge.allPermissions')
                        : t('roles.badge.permCount', { n: r.data.permissions.length })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.data.isSystem ? (
                      <Badge variant="outline">{t('roles.badge.system')}</Badge>
                    ) : (
                      <Badge>{t('roles.badge.custom')}</Badge>
                    )}
                  </TableCell>
                  {(ability.can('update', 'Role') || ability.can('delete', 'Role')) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Can I="update" a="Role">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={r.data.isSystem}
                            aria-label={t('roles.editLabel', { name: r.data.name })}
                            onClick={() => setEditRole(r)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </Can>
                        <Can I="delete" a="Role">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={r.data.isSystem}
                            aria-label={t('roles.deleteLabel', { name: r.data.name })}
                            onClick={() => setDeleteTarget(r)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar />

      {/* Create dialog */}
      {createOpen && (
        <RoleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSaved={invalidate}
        />
      )}

      {/* Edit dialog */}
      {editRole && (
        <RoleDialog
          role={editRole}
          open={editRole !== null}
          onOpenChange={(open) => { if (!open) setEditRole(null) }}
          onSaved={() => { invalidate(); setEditRole(null) }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          title={t('roles.deleteTitle', { name: deleteTarget.data.name })}
          description={t('roles.deleteDescription')}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Search } from 'lucide-react'
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
import { listUsers, type UserWithId } from '@/features/users/services/userService'
import { InviteUserDialog } from '@/features/users/components/InviteUserDialog'
import { EditUserDialog } from '@/features/users/components/EditUserDialog'
import { SYSTEM_ROLES_MAP } from '@/lib/roles'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import { SortableHead } from '@/components/common/SortableHead'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
})

type SortKey = 'displayName' | 'email' | 'role' | 'status'

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
}

function UsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<UserWithId | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.data.displayName.toLowerCase().includes(q) ||
      u.data.email.toLowerCase().includes(q) ||
      u.data.role.toLowerCase().includes(q)
    )
  })

  const getValue = useCallback((u: UserWithId, key: SortKey) => {
    if (key === 'displayName') return u.data.displayName
    if (key === 'email') return u.data.email
    if (key === 'role') return SYSTEM_ROLES_MAP.get(u.data.role)?.data.name ?? u.data.role
    if (key === 'status') return u.data.status
    return ''
  }, [])

  const { sortState, sorted, onSort } = useSorting<UserWithId, SortKey>(
    filtered, getValue, 'displayName',
  )

  const { paged, PaginationBar } = usePagination(sorted)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('users.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>
        <Can I="invite" a="User">
          <InviteUserDialog onInvited={invalidate} />
        </Can>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label={t('users.col.name')} dir={sortState.key === 'displayName' ? sortState.dir : null} onClick={() => onSort('displayName')} />
              <SortableHead label={t('users.col.email')} dir={sortState.key === 'email' ? sortState.dir : null} onClick={() => onSort('email')} />
              <SortableHead label={t('users.col.role')} dir={sortState.key === 'role' ? sortState.dir : null} onClick={() => onSort('role')} />
              <SortableHead label={t('users.col.status')} dir={sortState.key === 'status' ? sortState.dir : null} onClick={() => onSort('status')} />
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? t('users.empty.search') : t('users.empty.data')}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((u) => {
                const roleName =
                  SYSTEM_ROLES_MAP.get(u.data.role)?.data.name ?? u.data.role
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.data.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.data.email}</TableCell>
                    <TableCell>{roleName}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[u.data.status] ?? 'secondary'}>
                        {u.data.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Can I="manage" a="User">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(u)}
                          aria-label={t('users.editLabel', { displayName: u.data.displayName })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar />

      {/* Edit dialog */}
      {editing && (
        <EditUserDialog
          user={editing}
          open={!!editing}
          onOpenChange={(open) => { if (!open) setEditing(null) }}
          onSaved={invalidate}
        />
      )}
    </div>
  )
}

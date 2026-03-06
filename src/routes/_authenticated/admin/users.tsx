import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
})

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
}

function UsersPage() {
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

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage who has access to Instruments Tracker.
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
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? 'No users match your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
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
                          aria-label={`Edit ${u.data.displayName}`}
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

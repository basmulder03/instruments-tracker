import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Role } from '@/lib/types/users'

export const Route = createFileRoute('/_authenticated/admin/roles')({
  component: RolesPage,
})

interface RoleWithId {
  id: string
  data: Role
}

async function listRoles(): Promise<RoleWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'roles'), orderBy('name')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Role }))
}

function RolesPage() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          System roles and their permission sets.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No roles found. Make sure system data has been seeded.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.data.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">
                    {r.data.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {r.data.permissions.includes('*:*')
                        ? 'all'
                        : `${r.data.permissions.length} permissions`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.data.isSystem ? (
                      <Badge variant="outline">System</Badge>
                    ) : (
                      <Badge>Custom</Badge>
                    )}
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

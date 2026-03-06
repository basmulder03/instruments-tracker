/**
 * Admin Privacy page (Phase 20)
 *
 * Two sections:
 *  1. Audit Log Retention — configure how many days audit entries are kept.
 *  2. User Data — per-user Export JSON / Anonymise / Hard-delete actions.
 *
 * Only visible to users with `manage Privacy` permission (i.e. super-admin / *:*).
 */
import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableSkeleton } from '@/components/common/TableSkeleton'
import {
  listUsers,
  getAuditRetentionConfig,
  setAuditRetentionConfig,
  exportUserData,
  anonymiseUser,
  hardDeleteUser,
  type UserWithId,
} from '@/features/users/services/userService'

export const Route = createFileRoute('/_authenticated/admin/privacy')({
  component: PrivacyPage,
})

// ---------------------------------------------------------------------------
// Retention section
// ---------------------------------------------------------------------------

function RetentionSection() {
  const { t } = useTranslation()
  const [days, setDays] = useState<number>(365)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['auditRetentionConfig'],
    queryFn: getAuditRetentionConfig,
  })

  useEffect(() => {
    if (config) setDays(config.retentionDays)
  }, [config])

  async function handleSave() {
    if (days < 1) {
      setError(t('privacy.retention.valid'))
      return
    }
    setError(null)
    setSaving(true)
    try {
      await setAuditRetentionConfig(days)
      toast.success(t('privacy.retention.toast'))
    } catch {
      toast.error(t('privacy.retention.toastError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('privacy.retention.title')}</CardTitle>
        <CardDescription>{t('privacy.retention.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4 max-w-xs">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="retention-days">{t('privacy.retention.label')}</Label>
            <Input
              id="retention-days"
              type="number"
              min={1}
              step={1}
              disabled={isLoading || saving}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button onClick={handleSave} disabled={isLoading || saving}>
            {saving ? t('privacy.retention.saving') : t('privacy.retention.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Confirm dialogs
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {/* common.cancel key always present */}
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Users section
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
}

function UsersSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  // Pending action state
  type ActionKind = 'anonymise' | 'delete'
  const [pending, setPending] = useState<{ user: UserWithId; kind: ActionKind } | null>(null)
  const [acting, setActing] = useState(false)

  async function handleExport(user: UserWithId) {
    try {
      const data = await exportUserData(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${user.id}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('privacy.users.exportToast', { name: user.data.displayName }))
    } catch {
      toast.error('Export failed.')
    }
  }

  async function handleConfirm() {
    if (!pending) return
    setActing(true)
    try {
      if (pending.kind === 'anonymise') {
        await anonymiseUser(pending.user.id)
        toast.success(t('privacy.users.anonymiseToast'))
      } else {
        await hardDeleteUser(pending.user.id)
        toast.success(t('privacy.users.deleteToast'))
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch {
      toast.error(
        pending.kind === 'anonymise'
          ? t('privacy.users.anonymiseToastError')
          : t('privacy.users.deleteToastError'),
      )
    } finally {
      setActing(false)
      setPending(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('privacy.users.title')}</CardTitle>
        <CardDescription>{t('privacy.users.description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t('privacy.users.empty')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('privacy.users.col.name')}</TableHead>
                <TableHead>{t('privacy.users.col.email')}</TableHead>
                <TableHead>{t('privacy.users.col.status')}</TableHead>
                <TableHead className="text-right">{t('privacy.users.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.data.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.data.email}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[user.data.status] ?? 'secondary'}>
                      {user.data.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(user)}
                        aria-label={t('privacy.users.export')}
                      >
                        <Download className="size-3.5 mr-1" />
                        {t('privacy.users.export')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPending({ user, kind: 'anonymise' })}
                        aria-label={t('privacy.users.anonymise')}
                      >
                        <ShieldOff className="size-3.5 mr-1" />
                        {t('privacy.users.anonymise')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPending({ user, kind: 'delete' })}
                        aria-label={t('privacy.users.delete')}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        {t('privacy.users.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Confirm dialogs */}
      {pending?.kind === 'anonymise' && (
        <ConfirmDialog
          open
          title={t('privacy.users.anonymiseTitle', { name: pending.user.data.displayName })}
          description={t('privacy.users.anonymiseDescription')}
          confirmLabel={acting ? t('common.saving') : t('privacy.users.anonymiseConfirm')}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === 'delete' && (
        <ConfirmDialog
          open
          destructive
          title={t('privacy.users.deleteTitle', { name: pending.user.data.displayName })}
          description={t('privacy.users.deleteDescription')}
          confirmLabel={acting ? t('common.saving') : t('privacy.users.deleteConfirm')}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('privacy.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('privacy.subtitle')}</p>
      </div>

      <RetentionSection />
      <UsersSection />
    </div>
  )
}

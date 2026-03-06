import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { updateUserRoleAndPermissions, setUserStatus } from '@/features/users/services/userService'
import { SYSTEM_ROLES } from '@/lib/roles'
import { SYSTEM_PERMISSIONS } from '@/lib/permissions'
import type { UserWithId } from '@/features/users/services/userService'

// Group permissions by category for the matrix UI
const PERMISSION_GROUPS = Array.from(
  SYSTEM_PERMISSIONS.reduce((map, p) => {
    const group = map.get(p.data.category) ?? []
    group.push(p)
    map.set(p.data.category, group)
    return map
  }, new Map<string, typeof SYSTEM_PERMISSIONS>()),
)

interface EditUserDialogProps {
  user: UserWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onSaved }: EditUserDialogProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const schema = z.object({
    role: z.string().min(1, t('editUserDialog.validRole')),
    permissions: z.array(z.string()),
    status: z.enum(['active', 'inactive', 'suspended']),
  })
  type FormValues = z.infer<typeof schema>

  const STATUS_OPTIONS: { value: 'active' | 'inactive' | 'suspended'; label: string }[] = [
    { value: 'active', label: t('editUserDialog.statusActive') },
    { value: 'inactive', label: t('editUserDialog.statusInactive') },
    { value: 'suspended', label: t('editUserDialog.statusSuspended') },
  ]

  const CATEGORY_LABELS: Record<string, string> = {
    masterData: t('editUserDialog.cat.masterData'),
    operations: t('editUserDialog.cat.operations'),
    analytics: t('editUserDialog.cat.analytics'),
    admin: t('editUserDialog.cat.admin'),
    system: t('editUserDialog.cat.system'),
  }

  const form = useForm<FormValues>({
    defaultValues: {
      role: user.data.role,
      permissions: user.data.permissions,
      status: user.data.status,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        await updateUserRoleAndPermissions(user.id, parsed.role, parsed.permissions)
        if (parsed.status !== user.data.status) {
          await setUserStatus(user.id, parsed.status)
        }
        toast.success(t('editUserDialog.toast'))
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('editUserDialog.toastError')
        setError(msg)
        toast.error(msg)
      }
    },
  })

  // When role changes, preset permissions to the role defaults
  function handleRoleChange(role: string, fieldChange: (v: string) => void, permChange: (v: string[]) => void) {
    fieldChange(role)
    const roleData = SYSTEM_ROLES.find((r) => r.id === role)
    if (roleData) {
      permChange(roleData.data.permissions)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('editUserDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editUserDialog.description', {
              displayName: user.data.displayName,
              email: user.data.email,
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-4 overflow-hidden"
        >
          {error && (
            <Alert variant="destructive" className="text-sm shrink-0">
              {error}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 shrink-0">
            {/* Role */}
            <form.Field name="role">
              {(roleField) => (
                <form.Field name="permissions">
                  {(permField) => (
                    <div className="space-y-1.5">
                      <Label>{t('editUserDialog.role')}</Label>
                      <Select
                        value={roleField.state.value}
                        onValueChange={(v) =>
                          handleRoleChange(v, roleField.handleChange, permField.handleChange)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYSTEM_ROLES.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.data.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              )}
            </form.Field>

            {/* Status */}
            <form.Field name="status">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>{t('editUserDialog.status')}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as 'active' | 'inactive' | 'suspended')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          {/* Permission matrix */}
          <form.Field name="permissions">
            {(field) => {
              const selected = new Set(field.state.value)

              function toggle(permId: string) {
                const next = new Set(selected)
                if (next.has(permId)) {
                  next.delete(permId)
                } else {
                  next.add(permId)
                }
                field.handleChange(Array.from(next))
              }

              return (
                <div className="space-y-1.5 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2">
                    <Label>{t('editUserDialog.permissions')}</Label>
                    <Badge variant="secondary" className="text-xs">
                      {selected.has('*:*') ? 'all' : selected.size}
                    </Badge>
                  </div>
                  <ScrollArea className="flex-1 rounded-md border p-3 h-64">
                    <div className="space-y-4">
                      {PERMISSION_GROUPS.map(([category, perms]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {CATEGORY_LABELS[category] ?? category}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {perms.map((p) => (
                              <label
                                key={p.id}
                                className="flex items-center gap-2 cursor-pointer group"
                              >
                                <Checkbox
                                  checked={selected.has(p.id) || selected.has('*:*')}
                                  onCheckedChange={() => toggle(p.id)}
                                  disabled={selected.has('*:*')}
                                />
                                <span className="text-xs group-hover:text-foreground text-muted-foreground">
                                  {p.data.description}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )
            }}
          </form.Field>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('editUserDialog.submitting') : t('editUserDialog.submit')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

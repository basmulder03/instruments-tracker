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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createRole, updateRole } from '@/features/users/services/roleService'
import type { RoleWithId } from '@/features/users/services/roleService'
import { SYSTEM_PERMISSIONS } from '@/lib/permissions'

// Group permissions by category once (module-level, stable reference)
const PERMISSION_GROUPS = Array.from(
  SYSTEM_PERMISSIONS.reduce((map, p) => {
    const group = map.get(p.data.category) ?? []
    group.push(p)
    map.set(p.data.category, group)
    return map
  }, new Map<string, typeof SYSTEM_PERMISSIONS>()),
)

interface RoleDialogProps {
  /** When provided, dialog is in edit mode; when undefined, it is in create mode. */
  role?: RoleWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function RoleDialog({ role, open, onOpenChange, onSaved }: RoleDialogProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const isEdit = role !== undefined

  const schema = z.object({
    name: z.string().min(1, t('roleDialog.validName')),
    description: z.string().min(1, t('roleDialog.validDescription')),
    permissions: z.array(z.string()).min(1, t('roleDialog.validPermissions')),
  })
  type FormValues = z.infer<typeof schema>

  const CATEGORY_LABELS: Record<string, string> = {
    masterData: t('editUserDialog.cat.masterData'),
    operations: t('editUserDialog.cat.operations'),
    analytics: t('editUserDialog.cat.analytics'),
    admin: t('editUserDialog.cat.admin'),
    system: t('editUserDialog.cat.system'),
  }

  const form = useForm<FormValues>({
    defaultValues: {
      name: role?.data.name ?? '',
      description: role?.data.description ?? '',
      permissions: role?.data.permissions ?? [],
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        if (isEdit) {
          await updateRole(role.id, parsed)
          toast.success(t('roleDialog.toastUpdated'))
        } else {
          await createRole(parsed)
          toast.success(t('roleDialog.toastCreated'))
        }
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('roleDialog.toastError')
        setError(msg)
        toast.error(msg)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('roleDialog.titleEdit') : t('roleDialog.titleCreate')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('roleDialog.descriptionEdit') : t('roleDialog.descriptionCreate')}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col min-h-0 flex-1"
        >
          {/* Scrollable body */}
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
            {error && (
              <Alert variant="destructive" className="text-sm">
                {error}
              </Alert>
            )}

            {/* Name */}
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>{t('roleDialog.name')}</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('roleDialog.namePlaceholder')}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>{t('roleDialog.description')}</Label>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('roleDialog.descriptionPlaceholder')}
                    rows={2}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

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
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label>{t('roleDialog.permissions')}</Label>
                      <Badge variant="secondary" className="text-xs">
                        {selected.size}
                      </Badge>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                    <div className="rounded-md border p-3 space-y-4">
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
                                  checked={selected.has(p.id)}
                                  onCheckedChange={() => toggle(p.id)}
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
                  </div>
                )
              }}
            </form.Field>
          </div>

          {/* Pinned footer */}
          <DialogFooter className="pt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t('roleDialog.submitting')
                    : isEdit
                      ? t('roleDialog.submitEdit')
                      : t('roleDialog.submitCreate')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

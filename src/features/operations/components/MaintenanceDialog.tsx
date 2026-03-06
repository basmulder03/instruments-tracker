/**
 * MaintenanceDialog — log a maintenance record for an instrument.
 * Supports both create (new record) and edit (update existing record).
 */
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  createMaintenance,
  updateMaintenance,
  type MaintenanceInput,
  type MaintenanceWithId,
} from '@/features/operations/services/maintenanceService'
import { useAuth } from '@/contexts/AuthContext'

type Category = 'PADS' | 'OVERHAUL' | 'ADJUSTMENT' | 'CLEANING' | 'REPAIR_OTHER'

interface MaintenanceDialogProps {
  instrumentId: string
  instrumentName: string
  record?: MaintenanceWithId   // undefined = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function MaintenanceDialog({
  instrumentId,
  instrumentName,
  record,
  open,
  onOpenChange,
  onSaved,
}: MaintenanceDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser, currentUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!record

  const schema = z.object({
    instrumentId: z.string().min(1),
    category: z.enum(['PADS', 'OVERHAUL', 'ADJUSTMENT', 'CLEANING', 'REPAIR_OTHER']),
    cost: z.coerce.number().min(0, t('maintenanceDialog.validCost')),
    isMajor: z.boolean(),
    performedAt: z.string().min(1, t('maintenanceDialog.validDate')),
    notes: z.string(),
  })

  type FormValues = z.infer<typeof schema>

  const CATEGORIES: { value: Category; label: string }[] = [
    { value: 'PADS', label: t('maintenanceDialog.cat.pads') },
    { value: 'OVERHAUL', label: t('maintenanceDialog.cat.overhaul') },
    { value: 'ADJUSTMENT', label: t('maintenanceDialog.cat.adjustment') },
    { value: 'CLEANING', label: t('maintenanceDialog.cat.cleaning') },
    { value: 'REPAIR_OTHER', label: t('maintenanceDialog.cat.repair') },
  ]

  const form = useForm<FormValues>({
    defaultValues: record
      ? { ...record.data }
      : {
          instrumentId,
          category: 'PADS' as Category,
          cost: 0,
          isMajor: false,
          performedAt: todayISO(),
          notes: '',
        },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        const uid = firebaseUser!.uid
        const email = currentUser?.email ?? firebaseUser!.email ?? ''

        const input: MaintenanceInput = { ...parsed }

        if (isEdit) {
          await updateMaintenance(record.id, input, uid, email)
        } else {
          await createMaintenance(input, uid, email)
        }

        toast.success(isEdit ? t('maintenanceDialog.toastUpdated') : t('maintenanceDialog.toastCreated'))
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save.'
        setError(msg)
        toast.error(msg)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('maintenanceDialog.titleEdit', { instrumentName })
              : t('maintenanceDialog.titleCreate', { instrumentName })}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          {/* Category */}
          <form.Field name="category">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('maintenanceDialog.category')}</Label>
                <Select
                  value={f.state.value}
                  onValueChange={(v) => f.handleChange(v as Category)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Cost */}
            <form.Field name="cost">
              {(f) => (
                <div className="space-y-1.5">
                  <Label>{t('maintenanceDialog.cost')}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value as unknown as number)}
                    onBlur={f.handleBlur}
                  />
                  {f.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Performed at */}
            <form.Field name="performedAt">
              {(f) => (
                <div className="space-y-1.5">
                  <Label>{t('maintenanceDialog.performedOn')}</Label>
                  <Input
                    type="date"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  {f.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* isMajor */}
          <form.Field name="isMajor">
            {(f) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isMajor"
                  checked={f.state.value}
                  onCheckedChange={(checked) => f.handleChange(!!checked)}
                />
                <Label htmlFor="isMajor" className="cursor-pointer">
                  {t('maintenanceDialog.majorLabel')}
                </Label>
              </div>
            )}
          </form.Field>

          {/* Notes */}
          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('maintenanceDialog.notesLabel')}</Label>
                <Textarea
                  rows={3}
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t('maintenanceDialog.submitting')
                    : isEdit
                      ? t('maintenanceDialog.submitEdit')
                      : t('maintenanceDialog.submitCreate')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

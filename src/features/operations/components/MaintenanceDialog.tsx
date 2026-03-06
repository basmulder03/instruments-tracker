/**
 * MaintenanceDialog — log a maintenance record for an instrument.
 * Supports both create (new record) and edit (update existing record).
 */
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
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

const CATEGORIES = [
  { value: 'PADS', label: 'Pads' },
  { value: 'OVERHAUL', label: 'Overhaul' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'REPAIR_OTHER', label: 'Repair / Other' },
] as const

type Category = typeof CATEGORIES[number]['value']

const schema = z.object({
  instrumentId: z.string().min(1),
  category: z.enum(['PADS', 'OVERHAUL', 'ADJUSTMENT', 'CLEANING', 'REPAIR_OTHER']),
  cost: z.coerce.number().min(0, 'Must be ≥ 0'),
  isMajor: z.boolean(),
  performedAt: z.string().min(1, 'Date is required'),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

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
  const { firebaseUser, currentUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!record

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
        const input: MaintenanceInput = parsed
        const uid = firebaseUser!.uid
        const email = currentUser?.email ?? firebaseUser!.email ?? ''
        if (isEdit) {
          await updateMaintenance(record.id, input, uid, email)
        } else {
          await createMaintenance(input, uid, email)
        }
        toast.success(isEdit ? 'Maintenance record updated.' : 'Maintenance logged.')
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit maintenance' : 'Log maintenance'} — {instrumentName}
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
                <Label>Category</Label>
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
                  <Label>Cost (€)</Label>
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
                  <Label>Performed on</Label>
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
                  Major maintenance
                </Label>
              </div>
            )}
          </form.Field>

          {/* Notes */}
          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Notes</Label>
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
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Log maintenance'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

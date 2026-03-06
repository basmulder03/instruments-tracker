/**
 * UsageEventDialog — log a usage session for an instrument.
 * Supports both create and edit modes.
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import {
  createUsageEvent,
  updateUsageEvent,
  type UsageEventInput,
  type UsageEventWithId,
} from '@/features/operations/services/usageEventService'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  instrumentId: z.string().min(1),
  units: z.coerce.number().min(0.01, 'Must be > 0'),
  unitType: z.string().min(1, 'Unit type is required'),
  sessionAt: z.string().min(1, 'Date/time is required'),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface UsageEventDialogProps {
  instrumentId: string
  instrumentName: string
  record?: UsageEventWithId   // undefined = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function UsageEventDialog({
  instrumentId,
  instrumentName,
  record,
  open,
  onOpenChange,
  onSaved,
}: UsageEventDialogProps) {
  const { firebaseUser, currentUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!record

  const form = useForm<FormValues>({
    defaultValues: record
      ? { ...record.data }
      : {
          instrumentId,
          units: 1,
          unitType: 'hours',
          sessionAt: nowLocal(),
          notes: '',
        },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        const input: UsageEventInput = parsed
        const uid = firebaseUser!.uid
        const email = currentUser?.email ?? firebaseUser!.email ?? ''
        if (isEdit) {
          await updateUsageEvent(record.id, input, uid, email)
        } else {
          await createUsageEvent(input, uid, email)
        }
        toast.success(isEdit ? 'Usage updated.' : 'Usage logged.')
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
            {isEdit ? 'Edit usage log' : 'Log usage'} — {instrumentName}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            {/* Units */}
            <form.Field name="units">
              {(f) => (
                <div className="space-y-1.5">
                  <Label>Units</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.5}
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

            {/* Unit type */}
            <form.Field name="unitType">
              {(f) => (
                <div className="space-y-1.5">
                  <Label>Unit type</Label>
                  <Input
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                    placeholder="e.g. hours, sessions"
                  />
                  {f.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Session at */}
          <form.Field name="sessionAt">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Session date &amp; time</Label>
                <Input
                  type="datetime-local"
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

          {/* Notes */}
          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
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
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Log usage'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

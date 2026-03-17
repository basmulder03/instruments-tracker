/**
 * ReturnDialog — closes an open movement (instrument return).
 *
 * Requires an open Movement for the instrument.
 * On submit: updates Movement (CLOSED) and Instrument (IN_STORAGE).
 */
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
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
import { listLocations } from '@/features/locations/services/locationService'
import { returnInstrument } from '@/features/operations/services/movementService'
import { useAuth } from '@/contexts/AuthContext'
import type { InstrumentWithId } from '@/features/instruments/services/instrumentService'
import type { MovementWithId } from '@/features/operations/services/movementService'

interface ReturnDialogProps {
  instrument: InstrumentWithId
  openMovement: MovementWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function ReturnDialog({
  instrument,
  openMovement,
  open,
  onOpenChange,
  onSaved,
}: ReturnDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser, currentUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const schema = z.object({
    returnLocationId: z.string().min(1, t('returnDialog.validLocation')),
    returnAt: z.string().min(1, t('returnDialog.validDate')),
    notes: z.string(),
  })

  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: listLocations })

  const form = useForm({
    defaultValues: {
      returnLocationId: openMovement.data.checkoutLocationId ?? '',
      returnAt: nowLocal(),
      notes: openMovement.data.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        await returnInstrument(
          openMovement.id,
          instrument.id,
          {
            returnLocationId: parsed.returnLocationId,
            returnAt: new Date(parsed.returnAt).toISOString(),
            notes: parsed.notes,
          },
          firebaseUser!.uid,
          currentUser?.email ?? firebaseUser!.email ?? '',
        )
        toast.success(t('returnDialog.toast', { name: instrument.data.naam }))
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to return instrument.'
        setError(msg)
        toast.error(msg)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('returnDialog.title', { instrumentName: instrument.data.naam })}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          {/* Return location */}
          <form.Field name="returnLocationId">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('returnDialog.location')}</Label>
                <Select
                  value={f.state.value}
                  onValueChange={(v) => f.handleChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('returnDialog.locationPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.data.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {f.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{String(f.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Return date/time */}
          <form.Field name="returnAt">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('returnDialog.dateTime')}</Label>
                <Input
                  type="datetime-local"
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
                {f.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{String(f.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Notes */}
          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('returnDialog.notes')}</Label>
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
              {t('common.cancel')}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('returnDialog.submitting') : t('returnDialog.submit')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

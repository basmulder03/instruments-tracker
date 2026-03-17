/**
 * CheckoutDialog — lets the user check out an instrument to a person.
 *
 * Requires the instrument to be IN_STORAGE.
 * On submit: creates a Movement (OPEN) and updates the Instrument status.
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
import { listPeople } from '@/features/people/services/personService'
import { listLocations } from '@/features/locations/services/locationService'
import { checkoutInstrument } from '@/features/operations/services/movementService'
import { useAuth } from '@/contexts/AuthContext'
import type { InstrumentWithId } from '@/features/instruments/services/instrumentService'

interface CheckoutDialogProps {
  instrument: InstrumentWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function CheckoutDialog({
  instrument,
  open,
  onOpenChange,
  onSaved,
}: CheckoutDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser, currentUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const schema = z.object({
    checkoutPersonId: z.string().min(1, t('checkoutDialog.validPerson')),
    checkoutLocationId: z.string().min(1, t('checkoutDialog.validLocation')),
    checkoutAt: z.string().min(1, t('checkoutDialog.validDate')),
    notes: z.string(),
  })

  type FormValues = z.infer<typeof schema>

  const { data: people = [] } = useQuery({ queryKey: ['people'], queryFn: listPeople })
  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: listLocations })

  const form = useForm({
    defaultValues: {
      checkoutPersonId: '',
      checkoutLocationId: instrument.data.currentLocationId ?? '',
      checkoutAt: nowLocal(),
      notes: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        await checkoutInstrument(
          {
            instrumentId: instrument.id,
            checkoutPersonId: parsed.checkoutPersonId,
            checkoutLocationId: parsed.checkoutLocationId,
            checkoutAt: new Date(parsed.checkoutAt).toISOString(),
            notes: parsed.notes,
          },
          firebaseUser!.uid,
          currentUser?.email ?? firebaseUser!.email ?? '',
        )
        toast.success(t('checkoutDialog.toast', { name: instrument.data.naam }))
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to checkout.'
        setError(msg)
        toast.error(msg)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('checkoutDialog.title', { instrumentName: instrument.data.naam })}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          {/* Person */}
          <form.Field name="checkoutPersonId">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('checkoutDialog.person')}</Label>
                <Select
                  value={f.state.value}
                  onValueChange={(v) => f.handleChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkoutDialog.personPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.data.naam}
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

          {/* Location */}
          <form.Field name="checkoutLocationId">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('checkoutDialog.location')}</Label>
                <Select
                  value={f.state.value}
                  onValueChange={(v) => f.handleChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkoutDialog.locationPlaceholder')} />
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

          {/* Checkout date/time */}
          <form.Field name="checkoutAt">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('checkoutDialog.dateTime')}</Label>
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
                <Label>{t('checkoutDialog.notes')}</Label>
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
                  {submitting ? t('checkoutDialog.submitting') : t('checkoutDialog.submit')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

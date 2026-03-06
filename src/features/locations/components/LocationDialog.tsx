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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import {
  createLocation,
  updateLocation,
  type LocationInput,
  type LocationWithId,
} from '@/features/locations/services/locationService'
import { useAuth } from '@/contexts/AuthContext'

interface LocationDialogProps {
  location?: LocationWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function LocationDialog({ location, open, onOpenChange, onSaved }: LocationDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!location

  const schema = z.object({
    naam: z.string().min(1, t('locationDialog.validName')),
    adres: z.string(),
    notes: z.string(),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm({
    defaultValues: {
      naam: location?.data.naam ?? '',
      adres: location?.data.adres ?? '',
      notes: location?.data.notes ?? '',
    } as FormValues,
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        const input: LocationInput = { ...parsed }
        if (isEdit) {
          await updateLocation(location.id, input)
        } else {
          await createLocation(input, firebaseUser!.uid)
        }
        toast.success(isEdit ? t('locationDialog.toastUpdated') : t('locationDialog.toastAdded'))
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
            {isEdit ? t('locationDialog.titleEdit') : t('locationDialog.titleAdd')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-4">
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <form.Field name="naam">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('locationDialog.name')}</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder={t('locationDialog.namePlaceholder')} />
                {f.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>}
              </div>
            )}
          </form.Field>

          <form.Field name="adres">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('locationDialog.address')}</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder={t('locationDialog.addressPlaceholder')} />
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('locationDialog.notesLabel')}</Label>
                <Textarea rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
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
                    ? t('locationDialog.submitting')
                    : isEdit
                      ? t('locationDialog.submitEdit')
                      : t('locationDialog.submitAdd')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

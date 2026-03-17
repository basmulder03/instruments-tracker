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
  createPerson,
  updatePerson,
  type PersonInput,
  type PersonWithId,
} from '@/features/people/services/personService'
import { useAuth } from '@/contexts/AuthContext'

interface PersonDialogProps {
  person?: PersonWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function PersonDialog({ person, open, onOpenChange, onSaved }: PersonDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!person

  const schema = z.object({
    naam: z.string().min(1, t('personDialog.validName')),
    notes: z.string(),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm({
    defaultValues: { naam: person?.data.naam ?? '', notes: person?.data.notes ?? '' } as FormValues,
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        const input: PersonInput = { ...parsed }
        if (isEdit) {
          await updatePerson(person.id, input)
        } else {
          await createPerson(input, firebaseUser!.uid)
        }
        toast.success(isEdit ? t('personDialog.toastUpdated') : t('personDialog.toastAdded'))
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
            {isEdit ? t('personDialog.titleEdit') : t('personDialog.titleAdd')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-4">
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <form.Field name="naam">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('personDialog.fullName')}</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
                {f.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{String(f.state.meta.errors[0])}</p>}
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('common.notes')}</Label>
                <Textarea rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder={t('personDialog.notesPlaceholder')} />
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
                    ? t('personDialog.submitting')
                    : isEdit
                      ? t('personDialog.submitEdit')
                      : t('personDialog.submitAdd')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

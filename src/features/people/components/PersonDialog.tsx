import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
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

const schema = z.object({
  naam: z.string().min(1, 'Name is required'),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface PersonDialogProps {
  person?: PersonWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function PersonDialog({ person, open, onOpenChange, onSaved }: PersonDialogProps) {
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!person

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
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save.')
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit person' : 'Add person'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-4">
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <form.Field name="naam">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
                {f.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>}
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="Contact info, notes…" />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add person'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

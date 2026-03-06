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
  createLocation,
  updateLocation,
  type LocationInput,
  type LocationWithId,
} from '@/features/locations/services/locationService'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  naam: z.string().min(1, 'Name is required'),
  adres: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface LocationDialogProps {
  location?: LocationWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function LocationDialog({ location, open, onOpenChange, onSaved }: LocationDialogProps) {
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!location

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
          <DialogTitle>{isEdit ? 'Edit location' : 'Add location'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-4">
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <form.Field name="naam">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="e.g. Main Storage Room" />
                {f.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>}
              </div>
            )}
          </form.Field>

          <form.Field name="adres">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="Building A, Room 101" />
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add location'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import {
  createInstrument,
  updateInstrument,
  type InstrumentInput,
  type InstrumentWithId,
} from '@/features/instruments/services/instrumentService'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  naam: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  merk: z.string().min(1, 'Brand is required'),
  serienummer: z.string(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchaseCost: z.coerce.number().min(0, 'Must be ≥ 0'),
  usefulLifeYears: z.coerce.number().int().min(1, 'Must be ≥ 1'),
  salvageValue: z.coerce.number().min(0, 'Must be ≥ 0'),
  // CHECKED_OUT is intentionally excluded: status must only change via
  // the Check Out / Return operations so that a Movement record is always created.
  currentStatus: z.enum(['IN_STORAGE', 'CHECKED_OUT', 'IN_REPAIR']),
  currentLocationId: z.string(),
  currentPersonId: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

interface InstrumentDialogProps {
  instrument?: InstrumentWithId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const EMPTY: FormValues = {
  naam: '',
  type: '',
  merk: '',
  serienummer: '',
  purchaseDate: '',
  purchaseCost: 0,
  usefulLifeYears: 10,
  salvageValue: 0,
  currentStatus: 'IN_STORAGE',
  currentLocationId: '',
  currentPersonId: '',
  notes: '',
}

export function InstrumentDialog({
  instrument,
  open,
  onOpenChange,
  onSaved,
}: InstrumentDialogProps) {
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!instrument

  const form = useForm({
    defaultValues: instrument
      ? { ...EMPTY, ...instrument.data }
      : EMPTY,
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)
        // Enforce: new instruments always start IN_STORAGE with no person assigned.
        // Checked-out instruments retain their status unchanged (read-only in UI).
        const input: InstrumentInput = {
          ...parsed,
          ...(isEdit ? {} : { currentStatus: 'IN_STORAGE', currentPersonId: '' }),
        }
        if (isEdit) {
          await updateInstrument(instrument.id, input)
        } else {
          await createInstrument(input, firebaseUser!.uid)
        }
        toast.success(isEdit ? 'Instrument updated.' : 'Instrument added.')
        onSaved?.()
        onOpenChange(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save.'
        setError(msg)
        toast.error(msg)
      }
    },
  })

  function field(
    name: keyof FormValues,
    label: string,
    render: (
      value: string | number,
      onChange: (v: string) => void,
      onBlur: () => void,
      errors: string[],
    ) => React.ReactNode,
  ) {
    return (
      <form.Field name={name}>
        {(f) => (
          <div className="space-y-1.5">
            <Label>{label}</Label>
            {render(
              f.state.value as string | number,
              f.handleChange as (v: string) => void,
              f.handleBlur,
              f.state.meta.errors.map(String),
            )}
            {f.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">{f.state.meta.errors[0]?.toString()}</p>
            )}
          </div>
        )}
      </form.Field>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit instrument' : 'Add instrument'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            {field('naam', 'Name', (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder="e.g. Yamaha Trumpet YTR-2330" />
            ))}
            {field('type', 'Type', (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder="e.g. Trumpet" />
            ))}
            {field('merk', 'Brand', (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder="e.g. Yamaha" />
            ))}
            {field('serienummer', 'Serial number', (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('purchaseDate', 'Purchase date', (v, onChange, onBlur) => (
              <Input type="date" value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('purchaseCost', 'Purchase cost (€)', (v, onChange, onBlur) => (
              <Input type="number" min={0} step={0.01} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('usefulLifeYears', 'Useful life (years)', (v, onChange, onBlur) => (
              <Input type="number" min={1} step={1} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('salvageValue', 'Salvage value (€)', (v, onChange, onBlur) => (
              <Input type="number" min={0} step={0.01} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
          </div>

          <form.Field name="currentStatus">
            {(f) => (
              <div className="space-y-1.5">
                <Label>Status</Label>
                {/* New instruments always start IN_STORAGE — status changes via
                    Check Out / Return operations only, to keep Movement records
                    in sync. When editing a checked-out instrument the field is
                    read-only to prevent a limbo state. */}
                {!isEdit ? (
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
                    In storage
                  </p>
                ) : f.state.value === 'CHECKED_OUT' ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
                      Checked out
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Status is managed by Check Out / Return operations and cannot be changed here.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={f.state.value}
                    onValueChange={(v) => f.handleChange(v as 'IN_STORAGE' | 'IN_REPAIR')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_STORAGE">In storage</SelectItem>
                      <SelectItem value="IN_REPAIR">In repair</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </form.Field>

          {field('notes', 'Notes', (v, onChange, onBlur) => (
            <Textarea rows={3} value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add instrument'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

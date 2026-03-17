import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { ComboboxInput } from '@/components/common/ComboboxInput'
import {
  createInstrument,
  updateInstrument,
  listInstruments,
  type InstrumentInput,
  type InstrumentWithId,
} from '@/features/instruments/services/instrumentService'
import { useAuth } from '@/contexts/AuthContext'

type FormValues = {
  naam: string
  type: string
  merk: string
  serienummer: string
  purchaseDate: string
  purchaseCost: number
  usefulLifeYears: number
  salvageValue: number
  currentStatus: 'IN_STORAGE' | 'CHECKED_OUT' | 'IN_REPAIR'
  currentLocationId: string
  currentPersonId: string
  notes: string
}

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
  const { t } = useTranslation()
  const { firebaseUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!instrument

  // Fetch all instruments to derive type/brand suggestions (uses cache from parent page)
  const { data: allInstruments = [] } = useQuery({
    queryKey: ['instruments'],
    queryFn: listInstruments,
  })
  const typeSuggestions = [...new Set(allInstruments.map((i) => i.data.type).filter(Boolean))]
  const brandSuggestions = [...new Set(allInstruments.map((i) => i.data.merk).filter(Boolean))]

  // Schema defined inside component so t() is ready
  const schema = z.object({
    naam: z.string().min(1, t('instrumentDialog.validName')),
    type: z.string().min(1, t('instrumentDialog.validType')),
    merk: z.string().min(1, t('instrumentDialog.validBrand')),
    serienummer: z.string(),
    purchaseDate: z.string().min(1, t('instrumentDialog.validDate')),
    purchaseCost: z.coerce.number().min(0, t('instrumentDialog.validMin0')),
    usefulLifeYears: z.coerce.number().int().min(1, t('instrumentDialog.validMin1')),
    salvageValue: z.coerce.number().min(0, t('instrumentDialog.validMin0')),
    currentStatus: z.enum(['IN_STORAGE', 'CHECKED_OUT', 'IN_REPAIR']),
    currentLocationId: z.string(),
    currentPersonId: z.string(),
    notes: z.string(),
  })

  const form = useForm({
    defaultValues: instrument
      ? { ...EMPTY, ...instrument.data }
      : EMPTY,
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = schema.parse(value)

        // Enforce: new instruments always start IN_STORAGE with no person assigned.
        const input: InstrumentInput = {
          ...parsed,
          ...(isEdit ? {} : { currentStatus: 'IN_STORAGE', currentPersonId: '' }),
        }

        if (isEdit) {
          await updateInstrument(instrument.id, input)
        } else {
          await createInstrument(input, firebaseUser!.uid)
        }

        toast.success(isEdit ? t('instrumentDialog.toastUpdated') : t('instrumentDialog.toastAdded'))
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
              <p className="text-xs text-destructive">{String(f.state.meta.errors[0])}</p>
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
          <DialogTitle>
            {isEdit ? t('instrumentDialog.titleEdit') : t('instrumentDialog.titleAdd')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            {field('naam', t('instrumentDialog.name'), (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={t('instrumentDialog.namePlaceholder')} />
            ))}
            {field('type', t('instrumentDialog.type'), (v, onChange, onBlur) => (
              <ComboboxInput
                value={v as string}
                onChange={onChange}
                onBlur={onBlur}
                suggestions={typeSuggestions}
                placeholder={t('instrumentDialog.typePlaceholder')}
              />
            ))}
            {field('merk', t('instrumentDialog.brand'), (v, onChange, onBlur) => (
              <ComboboxInput
                value={v as string}
                onChange={onChange}
                onBlur={onBlur}
                suggestions={brandSuggestions}
                placeholder={t('instrumentDialog.brandPlaceholder')}
              />
            ))}
            {field('serienummer', t('instrumentDialog.serial'), (v, onChange, onBlur) => (
              <Input value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('purchaseDate', t('instrumentDialog.purchaseDate'), (v, onChange, onBlur) => (
              <Input type="date" value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('purchaseCost', t('instrumentDialog.purchaseCost'), (v, onChange, onBlur) => (
              <Input type="number" min={0} step={0.01} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('usefulLifeYears', t('instrumentDialog.usefulLife'), (v, onChange, onBlur) => (
              <Input type="number" min={1} step={1} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
            {field('salvageValue', t('instrumentDialog.salvageValue'), (v, onChange, onBlur) => (
              <Input type="number" min={0} step={0.01} value={v as number} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            ))}
          </div>

          <form.Field name="currentStatus">
            {(f) => (
              <div className="space-y-1.5">
                <Label>{t('instrumentDialog.status')}</Label>
                {/* New instruments always start IN_STORAGE — status changes via
                    Check Out / Return operations only, to keep Movement records
                    in sync. When editing a checked-out instrument the field is
                    read-only to prevent a limbo state. */}
                {!isEdit ? (
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
                    {t('instrumentDialog.statusInStorage')}
                  </p>
                ) : f.state.value === 'CHECKED_OUT' ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
                      {t('instrumentDialog.statusCheckedOut')}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {t('instrumentDialog.statusHint')}
                    </p>
                  </div>
                ) : (
                  <Select
                    value={f.state.value}
                    onValueChange={(v) => f.handleChange(v as 'IN_STORAGE' | 'IN_REPAIR')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_STORAGE">{t('instrumentDialog.statusInStorage')}</SelectItem>
                      <SelectItem value="IN_REPAIR">{t('instrumentDialog.statusInRepair')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </form.Field>

          {field('notes', t('instrumentDialog.notesLabel'), (v, onChange, onBlur) => (
            <Textarea rows={3} value={v as string} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t('instrumentDialog.submitting')
                    : isEdit
                      ? t('instrumentDialog.submitEdit')
                      : t('instrumentDialog.submitAdd')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

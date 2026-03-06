import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { inviteUser } from '@/features/users/services/invitationService'
import { SYSTEM_ROLES } from '@/lib/roles'
import { useAuth } from '@/contexts/AuthContext'

interface InviteUserDialogProps {
  onInvited?: () => void
}

export function InviteUserDialog({ onInvited }: InviteUserDialogProps) {
  const { t } = useTranslation()
  const { firebaseUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = z.object({
    email: z.string().email(t('inviteDialog.validEmail')),
    role: z.string().min(1, t('inviteDialog.validRole')),
  })

  const form = useForm({
    defaultValues: { email: '', role: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      if (!firebaseUser) return
      try {
        const parsed = schema.parse(value)
        const { invitationId, token } = await inviteUser(
          { email: parsed.email, role: parsed.role },
          firebaseUser.uid,
        )
        const inviteUrl = `${window.location.origin}/auth/accept-invitation?token=${token}`
        toast.success(
          t('inviteDialog.toast', { email: parsed.email, invitationId }),
          { description: inviteUrl, duration: 10000 },
        )
        form.reset()
        onInvited?.()
        setOpen(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send invitation.'
        setError(msg)
        toast.error(msg)
      }
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset()
      setError(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 size-4" />
          {t('inviteDialog.trigger')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inviteDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            {error && (
              <Alert variant="destructive" className="text-sm">
                {error}
              </Alert>
            )}

            {/* Email */}
            <form.Field name="email">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">{t('inviteDialog.email')}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder={t('inviteDialog.emailPlaceholder')}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]?.toString()}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Role */}
            <form.Field name="role">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>{t('inviteDialog.role')}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('inviteDialog.rolePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]?.toString()}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('inviteDialog.submitting') : t('inviteDialog.submit')}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  )
}

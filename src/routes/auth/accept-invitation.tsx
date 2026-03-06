import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  acceptInvitation,
  getInvitationByToken,
  type InvitationWithId,
} from '@/features/users/services/invitationService'

// Search params: /auth/accept-invitation?token=<token>
const searchSchema = z.object({ token: z.string().optional() })

export const Route = createFileRoute('/auth/accept-invitation')({
  validateSearch: searchSchema,
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { token } = useSearch({ from: '/auth/accept-invitation' })
  const [invitation, setInvitation] = useState<InvitationWithId | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const formSchema = z.object({
    displayName: z.string().min(2, t('auth.invite.validName')),
    password: z.string().min(8, t('auth.invite.validPassword')),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('auth.invite.validPasswordMatch'),
    path: ['confirmPassword'],
  })

  useEffect(() => {
    if (!token) {
      setLoadError(t('auth.invite.errorNoToken'))
      setLoading(false)
      return
    }

    getInvitationByToken(token)
      .then((inv) => {
        if (!inv) {
          setLoadError(t('auth.invite.errorNotFound'))
        } else if (inv.data.status !== 'pending') {
          setLoadError(t('auth.invite.errorUsed'))
        } else if (inv.data.expiresAt.toMillis() < Date.now()) {
          setLoadError(t('auth.invite.errorExpired'))
        } else {
          setInvitation(inv)
        }
      })
      .catch(() => setLoadError(t('auth.invite.errorLoad')))
      .finally(() => setLoading(false))
  }, [token, t])

  const form = useForm({
    defaultValues: { displayName: '', password: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      if (!token) return
      setSubmitError(null)
      try {
        const parsed = formSchema.parse(value)
        await acceptInvitation({ token, password: parsed.password, displayName: parsed.displayName })
        navigate({ to: '/dashboard' })
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setSubmitError(err.errors[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          setSubmitError(err.message)
        } else {
          setSubmitError(t('auth.invite.errorUnexpected'))
        }
      }
    },
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{t('auth.invite.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.invite.invalidTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.invite.title')}</CardTitle>
        <CardDescription>
          {t('auth.invite.description', { role: invitation?.data.role })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          {t('auth.invite.accountEmail', { email: invitation?.data.email })}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="displayName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.invite.fullName')}</Label>
                <Input
                  id="displayName"
                  placeholder={t('auth.invite.namePlaceholder')}
                  autoComplete="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.invite.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.invite.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('auth.invite.submitting') : t('auth.invite.submit')}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}

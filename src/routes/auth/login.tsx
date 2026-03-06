import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signIn, resetPassword, hasAdminUser } from '@/features/users/services/authService'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Check once whether the first admin account exists.
  // staleTime: Infinity — this value flips exactly once (false → true) and
  // never reverts, so there's no need to ever re-fetch within a session.
  const { data: adminExists, isLoading: adminChecking } = useQuery({
    queryKey: ['bootstrap', 'adminExists'],
    queryFn: hasAdminUser,
    staleTime: Infinity,
  })

  // Auto-redirect to the registration page when no admin exists yet.
  useEffect(() => {
    if (!adminChecking && adminExists === false) {
      navigate({ to: '/auth/register' })
    }
  }, [adminExists, adminChecking, navigate])

  const loginSchema = z.object({
    email: z.string().email(t('auth.login.validEmail')),
    password: z.string().min(1, t('auth.login.validPassword')),
  })

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = loginSchema.parse(value)
        await signIn(parsed.email, parsed.password)
        navigate({ to: '/dashboard' })
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          if (
            err.message.includes('user-not-found') ||
            err.message.includes('wrong-password') ||
            err.message.includes('invalid-credential')
          ) {
            setError(t('auth.login.errorInvalid'))
          } else {
            setError(err.message)
          }
        } else {
          setError(t('auth.login.errorUnexpected'))
        }
      }
    },
  })

  async function handleResetPassword() {
    const email = form.getFieldValue('email')
    if (!email) {
      setError(t('auth.login.resetGuard'))
      return
    }
    setIsResetting(true)
    setError(null)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch {
      setError(t('auth.login.resetError'))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resetSent && (
          <Alert className="mb-4">
            <AlertDescription>{t('auth.login.resetSuccess')}</AlertDescription>
          </Alert>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  autoComplete="email"
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
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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
                {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-sm text-center">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResetting}
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {isResetting ? t('auth.login.sendingReset') : t('auth.login.forgotPassword')}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

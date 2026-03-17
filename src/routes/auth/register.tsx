import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { hasAdminUser, registerFirstAdmin } from '@/features/users/services/authService'
import { seedSystemDataIfNeeded } from '@/lib/seedData'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [adminExists, setAdminExists] = useState(false)

  const registerSchema = z.object({
    displayName: z.string().min(2, t('auth.register.validName')),
    email: z.string().email(t('auth.register.validEmail')),
    password: z.string().min(8, t('auth.register.validPassword')),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('auth.register.validPasswordMatch'),
    path: ['confirmPassword'],
  })

  // If an admin already exists, redirect to login
  useEffect(() => {
    hasAdminUser()
      .then((exists) => {
        if (exists) {
          setAdminExists(true)
          navigate({ to: '/auth/login' })
        }
      })
      .catch(() => {
        // Non-critical — continue showing the form
      })
      .finally(() => setChecking(false))
  }, [navigate])

  const form = useForm({
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const parsed = registerSchema.parse(value)
        await registerFirstAdmin(parsed.email, parsed.password, parsed.displayName)
        await seedSystemDataIfNeeded()
        navigate({ to: '/dashboard' })
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.issues[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          if (err.message.includes('email-already-in-use')) {
            setError(t('auth.register.errorEmailInUse'))
          } else {
            setError(err.message)
          }
        } else {
          setError(t('auth.register.errorUnexpected'))
        }
      }
    },
  })

  if (checking || adminExists) return null

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.register.title')}</CardTitle>
        <CardDescription>{t('auth.register.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
                <Label htmlFor="displayName">{t('auth.register.fullName')}</Label>
                <Input
                  id="displayName"
                  placeholder={t('auth.register.namePlaceholder')}
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

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.register.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.register.emailPlaceholder')}
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
                <Label htmlFor="password">{t('auth.register.password')}</Label>
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
                <Label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</Label>
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
                {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-4 text-sm text-center">
          <Link
            to="/auth/login"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('auth.register.alreadyHaveAccount')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

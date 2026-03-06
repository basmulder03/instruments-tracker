import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
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

const registerSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [adminExists, setAdminExists] = useState(false)

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
        // Create the admin Auth user + Firestore doc first, so the
        // subsequent seed writes have a valid authenticated session with
        // permissions: ['*:*'] already in place.
        await registerFirstAdmin(parsed.email, parsed.password, parsed.displayName)
        // Seed roles/permissions after auth is established.
        await seedSystemDataIfNeeded()
        navigate({ to: '/dashboard' })
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          if (err.message.includes('email-already-in-use')) {
            setError('An account with this email already exists.')
          } else {
            setError(err.message)
          }
        } else {
          setError('An unexpected error occurred.')
        }
      }
    },
  })

  if (checking || adminExists) return null

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create administrator account</CardTitle>
        <CardDescription>
          This form is only available before the first administrator is registered.
        </CardDescription>
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
                <Label htmlFor="displayName">Full name</Label>
                <Input
                  id="displayName"
                  placeholder="Jane Doe"
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
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
                <Label htmlFor="password">Password</Label>
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
                <Label htmlFor="confirmPassword">Confirm password</Label>
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
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-4 text-sm text-center">
          <Link
            to="/auth/login"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

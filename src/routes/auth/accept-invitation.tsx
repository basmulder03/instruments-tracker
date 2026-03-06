import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
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

const formSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: '/auth/accept-invitation' })
  const [invitation, setInvitation] = useState<InvitationWithId | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoadError('No invitation token provided. Use the link from your invitation email.')
      setLoading(false)
      return
    }

    getInvitationByToken(token)
      .then((inv) => {
        if (!inv) {
          setLoadError('Invitation not found or already used.')
        } else if (inv.data.status !== 'pending') {
          setLoadError('This invitation has already been used or has been cancelled.')
        } else if (inv.data.expiresAt.toMillis() < Date.now()) {
          setLoadError('This invitation has expired. Ask an administrator to send a new one.')
        } else {
          setInvitation(inv)
        }
      })
      .catch(() => setLoadError('Failed to load invitation. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

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
          setSubmitError('An unexpected error occurred.')
        }
      }
    },
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Verifying invitation…</p>
        </CardContent>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
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
        <CardTitle className="text-2xl">Accept invitation</CardTitle>
        <CardDescription>
          You have been invited as <strong>{invitation?.data.role}</strong>. Create a password to
          activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          Account email: <strong>{invitation?.data.email}</strong>
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
                {isSubmitting ? 'Activating account…' : 'Activate account'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}

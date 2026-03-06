import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signIn, resetPassword } from '@/features/users/services/authService'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

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
          // Firebase error codes
          if (
            err.message.includes('user-not-found') ||
            err.message.includes('wrong-password') ||
            err.message.includes('invalid-credential')
          ) {
            setError('Invalid email or password.')
          } else {
            setError(err.message)
          }
        } else {
          setError('An unexpected error occurred.')
        }
      }
    },
  })

  async function handleResetPassword() {
    const email = form.getFieldValue('email')
    if (!email) {
      setError('Enter your email address above to receive a reset link.')
      return
    }
    setIsResetting(true)
    setError(null)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch {
      setError('Could not send reset email. Make sure the email address is correct.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access Instruments Tracker</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resetSent && (
          <Alert className="mb-4">
            <AlertDescription>
              Password reset email sent. Check your inbox.
            </AlertDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
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
                {isSubmitting ? 'Signing in…' : 'Sign in'}
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
            {isResetting ? 'Sending…' : 'Forgot password?'}
          </button>
          <Link
            to="/auth/register"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            No account yet? Register as first administrator
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

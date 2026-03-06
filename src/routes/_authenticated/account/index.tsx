import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { changePassword } from '@/features/users/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/_authenticated/account/')({
  component: AccountSettingsPage,
})

// ---------------------------------------------------------------------------
// Profile section
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

function ProfileSection() {
  const { currentUser, firebaseUser } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { displayName: currentUser?.displayName ?? '' },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccess(false)
      try {
        const parsed = profileSchema.parse(value)
        if (!firebaseUser) throw new Error('Not authenticated')
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          displayName: parsed.displayName,
          updatedAt: serverTimestamp(),
        })
        setSuccess(true)
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          setError(err.message)
        }
      }
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{currentUser?.email}</p>
      </div>
      <Separator />
      {success && (
        <Alert className="mb-2">
          <AlertDescription>Profile updated successfully.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
        className="space-y-4"
      >
        <form.Field name="displayName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Password section
// ---------------------------------------------------------------------------

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function PasswordSection() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { newPassword: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccess(false)
      try {
        const parsed = passwordSchema.parse(value)
        await changePassword(parsed.newPassword)
        setSuccess(true)
        form.reset()
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          if (err.message.includes('requires-recent-login')) {
            setError('Please sign out and sign back in before changing your password.')
          } else {
            setError(err.message)
          }
        }
      }
    },
  })

  return (
    <div className="space-y-4">
      {success && (
        <Alert className="mb-2">
          <AlertDescription>Password changed successfully.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
        className="space-y-4"
      >
        <form.Field name="newPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
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
              <Label htmlFor="confirmPassword">Confirm new password</Label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Changing…' : 'Change password'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preferences section
// ---------------------------------------------------------------------------

function PreferencesSection() {
  const { currentUser, firebaseUser } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      theme: currentUser?.preferences?.theme ?? 'light',
      language: currentUser?.preferences?.language ?? 'en',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccess(false)
      try {
        if (!firebaseUser) throw new Error('Not authenticated')
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          'preferences.theme': value.theme,
          'preferences.language': value.language,
          updatedAt: serverTimestamp(),
        })
        setSuccess(true)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
      }
    },
  })

  return (
    <div className="space-y-4">
      {success && (
        <Alert className="mb-2">
          <AlertDescription>Preferences saved.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
        className="space-y-4"
      >
        <form.Field name="theme">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as 'light' | 'dark')}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="language">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as 'en' | 'nl')}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save preferences'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AccountSettingsPage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Account settings</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Choose a strong password of at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

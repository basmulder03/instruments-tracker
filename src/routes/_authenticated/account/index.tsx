import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { changePassword } from '@/features/users/services/authService'
import { useTranslation } from 'react-i18next'
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
import i18n from '@/i18n'

export const Route = createFileRoute('/_authenticated/account/')({
  component: AccountSettingsPage,
})

// ---------------------------------------------------------------------------
// Profile section
// ---------------------------------------------------------------------------

function ProfileSection() {
  const { t } = useTranslation()
  const { currentUser, firebaseUser } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profileSchema = z.object({
    displayName: z.string().min(2, t('account.profile.validName')),
  })

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
          setError(err.issues[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          setError(err.message)
        }
      }
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{t('account.profile.email')}</p>
        <p className="font-medium">{currentUser?.email}</p>
      </div>
      <Separator />
      {success && (
        <Alert className="mb-2">
          <AlertDescription>{t('account.profile.success')}</AlertDescription>
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
              <Label htmlFor="displayName">{t('account.profile.displayName')}</Label>
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
              {isSubmitting ? t('account.profile.saving') : t('account.profile.save')}
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

function PasswordSection() {
  const { t } = useTranslation()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordSchema = z.object({
    newPassword: z.string().min(8, t('account.password.validPassword')),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: t('account.password.validMatch'),
    path: ['confirmPassword'],
  })

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
          setError(err.issues[0]?.message ?? 'Validation error')
        } else if (err instanceof Error) {
          if (err.message.includes('requires-recent-login')) {
            setError(t('account.password.reauthError'))
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
          <AlertDescription>{t('account.password.success')}</AlertDescription>
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
              <Label htmlFor="newPassword">{t('account.password.new')}</Label>
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
              <Label htmlFor="confirmPassword">{t('account.password.confirm')}</Label>
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
              {isSubmitting ? t('account.password.submitting') : t('account.password.submit')}
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
  const { t } = useTranslation()
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
        // Apply language immediately
        i18n.changeLanguage(value.language)
        localStorage.setItem('language', value.language)
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
          <AlertDescription>{t('account.prefs.success')}</AlertDescription>
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
              <Label htmlFor="theme">{t('account.prefs.theme')}</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as 'light' | 'dark')}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('account.prefs.themeLight')}</SelectItem>
                  <SelectItem value="dark">{t('account.prefs.themeDark')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="language">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="language">{t('account.prefs.language')}</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as 'en' | 'nl')}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('account.prefs.langEn')}</SelectItem>
                  <SelectItem value="nl">{t('account.prefs.langNl')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('account.prefs.saving') : t('account.prefs.save')}
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
  const { t } = useTranslation()
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t('account.title')}</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">{t('account.tabProfile')}</TabsTrigger>
          <TabsTrigger value="password">{t('account.tabPassword')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('account.tabPreferences')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.profile.title')}</CardTitle>
              <CardDescription>{t('account.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.password.title')}</CardTitle>
              <CardDescription>{t('account.password.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.prefs.title')}</CardTitle>
              <CardDescription>{t('account.prefs.description')}</CardDescription>
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

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
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

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.string().min(1, 'Select a role'),
})

interface InviteUserDialogProps {
  onInvited?: () => void
}

export function InviteUserDialog({ onInvited }: InviteUserDialogProps) {
  const { firebaseUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', role: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      setSuccess(null)
      if (!firebaseUser) return
      try {
        const parsed = schema.parse(value)
        const { invitationId, token } = await inviteUser(
          { email: parsed.email, role: parsed.role },
          firebaseUser.uid,
        )
        const inviteUrl = `${window.location.origin}/auth/accept-invitation?token=${token}`
        setSuccess(
          `Invitation sent for ${value.email} (${invitationId}).\n\nShare this link:\n${inviteUrl}`,
        )
        form.reset()
        onInvited?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send invitation.')
      }    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset()
      setError(null)
      setSuccess(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 size-4" />
          Invite user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            An invitation link will be generated. Share it with the user so they
            can create their account.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <Alert className="whitespace-pre-wrap text-sm">{success}</Alert>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
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
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@example.com"
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
                  <Label>Role</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role…" />
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
                Cancel
              </Button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending…' : 'Send invitation'}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

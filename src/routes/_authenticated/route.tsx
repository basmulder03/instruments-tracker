import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth, authReady } from '@/config/firebase'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    await authReady
    if (!auth.currentUser) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: AppShell,
})

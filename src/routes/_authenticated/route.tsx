import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/config/firebase'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!auth.currentUser) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: AppShell,
})

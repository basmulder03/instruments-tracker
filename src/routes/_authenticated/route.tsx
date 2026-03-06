import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '@/config/firebase'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!auth.currentUser) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: () => <Outlet />,
})

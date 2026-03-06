import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect root to /dashboard (or /auth/login if not authenticated —
// the _authenticated layout handles that guard).
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

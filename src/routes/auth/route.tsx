import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth, authReady } from '@/config/firebase'

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    // If already authenticated, skip the auth pages entirely
    await authReady
    if (auth.currentUser) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}

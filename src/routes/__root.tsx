import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AuthProvider } from '@/contexts/AuthContext'
import { AbilityProvider } from '@/contexts/AbilityProvider'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <AbilityProvider>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </AbilityProvider>
    </AuthProvider>
  ),
})

import { useRouter } from '@tanstack/react-router'
import { LogOut, UserCircle, Sun, Moon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/features/users/services/authService'
import { useDarkMode } from '@/hooks/useDarkMode'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu() {
  const { currentUser } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/auth/login' })
  }

  if (!currentUser) return null

  const initials = getInitials(currentUser.displayName || currentUser.email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full p-0">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{currentUser.displayName}</p>
          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <button
            className="flex w-full cursor-pointer items-center"
            onClick={() => router.navigate({ to: '/account' })}
          >
            <UserCircle className="mr-2 size-4" />
            Account settings
          </button>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <button
            className="flex w-full cursor-pointer items-center"
            onClick={toggle}
          >
            {isDark ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <button
            className="flex w-full cursor-pointer items-center text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

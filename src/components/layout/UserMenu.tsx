import { useRouter } from '@tanstack/react-router'
import { LogOut, UserCircle, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/features/users/services/authService'
import { useDarkMode } from '@/hooks/useDarkMode'
import { NameAvatar } from '@/components/common/NameAvatar'

export function UserMenu() {
  const { currentUser } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const router = useRouter()
  const { t } = useTranslation()

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/auth/login' })
  }

  if (!currentUser) return null

  const displayName = currentUser.displayName || currentUser.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full p-0">
          <NameAvatar name={displayName} />
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
            {t('userMenu.accountSettings')}
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
            {isDark ? t('userMenu.lightMode') : t('userMenu.darkMode')}
          </button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <button
            className="flex w-full cursor-pointer items-center text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 size-4" />
            {t('userMenu.signOut')}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

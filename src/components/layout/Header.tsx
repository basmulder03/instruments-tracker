import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 gap-4">
      {/* Mobile hamburger — only visible on small screens */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      <UserMenu />
    </header>
  )
}

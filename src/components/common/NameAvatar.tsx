import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, nameToAvatarStyle } from '@/lib/utils'

interface NameAvatarProps {
  /** The name (or email) used to derive initials and background color. */
  name: string
  className?: string
}

/**
 * A circular avatar that shows up to two initials on a deterministic,
 * name-seeded background color.  The same name always produces the same color.
 */
export function NameAvatar({ name, className }: NameAvatarProps) {
  const style = nameToAvatarStyle(name)
  const initials = getInitials(name)

  return (
    <Avatar className={cn('size-9', className)}>
      <AvatarFallback
        className="text-xs font-semibold"
        style={style}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

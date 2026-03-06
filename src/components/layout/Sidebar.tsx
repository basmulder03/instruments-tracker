import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Music,
  Users,
  MapPin,
  ArrowRightLeft,
  Wrench,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  UserCog,
  ShieldAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAbility } from '@/contexts/AbilityContext'
import type { Actions, Subjects } from '@/lib/types/permissions'

// ---------------------------------------------------------------------------
// Nav item definition
// ---------------------------------------------------------------------------

interface NavItem {
  labelKey: string
  to: string
  icon: React.ElementType
  /** CASL check — item only shown when ability.can(action, subject) */
  permission?: { action: Actions; subject: Subjects }
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'nav.instruments',
    to: '/instruments',
    icon: Music,
    permission: { action: 'read', subject: 'Instrument' },
  },
  {
    labelKey: 'nav.people',
    to: '/people',
    icon: Users,
    permission: { action: 'read', subject: 'Person' },
  },
  {
    labelKey: 'nav.locations',
    to: '/locations',
    icon: MapPin,
    permission: { action: 'read', subject: 'Location' },
  },
  {
    labelKey: 'nav.movements',
    to: '/movements',
    icon: ArrowRightLeft,
    permission: { action: 'read', subject: 'Movement' },
  },
  {
    labelKey: 'nav.maintenance',
    to: '/maintenance',
    icon: Wrench,
    permission: { action: 'read', subject: 'Maintenance' },
  },
  {
    labelKey: 'nav.analytics',
    to: '/analytics',
    icon: BarChart3,
    permission: { action: 'view', subject: 'Analytics' },
  },
  {
    labelKey: 'nav.auditLog',
    to: '/audit',
    icon: ClipboardList,
    permission: { action: 'read', subject: 'Audit' },
  },
  {
    labelKey: 'nav.users',
    to: '/admin/users',
    icon: UserCog,
    permission: { action: 'read', subject: 'User' },
  },
  {
    labelKey: 'nav.roles',
    to: '/admin/roles',
    icon: ShieldCheck,
    permission: { action: 'read', subject: 'Role' },
  },
  {
    labelKey: 'nav.privacy',
    to: '/admin/privacy',
    icon: ShieldAlert,
    permission: { action: 'manage', subject: 'Privacy' },
  },
]

// ---------------------------------------------------------------------------
// NavLink
// ---------------------------------------------------------------------------

function NavLink({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const isActive = pathname === item.to || pathname.startsWith(item.to + '/')
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{t(item.labelKey)}</span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation()
  const ability = useAbility()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true
    return ability.can(item.permission.action, item.permission.subject)
  })

  return (
    <aside
      className={cn(
        'flex h-full w-60 flex-col border-r bg-card',
        className,
      )}
    >
      {/* Logo / brand */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold tracking-tight">
          {t('appName')}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

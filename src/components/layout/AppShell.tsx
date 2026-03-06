import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

/**
 * Main application shell.
 *
 * Layout:
 * - Desktop (md+): fixed sidebar on the left, content fills the rest
 * - Mobile:        full-width content, sidebar slides in as a Sheet
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop sidebar — hidden on mobile                                  */}
      {/* ------------------------------------------------------------------ */}
      <Sidebar className="hidden md:flex" />

      {/* ------------------------------------------------------------------ */}
      {/* Mobile sidebar sheet                                                */}
      {/* ------------------------------------------------------------------ */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <Sidebar className="flex h-full" />
        </SheetContent>
      </Sheet>

      {/* ------------------------------------------------------------------ */}
      {/* Main area: header + page content                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

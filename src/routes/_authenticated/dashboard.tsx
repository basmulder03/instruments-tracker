import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Instruments Tracker</h1>
        <p className="text-muted-foreground">Dashboard — Phase 4 coming soon.</p>
      </div>
    </div>
  )
}

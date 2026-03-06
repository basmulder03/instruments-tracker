import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to Instruments Tracker.</p>
    </div>
  )
}

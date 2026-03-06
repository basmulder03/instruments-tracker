import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Music, ArrowRightLeft, Wrench, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { listMovements } from '@/features/operations/services/movementService'
import { listAllMaintenance } from '@/features/operations/services/maintenanceService'
import {
  listDepreciation,
  listUsageStats,
} from '@/features/analytics/services/analyticsService'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DashboardPage() {
  const { data: instruments = [] } = useQuery({ queryKey: ['instruments'], queryFn: listInstruments })
  const { data: movements = [] } = useQuery({ queryKey: ['movements'], queryFn: listMovements })
  const { data: maintenance = [] } = useQuery({ queryKey: ['maintenance'], queryFn: listAllMaintenance })
  const { data: depreciation = [] } = useQuery({ queryKey: ['depreciation'], queryFn: listDepreciation })
  const { data: usageStats = [] } = useQuery({ queryKey: ['usage_stats'], queryFn: listUsageStats })

  // --- KPIs ---
  const totalInstruments = instruments.length
  const checkedOut = instruments.filter((i) => i.data.currentStatus === 'CHECKED_OUT').length
  const inRepair = instruments.filter((i) => i.data.currentStatus === 'IN_REPAIR').length
  const openMovements = movements.filter((m) => m.data.status === 'OPEN').length

  const totalBookValue = instruments.reduce((sum, instr) => {
    // Use the latest depreciation end value if available, else purchase cost
    const instrDep = depreciation
      .filter((d) => d.data.instrumentId === instr.id)
      .sort((a, b) => (a.data.year > b.data.year ? -1 : 1))
    return sum + (instrDep[0]?.data.endValue ?? instr.data.purchaseCost ?? 0)
  }, 0)

  // --- Book value chart: group depreciation by year, sum endValue across instruments ---
  const bookValueByYear: Record<string, number> = {}
  for (const dep of depreciation) {
    bookValueByYear[dep.data.year] = (bookValueByYear[dep.data.year] ?? 0) + dep.data.endValue
  }
  const bookValueData = Object.entries(bookValueByYear)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([year, value]) => ({ year, value: Math.round(value) }))

  // --- Maintenance cost chart: group by year ---
  const maintCostByYear: Record<string, number> = {}
  for (const m of maintenance) {
    const year = m.data.performedAt?.slice(0, 4)
    if (year) {
      maintCostByYear[year] = (maintCostByYear[year] ?? 0) + (m.data.cost ?? 0)
    }
  }
  const maintCostData = Object.entries(maintCostByYear)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([year, cost]) => ({ year, cost: Math.round(cost) }))

  // --- Total usage ---
  const totalUnits = usageStats.reduce((sum, s) => sum + (s.data.unitsTotal ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of the instrument inventory.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total instruments"
          value={totalInstruments}
          sub={`${checkedOut} checked out, ${inRepair} in repair`}
          icon={Music}
        />
        <KpiCard
          title="Open checkouts"
          value={openMovements}
          sub="instruments currently out"
          icon={ArrowRightLeft}
        />
        <KpiCard
          title="Total book value"
          value={euro(totalBookValue)}
          sub="based on depreciation schedule"
          icon={TrendingDown}
        />
        <KpiCard
          title="Total usage logged"
          value={`${totalUnits.toFixed(1)} units`}
          sub="across all instruments"
          icon={Wrench}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Book value over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book value over time</CardTitle>
          </CardHeader>
          <CardContent>
            {bookValueData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No depreciation data yet. Rebuild analytics from the Analytics page.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={bookValueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} width={60} />
                  <Tooltip formatter={(v: number) => euro(v)} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Book value"
                    stroke="hsl(var(--primary))"
                    fill="url(#bookValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Maintenance cost by year */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance cost by year</CardTitle>
          </CardHeader>
          <CardContent>
            {maintCostData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance records yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintCostData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} width={60} />
                  <Tooltip formatter={(v: number) => euro(v)} />
                  <Legend />
                  <Bar dataKey="cost" name="Maintenance cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

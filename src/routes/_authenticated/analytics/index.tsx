import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, TrendingDown, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  listDepreciation,
  listUsageStats,
  rebuildDepreciation,
  rebuildUsageStats,
} from '@/features/analytics/services/analyticsService'
import { listInstruments } from '@/features/instruments/services/instrumentService'

export const Route = createFileRoute('/_authenticated/analytics/')({
  component: AnalyticsPage,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AnalyticsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rebuilding, setRebuilding] = useState(false)
  const [rebuildError, setRebuildError] = useState<string | null>(null)
  const [rebuildSuccess, setRebuildSuccess] = useState(false)

  const { data: instruments = [] } = useQuery({
    queryKey: ['instruments'],
    queryFn: listInstruments,
  })

  const { data: depreciation = [], isLoading: depLoading } = useQuery({
    queryKey: ['depreciation'],
    queryFn: listDepreciation,
  })

  const { data: usageStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['usage_stats'],
    queryFn: listUsageStats,
  })

  // Build a name map for instruments
  const nameMap = Object.fromEntries(instruments.map((i) => [i.id, i.data.naam]))

  // Group depreciation by instrument (latest year = current book value)
  const depByInstrument: Record<
    string,
    { instrumentId: string; naam: string; years: typeof depreciation }
  > = {}
  for (const dep of depreciation) {
    const id = dep.data.instrumentId
    if (!depByInstrument[id]) {
      depByInstrument[id] = { instrumentId: id, naam: nameMap[id] ?? id, years: [] }
    }
    depByInstrument[id].years.push(dep)
  }
  // Sort years descending so [0] = most recent
  for (const row of Object.values(depByInstrument)) {
    row.years.sort((a, b) => (a.data.year > b.data.year ? -1 : 1))
  }
  const depRows = Object.values(depByInstrument).sort((a, b) =>
    a.naam.localeCompare(b.naam),
  )

  // Usage stats rows
  const statsRows = usageStats
    .map((s) => ({ ...s, naam: nameMap[s.id] ?? s.id }))
    .sort((a, b) => a.naam.localeCompare(b.naam))

  // ---------------------------------------------------------------------------
  // Rebuild mutation
  // ---------------------------------------------------------------------------

  const { mutate: runRebuild } = useMutation({
    mutationFn: async () => {
      setRebuilding(true)
      await rebuildDepreciation(instruments)
      await rebuildUsageStats(instruments)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depreciation'] })
      queryClient.invalidateQueries({ queryKey: ['usage_stats'] })
      setRebuildSuccess(true)
      setRebuildError(null)
      setRebuilding(false)
    },
    onError: (err) => {
      setRebuildError((err as Error).message)
      setRebuildSuccess(false)
      setRebuilding(false)
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('analytics.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => runRebuild()}
          disabled={rebuilding || instruments.length === 0}
        >
          <RefreshCw className={`mr-2 size-4 ${rebuilding ? 'animate-spin' : ''}`} />
          {rebuilding ? t('analytics.rebuilding') : t('analytics.rebuild')}
        </Button>
      </div>

      {/* Rebuild feedback */}
      {rebuildSuccess && (
        <div className="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {t('analytics.success')}
        </div>
      )}
      {rebuildError && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('analytics.error', { error: rebuildError })}
        </div>
      )}

      {/* Depreciation table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="size-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('analytics.depreciation.title')}</CardTitle>
              <CardDescription>
                {t('analytics.depreciation.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.depreciation.col.instrument')}</TableHead>
                  <TableHead className="text-right">{t('analytics.depreciation.col.year')}</TableHead>
                  <TableHead className="text-right">{t('analytics.depreciation.col.startValue')}</TableHead>
                  <TableHead className="text-right">{t('analytics.depreciation.col.annualDep')}</TableHead>
                  <TableHead className="text-right">{t('analytics.depreciation.col.endValue')}</TableHead>
                  <TableHead className="text-right">{t('analytics.depreciation.col.yearsOnRecord')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : depRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('analytics.depreciation.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  depRows.map((row) => {
                    const latest = row.years[0]
                    return (
                      <TableRow key={row.instrumentId}>
                        <TableCell className="font-medium">{row.naam}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{latest.data.year}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {euro(latest.data.startValue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          -{euro(latest.data.depreciation)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {euro(latest.data.endValue)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.years.length}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Usage stats table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('analytics.usage.title')}</CardTitle>
              <CardDescription>
                {t('analytics.usage.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.usage.col.instrument')}</TableHead>
                  <TableHead className="text-right">{t('analytics.usage.col.totalUnits')}</TableHead>
                  <TableHead className="text-right">{t('analytics.usage.col.perDay')}</TableHead>
                  <TableHead className="text-right">{t('analytics.usage.col.perWeek')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : statsRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('analytics.usage.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  statsRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.naam}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {round2(row.data.unitsTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {round2(row.data.unitsPerDay)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {round2(row.data.unitsPerWeek)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

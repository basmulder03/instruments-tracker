import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, TrendingDown, Activity, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
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
import { listMovements } from '@/features/operations/services/movementService'
import { calcAllCheckedOutDays } from '@/features/analytics/services/usageDaysService'
import { SortableHead } from '@/components/common/SortableHead'
import { useSorting } from '@/hooks/useSorting'

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
// Row types for sort
// ---------------------------------------------------------------------------

type DepSortKey = 'naam' | 'year' | 'startValue' | 'depreciation' | 'endValue' | 'yearsOnRecord'
type StatsSortKey = 'naam' | 'unitsTotal' | 'unitsPerDay' | 'unitsPerWeek'
type DaysSortKey = 'naam' | 'totalDays' | 'checkoutCount' | 'avgDays'

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

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: listMovements,
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
  const depRows = Object.values(depByInstrument)

  // Usage stats rows
  const statsRows = usageStats.map((s) => ({ ...s, naam: nameMap[s.id] ?? s.id }))

  // Days-checked-out per instrument (derived from movements, no rebuild needed)
  const daysMap = calcAllCheckedOutDays(movements)
  const daysRows = Array.from(daysMap.entries()).map(([instrumentId, totalDays]) => {
    const checkoutCount = movements.filter((m) => m.data.instrumentId === instrumentId).length
    return {
      instrumentId,
      naam: nameMap[instrumentId] ?? instrumentId,
      totalDays,
      checkoutCount,
      avgDays: checkoutCount > 0 ? Math.round(totalDays / checkoutCount) : 0,
    }
  })

  // ---------------------------------------------------------------------------
  // Sort state — one per table
  // ---------------------------------------------------------------------------

  type DepRow = (typeof depRows)[number]
  type StatsRow = (typeof statsRows)[number]
  type DaysRow = (typeof daysRows)[number]

  const getDepValue = useCallback((row: DepRow, key: DepSortKey) => {
    const latest = row.years[0]
    if (key === 'naam') return row.naam
    if (key === 'year') return latest?.data.year ?? 0
    if (key === 'startValue') return latest?.data.startValue ?? 0
    if (key === 'depreciation') return latest?.data.depreciation ?? 0
    if (key === 'endValue') return latest?.data.endValue ?? 0
    if (key === 'yearsOnRecord') return row.years.length
    return ''
  }, [])

  const getStatsValue = useCallback((row: StatsRow, key: StatsSortKey) => {
    if (key === 'naam') return row.naam
    if (key === 'unitsTotal') return row.data.unitsTotal
    if (key === 'unitsPerDay') return row.data.unitsPerDay
    if (key === 'unitsPerWeek') return row.data.unitsPerWeek
    return ''
  }, [])

  const getDaysValue = useCallback((row: DaysRow, key: DaysSortKey) => {
    if (key === 'naam') return row.naam
    if (key === 'totalDays') return row.totalDays
    if (key === 'checkoutCount') return row.checkoutCount
    if (key === 'avgDays') return row.avgDays
    return ''
  }, [])

  const { sortState: depSort, sorted: sortedDep, onSort: onDepSort } =
    useSorting<DepRow, DepSortKey>(depRows, getDepValue, 'naam')

  const { sortState: statsSort, sorted: sortedStats, onSort: onStatsSort } =
    useSorting<StatsRow, StatsSortKey>(statsRows, getStatsValue, 'naam')

  const { sortState: daysSort, sorted: sortedDays, onSort: onDaysSort } =
    useSorting<DaysRow, DaysSortKey>(daysRows, getDaysValue, 'totalDays', 'desc')

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
                  <SortableHead label={t('analytics.depreciation.col.instrument')} dir={depSort.key === 'naam' ? depSort.dir : null} onClick={() => onDepSort('naam')} />
                  <SortableHead label={t('analytics.depreciation.col.year')} dir={depSort.key === 'year' ? depSort.dir : null} onClick={() => onDepSort('year')} className="text-right" />
                  <SortableHead label={t('analytics.depreciation.col.startValue')} dir={depSort.key === 'startValue' ? depSort.dir : null} onClick={() => onDepSort('startValue')} className="text-right" />
                  <SortableHead label={t('analytics.depreciation.col.annualDep')} dir={depSort.key === 'depreciation' ? depSort.dir : null} onClick={() => onDepSort('depreciation')} className="text-right" />
                  <SortableHead label={t('analytics.depreciation.col.endValue')} dir={depSort.key === 'endValue' ? depSort.dir : null} onClick={() => onDepSort('endValue')} className="text-right" />
                  <SortableHead label={t('analytics.depreciation.col.yearsOnRecord')} dir={depSort.key === 'yearsOnRecord' ? depSort.dir : null} onClick={() => onDepSort('yearsOnRecord')} className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {depLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : sortedDep.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('analytics.depreciation.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDep.map((row) => {
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
                  <SortableHead label={t('analytics.usage.col.instrument')} dir={statsSort.key === 'naam' ? statsSort.dir : null} onClick={() => onStatsSort('naam')} />
                  <SortableHead label={t('analytics.usage.col.totalUnits')} dir={statsSort.key === 'unitsTotal' ? statsSort.dir : null} onClick={() => onStatsSort('unitsTotal')} className="text-right" />
                  <SortableHead label={t('analytics.usage.col.perDay')} dir={statsSort.key === 'unitsPerDay' ? statsSort.dir : null} onClick={() => onStatsSort('unitsPerDay')} className="text-right" />
                  <SortableHead label={t('analytics.usage.col.perWeek')} dir={statsSort.key === 'unitsPerWeek' ? statsSort.dir : null} onClick={() => onStatsSort('unitsPerWeek')} className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : sortedStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('analytics.usage.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStats.map((row) => (
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

      {/* Usage by days checked out */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('analytics.days.title')}</CardTitle>
              <CardDescription>{t('analytics.days.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label={t('analytics.days.col.instrument')} dir={daysSort.key === 'naam' ? daysSort.dir : null} onClick={() => onDaysSort('naam')} />
                  <SortableHead label={t('analytics.days.col.totalDays')} dir={daysSort.key === 'totalDays' ? daysSort.dir : null} onClick={() => onDaysSort('totalDays')} className="text-right" />
                  <SortableHead label={t('analytics.days.col.checkouts')} dir={daysSort.key === 'checkoutCount' ? daysSort.dir : null} onClick={() => onDaysSort('checkoutCount')} className="text-right" />
                  <SortableHead label={t('analytics.days.col.avgDays')} dir={daysSort.key === 'avgDays' ? daysSort.dir : null} onClick={() => onDaysSort('avgDays')} className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('analytics.days.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDays.map((row) => (
                    <TableRow key={row.instrumentId}>
                      <TableCell className="font-medium">{row.naam}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {row.totalDays}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.checkoutCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.avgDays}
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

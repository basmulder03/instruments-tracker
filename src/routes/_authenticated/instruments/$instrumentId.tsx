import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, LogIn, LogOut, Wrench, Activity, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInstrumentTimeline } from '@/features/history/services/historyService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
import { listMovementsForInstrument } from '@/features/operations/services/movementService'
import { calcCheckedOutDays } from '@/features/analytics/services/usageDaysService'
import { format, parseISO } from 'date-fns'

export const Route = createFileRoute('/_authenticated/instruments/$instrumentId')({
  component: InstrumentHistoryPage,
})

const KIND_ICON = {
  checkout: LogOut,
  return: LogIn,
  maintenance: Wrench,
  usage: Activity,
}

const KIND_COLOR: Record<string, string> = {
  checkout: 'bg-blue-500',
  return: 'bg-green-500',
  maintenance: 'bg-orange-500',
  usage: 'bg-purple-500',
}

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso), 'PPp')
  } catch {
    return iso
  }
}

function InstrumentHistoryPage() {
  const { t } = useTranslation()
  const { instrumentId } = Route.useParams()

  const { data: instruments = [] } = useQuery({
    queryKey: ['instruments'],
    queryFn: listInstruments,
  })

  const instrument = instruments.find((i) => i.id === instrumentId)

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['history', instrumentId],
    queryFn: () => getInstrumentTimeline(instrumentId),
    enabled: !!instrumentId,
  })

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', instrumentId],
    queryFn: () => listMovementsForInstrument(instrumentId),
    enabled: !!instrumentId,
  })

  const totalDaysOut = calcCheckedOutDays(movements)

  const KIND_LABEL: Record<string, string> = {
    checkout: t('instrumentHistory.kind.checkout'),
    return: t('instrumentHistory.kind.return'),
    maintenance: t('instrumentHistory.kind.maintenance'),
    usage: t('instrumentHistory.kind.usage'),
  }

  const MAINT_CATEGORY: Record<string, string> = {
    PADS: t('maintenance.cat.pads'),
    OVERHAUL: t('maintenance.cat.overhaul'),
    ADJUSTMENT: t('maintenance.cat.adjustment'),
    CLEANING: t('maintenance.cat.cleaning'),
    REPAIR_OTHER: t('maintenance.cat.repair'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/instruments">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {instrument ? instrument.data.naam : instrumentId}
          </h1>
          {instrument && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('instrumentHistory.subtitle', {
                type: instrument.data.type,
                brand: instrument.data.merk,
                id: instrumentId,
              })}
            </p>
          )}
        </div>
        {totalDaysOut > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="font-semibold">{totalDaysOut}</span>
            <span className="text-muted-foreground">{t('instrumentHistory.daysOut')}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t('instrumentHistory.historyTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('instrumentHistory.historySubtitle')}
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : timeline.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('instrumentHistory.empty')}</p>
      ) : (
        <ol className="relative ml-3 border-l border-border space-y-6">
          {timeline.map((event) => {
            const Icon = KIND_ICON[event.kind]
            const dot = KIND_COLOR[event.kind]

            return (
              <li key={event.id} className="ml-6">
                {/* Dot */}
                <span
                  className={`absolute -left-3 flex size-6 items-center justify-center rounded-full ${dot} text-white`}
                >
                  <Icon className="size-3" />
                </span>

                <div className="rounded-lg border bg-card p-4 shadow-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {KIND_LABEL[event.kind]}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {fmtDate(event.at)}
                    </span>
                  </div>

                  {/* Movement details */}
                  {(event.kind === 'checkout' || event.kind === 'return') && event.movement && (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>{t('instrumentHistory.movement', { id: event.movement.id })}</p>
                      {event.kind === 'checkout' && (
                        <p>{t('instrumentHistory.person', { id: event.movement.data.checkoutPersonId })}</p>
                      )}
                      {event.movement.data.notes && (
                        <p>{t('instrumentHistory.notes', { text: event.movement.data.notes })}</p>
                      )}
                      <Badge
                        variant={event.movement.data.status === 'OPEN' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {event.movement.data.status}
                      </Badge>
                    </div>
                  )}

                  {/* Maintenance details */}
                  {event.kind === 'maintenance' && event.maintenance && (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        {t('instrumentHistory.category', { cat: MAINT_CATEGORY[event.maintenance.data.category] ?? event.maintenance.data.category })}
                        {event.maintenance.data.isMajor && (
                          <Badge variant="destructive" className="ml-2 text-xs">{t('instrumentHistory.major')}</Badge>
                        )}
                      </p>
                      <p>{t('instrumentHistory.cost', { amount: event.maintenance.data.cost.toFixed(2) })}</p>
                      {event.maintenance.data.notes && (
                        <p>{t('instrumentHistory.notes', { text: event.maintenance.data.notes })}</p>
                      )}
                    </div>
                  )}

                  {/* Usage details */}
                  {event.kind === 'usage' && event.usage && (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        {t('instrumentHistory.usage', { units: event.usage.data.units, unitType: event.usage.data.unitType })}
                      </p>
                      {event.usage.data.notes && (
                        <p>{t('instrumentHistory.notes', { text: event.usage.data.notes })}</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

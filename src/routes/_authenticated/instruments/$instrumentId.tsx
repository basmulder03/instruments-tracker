import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, LogIn, LogOut, Wrench, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInstrumentTimeline } from '@/features/history/services/historyService'
import { listInstruments } from '@/features/instruments/services/instrumentService'
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

const KIND_LABEL = {
  checkout: 'Checked out',
  return: 'Returned',
  maintenance: 'Maintenance',
  usage: 'Usage logged',
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

  const MAINT_CATEGORY: Record<string, string> = {
    PADS: 'Pads',
    OVERHAUL: 'Overhaul',
    ADJUSTMENT: 'Adjustment',
    CLEANING: 'Cleaning',
    REPAIR_OTHER: 'Repair / Other',
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
        <div>
          <h1 className="text-2xl font-bold">
            {instrument ? instrument.data.naam : instrumentId}
          </h1>
          {instrument && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {instrument.data.type} · {instrument.data.merk} · {instrumentId}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">History</h2>
        <p className="text-sm text-muted-foreground">
          All movements, maintenance, and usage events — newest first.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : timeline.length === 0 ? (
        <p className="text-muted-foreground text-sm">No history recorded yet.</p>
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
                      <p>Movement: <span className="font-mono text-xs">{event.movement.id}</span></p>
                      {event.kind === 'checkout' && (
                        <p>Person ID: <span className="font-mono text-xs">{event.movement.data.checkoutPersonId}</span></p>
                      )}
                      {event.movement.data.notes && (
                        <p>Notes: {event.movement.data.notes}</p>
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
                        Category: {MAINT_CATEGORY[event.maintenance.data.category] ?? event.maintenance.data.category}
                        {event.maintenance.data.isMajor && (
                          <Badge variant="destructive" className="ml-2 text-xs">Major</Badge>
                        )}
                      </p>
                      <p>Cost: €{event.maintenance.data.cost.toFixed(2)}</p>
                      {event.maintenance.data.notes && (
                        <p>Notes: {event.maintenance.data.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Usage details */}
                  {event.kind === 'usage' && event.usage && (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        {event.usage.data.units} {event.usage.data.unitType}
                      </p>
                      {event.usage.data.notes && (
                        <p>Notes: {event.usage.data.notes}</p>
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

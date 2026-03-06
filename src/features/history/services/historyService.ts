/**
 * History Service — aggregates all events for a single instrument into a
 * unified, chronologically-sorted timeline.
 */

import {
  listMovementsForInstrument,
  type MovementWithId,
} from '@/features/operations/services/movementService'
import {
  listMaintenanceForInstrument,
  type MaintenanceWithId,
} from '@/features/operations/services/maintenanceService'
import {
  listUsageEventsForInstrument,
  type UsageEventWithId,
} from '@/features/operations/services/usageEventService'

// ---------------------------------------------------------------------------
// Unified timeline event
// ---------------------------------------------------------------------------

export type TimelineEventKind = 'checkout' | 'return' | 'maintenance' | 'usage'

export interface TimelineEvent {
  kind: TimelineEventKind
  /** ISO date/time string used for sorting */
  at: string
  id: string
  movement?: MovementWithId
  maintenance?: MaintenanceWithId
  usage?: UsageEventWithId
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getInstrumentTimeline(
  instrumentId: string,
): Promise<TimelineEvent[]> {
  const [movements, maintenances, usages] = await Promise.all([
    listMovementsForInstrument(instrumentId),
    listMaintenanceForInstrument(instrumentId),
    listUsageEventsForInstrument(instrumentId),
  ])

  const events: TimelineEvent[] = []

  for (const m of movements) {
    // Checkout event
    events.push({
      kind: 'checkout',
      at: m.data.checkoutAt,
      id: `checkout-${m.id}`,
      movement: m,
    })
    // Return event (only if closed)
    if (m.data.status === 'CLOSED' && m.data.returnAt) {
      events.push({
        kind: 'return',
        at: m.data.returnAt,
        id: `return-${m.id}`,
        movement: m,
      })
    }
  }

  for (const maint of maintenances) {
    events.push({
      kind: 'maintenance',
      at: maint.data.performedAt,
      id: `maint-${maint.id}`,
      maintenance: maint,
    })
  }

  for (const u of usages) {
    events.push({
      kind: 'usage',
      at: u.data.sessionAt,
      id: `usage-${u.id}`,
      usage: u,
    })
  }

  // Sort newest first
  events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

  return events
}

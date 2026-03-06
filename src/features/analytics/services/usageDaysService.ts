/**
 * usageDaysService
 *
 * Calculates how many calendar days each instrument has been checked out,
 * derived purely from the `movements` collection — no extra Firestore writes.
 *
 * For each movement:
 *  - CLOSED (has returnAt): days += differenceInCalendarDays(returnAt, checkoutAt)
 *  - OPEN   (no returnAt) : days += differenceInCalendarDays(today, checkoutAt)
 *
 * Minimum 1 day per movement so that same-day checkouts still register.
 */

import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { MovementWithId } from '@/features/operations/services/movementService'

// ---------------------------------------------------------------------------
// calcCheckedOutDays — total days for a single instrument's movements
// ---------------------------------------------------------------------------

export function calcCheckedOutDays(movements: MovementWithId[]): number {
  const today = new Date()
  let total = 0

  for (const m of movements) {
    const checkoutAt = parseISO(m.data.checkoutAt)
    const returnAt = m.data.returnAt ? parseISO(m.data.returnAt) : today
    total += Math.max(1, differenceInCalendarDays(returnAt, checkoutAt))
  }

  return total
}

// ---------------------------------------------------------------------------
// calcAllCheckedOutDays — Map<instrumentId, days> for an entire movement list
// ---------------------------------------------------------------------------

export function calcAllCheckedOutDays(
  movements: MovementWithId[],
): Map<string, number> {
  const today = new Date()
  const result = new Map<string, number>()

  for (const m of movements) {
    const checkoutAt = parseISO(m.data.checkoutAt)
    const returnAt = m.data.returnAt ? parseISO(m.data.returnAt) : today
    const days = Math.max(1, differenceInCalendarDays(returnAt, checkoutAt))
    result.set(m.data.instrumentId, (result.get(m.data.instrumentId) ?? 0) + days)
  }

  return result
}

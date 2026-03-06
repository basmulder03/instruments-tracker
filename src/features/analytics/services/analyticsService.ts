/**
 * Analytics Service
 *
 * Provides two kinds of functionality:
 *
 * 1. REBUILD — computes and writes `depreciation` and `usage_stats` documents
 *    to Firestore from the raw instrument / usage_events data. Called manually
 *    (admin "Rebuild analytics" button).
 *
 * 2. READ — fetches the pre-computed documents for display.
 *
 * Depreciation model: straight-line over `usefulLifeYears`.
 *   annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears
 *
 * Usage stats: sum of all usage_event.units per instrument, then derive
 * daily/weekly averages from the date range of recorded events.
 */

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Depreciation, UsageStats } from '@/lib/types/models'
import type { InstrumentWithId } from '@/features/instruments/services/instrumentService'
import { differenceInDays, parseISO, getYear } from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DepreciationWithId {
  id: string   // "{instrumentId}_{year}"
  data: Depreciation
}

export interface UsageStatsWithId {
  id: string   // instrumentId
  data: UsageStats
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

export async function listDepreciation(): Promise<DepreciationWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'depreciation'), orderBy('year')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Depreciation }))
}

export async function listDepreciationForInstrument(
  instrumentId: string,
): Promise<DepreciationWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, 'depreciation'),
      where('instrumentId', '==', instrumentId),
      orderBy('year'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Depreciation }))
}

export async function listUsageStats(): Promise<UsageStatsWithId[]> {
  const snap = await getDocs(collection(db, 'usage_stats'))
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as UsageStats }))
}

// ---------------------------------------------------------------------------
// REBUILD — Depreciation
// ---------------------------------------------------------------------------

export async function rebuildDepreciation(
  instruments: InstrumentWithId[],
): Promise<void> {
  const currentYear = getYear(new Date())

  for (const instr of instruments) {
    const {
      purchaseCost,
      salvageValue,
      usefulLifeYears,
      purchaseDate,
    } = instr.data

    if (!purchaseDate || !purchaseCost || !usefulLifeYears) continue

    const startYear = getYear(parseISO(purchaseDate))
    const endYr = startYear + usefulLifeYears - 1
    const annual = (purchaseCost - (salvageValue ?? 0)) / usefulLifeYears

    // Write one doc per year, from purchase year to max(endYr, currentYear)
    const upToYear = Math.max(endYr, currentYear)
    let value = purchaseCost

    for (let yr = startYear; yr <= upToYear; yr++) {
      const depreciation = yr > endYr ? 0 : annual
      const endValue = Math.max(salvageValue ?? 0, value - depreciation)
      const startValue = value

      const docId = `${instr.id}_${yr}`
      const depreciationDoc: Omit<Depreciation, 'updatedAt'> = {
        instrumentId: instr.id,
        year: String(yr),
        startValue,
        depreciation: yr > endYr ? 0 : annual,
        endValue,
      }

      await setDoc(doc(db, 'depreciation', docId), {
        ...depreciationDoc,
        updatedAt: serverTimestamp(),
      })

      value = endValue
    }
  }
}

// ---------------------------------------------------------------------------
// REBUILD — Usage Stats
// ---------------------------------------------------------------------------

export async function rebuildUsageStats(
  instruments: InstrumentWithId[],
): Promise<void> {
  for (const instr of instruments) {
    const snap = await getDocs(
      query(
        collection(db, 'usage_events'),
        where('instrumentId', '==', instr.id),
        orderBy('sessionAt'),
      ),
    )

    if (snap.empty) continue

    let total = 0
    let earliest: Date | null = null
    let latest: Date | null = null

    snap.forEach((d) => {
      const data = d.data()
      total += data.units as number
      const date = parseISO(data.sessionAt as string)
      if (!earliest || date < earliest) earliest = date
      if (!latest || date > latest) latest = date
    })

    const days = earliest && latest
      ? Math.max(1, differenceInDays(latest, earliest) + 1)
      : 1

    const statsDoc: Omit<UsageStats, 'updatedAt'> = {
      instrumentId: instr.id,
      unitsTotal: total,
      unitsPerDay: total / days,
      unitsPerWeek: (total / days) * 7,
    }

    await setDoc(doc(db, 'usage_stats', instr.id), {
      ...statsDoc,
      updatedAt: serverTimestamp(),
    })
  }
}

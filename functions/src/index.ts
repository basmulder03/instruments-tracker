/**
 * Cloud Functions for Instruments Tracker
 *
 * Scheduled functions (firebase-functions v2):
 *   1. rebuildDepreciationStats  — daily, recomputes depreciation docs
 *   2. rebuildUsageStats         — daily, recomputes usage_stats docs
 *   3. expireInvitations         — daily, marks expired invitations
 *   4. pruneAuditLog             — weekly, deletes audit entries older than retention window
 */

import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions/v2'

admin.initializeApp()

const db = admin.firestore()

// ---------------------------------------------------------------------------
// 1. Rebuild depreciation stats
// ---------------------------------------------------------------------------

export const rebuildDepreciationStats = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' },
  async () => {
    logger.info('rebuildDepreciationStats: starting')

    const instrumentsSnap = await db.collection('instruments').get()
    const now = new Date()
    const currentYear = now.getFullYear()

    const batch = db.batch()

    for (const instrDoc of instrumentsSnap.docs) {
      const instr = instrDoc.data()
      const purchaseCost: number = instr.purchaseCost ?? 0
      const usefulLifeYears: number = instr.usefulLifeYears ?? 5
      const salvageValue: number = instr.salvageValue ?? 0
      const purchaseDate: string = instr.purchaseDate ?? ''

      if (!purchaseDate || usefulLifeYears <= 0) continue

      const purchaseYear = parseInt(purchaseDate.substring(0, 4), 10)
      if (isNaN(purchaseYear)) continue

      const annualDep = (purchaseCost - salvageValue) / usefulLifeYears

      // Write or overwrite depreciation docs for every year from purchase year to current year
      for (let year = purchaseYear; year <= currentYear; year++) {
        const yearsElapsed = year - purchaseYear
        const startValue = Math.max(salvageValue, purchaseCost - annualDep * yearsElapsed)
        const depreciation = yearsElapsed < usefulLifeYears ? annualDep : 0
        const endValue = Math.max(salvageValue, startValue - depreciation)

        const docRef = db
          .collection('depreciation')
          .doc(`${instrDoc.id}_${year}`)

        batch.set(docRef, {
          instrumentId: instrDoc.id,
          year,
          startValue: Math.round(startValue * 100) / 100,
          depreciation: Math.round(depreciation * 100) / 100,
          endValue: Math.round(endValue * 100) / 100,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }

    await batch.commit()
    logger.info('rebuildDepreciationStats: done')
  },
)

// ---------------------------------------------------------------------------
// 2. Rebuild usage stats
// ---------------------------------------------------------------------------

export const rebuildUsageStats = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' },
  async () => {
    logger.info('rebuildUsageStats: starting')

    const usageSnap = await db.collection('usage_events').get()

    // Accumulate totals per instrument
    const totals: Record<string, number> = {}
    const firstDate: Record<string, Date> = {}
    const lastDate: Record<string, Date> = {}

    for (const doc of usageSnap.docs) {
      const data = doc.data()
      const id: string = data.instrumentId
      const units: number = data.units ?? 0
      const dateStr: string = data.date ?? ''
      const date = new Date(dateStr)

      totals[id] = (totals[id] ?? 0) + units
      if (!firstDate[id] || date < firstDate[id]) firstDate[id] = date
      if (!lastDate[id] || date > lastDate[id]) lastDate[id] = date
    }

    const batch = db.batch()

    for (const [instrumentId, unitsTotal] of Object.entries(totals)) {
      const first = firstDate[instrumentId]
      const last = lastDate[instrumentId]
      const daySpan = first && last
        ? Math.max(1, Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1)
        : 1

      const unitsPerDay = unitsTotal / daySpan
      const unitsPerWeek = unitsPerDay * 7

      const docRef = db.collection('usage_stats').doc(instrumentId)
      batch.set(docRef, {
        instrumentId,
        unitsTotal: Math.round(unitsTotal * 100) / 100,
        unitsPerDay: Math.round(unitsPerDay * 100) / 100,
        unitsPerWeek: Math.round(unitsPerWeek * 100) / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
    logger.info('rebuildUsageStats: done')
  },
)

// ---------------------------------------------------------------------------
// 3. Expire invitations
// ---------------------------------------------------------------------------

export const expireInvitations = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' },
  async () => {
    logger.info('expireInvitations: starting')

    const now = admin.firestore.Timestamp.now()
    const snap = await db
      .collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now)
      .get()

    if (snap.empty) {
      logger.info('expireInvitations: no expired invitations found')
      return
    }

    const batch = db.batch()
    for (const doc of snap.docs) {
      batch.update(doc.ref, {
        status: 'expired',
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
    logger.info(`expireInvitations: expired ${snap.size} invitations`)
  },
)

// ---------------------------------------------------------------------------
// 4. Prune audit log
// ---------------------------------------------------------------------------

/**
 * Default retention: 365 days.
 * Override by setting a Firestore document at /config/auditRetention
 * with field `retentionDays: number`.
 */
const DEFAULT_RETENTION_DAYS = 365

export const pruneAuditLog = onSchedule(
  { schedule: 'every monday 02:00', timeZone: 'Europe/Amsterdam' },
  async () => {
    logger.info('pruneAuditLog: starting')

    // Read optional retention config
    let retentionDays = DEFAULT_RETENTION_DAYS
    try {
      const configDoc = await db.collection('config').doc('auditRetention').get()
      if (configDoc.exists) {
        const val = configDoc.data()?.retentionDays
        if (typeof val === 'number' && val > 0) retentionDays = val
      }
    } catch (e) {
      logger.warn('pruneAuditLog: could not read config/auditRetention, using default', e)
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff)

    logger.info(`pruneAuditLog: deleting entries older than ${cutoff.toISOString()} (retention: ${retentionDays} days)`)

    // Firestore delete in batches of 500
    let totalDeleted = 0
    let hasMore = true

    while (hasMore) {
      const snap = await db
        .collection('audit_log')
        .where('timestamp', '<', cutoffTs)
        .limit(500)
        .get()

      if (snap.empty) {
        hasMore = false
        break
      }

      const batch = db.batch()
      for (const doc of snap.docs) {
        batch.delete(doc.ref)
      }
      await batch.commit()
      totalDeleted += snap.size

      if (snap.size < 500) hasMore = false
    }

    logger.info(`pruneAuditLog: deleted ${totalDeleted} entries`)
  },
)

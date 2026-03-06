/**
 * Audit Log Service — queries audit_log collection and verifies the hash chain.
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { AuditLog } from '@/lib/types/models'

export interface AuditLogWithId {
  id: string
  data: AuditLog
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listAuditLogs(
  pageSize = 50,
  after?: DocumentSnapshot,
): Promise<{ entries: AuditLogWithId[]; lastDoc: DocumentSnapshot | null }> {
  const constraints = [
    orderBy('timestamp', 'desc'),
    limit(pageSize),
    ...(after ? [startAfter(after)] : []),
  ]

  const snap = await getDocs(query(collection(db, 'audit_log'), ...constraints))

  const entries = snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as AuditLog,
  }))

  const lastDoc = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null

  return { entries, lastDoc }
}

// ---------------------------------------------------------------------------
// Chain verification (client-side)
// ---------------------------------------------------------------------------

export type VerificationResult =
  | { ok: true }
  | { ok: false; brokenAt: string; message: string }

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies that each entry's rowHash matches what we'd compute from its fields,
 * and that prevHash chains correctly to the prior entry.
 *
 * Entries must be provided in ascending chronological order.
 */
export async function verifyAuditChain(
  entries: AuditLogWithId[],
): Promise<VerificationResult> {
  let expectedPrev = ''

  for (const entry of entries) {
    const d = entry.data
    const canonical = JSON.stringify({
      userId: d.userId,
      userEmail: d.userEmail,
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId,
      details: typeof d.details === 'string' ? JSON.parse(d.details) : d.details,
      prevHash: d.prevHash,
    })
    const expected = await sha256(canonical)

    if (d.prevHash !== expectedPrev) {
      return {
        ok: false,
        brokenAt: entry.id,
        message: `prevHash mismatch on entry ${entry.id}`,
      }
    }

    if (d.rowHash !== expected) {
      return {
        ok: false,
        brokenAt: entry.id,
        message: `rowHash mismatch on entry ${entry.id}`,
      }
    }

    expectedPrev = d.rowHash
  }

  return { ok: true }
}

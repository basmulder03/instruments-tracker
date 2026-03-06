/**
 * Audit Logger — writes tamper-evident audit entries to Firestore.
 *
 * Each entry contains:
 *   - prevHash: SHA-256 hash of the previous entry (empty string for first)
 *   - rowHash:  SHA-256 hash of this entry's canonical fields + prevHash
 *
 * This creates a hash chain that makes silent tampering detectable.
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { generateNextId } from '@/lib/idGenerator'
import type { AuditLog } from '@/lib/types/models'

// ---------------------------------------------------------------------------
// SHA-256 helper (Web Crypto API — available in all modern browsers)
// ---------------------------------------------------------------------------

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AuditPayload {
  userId: string
  userEmail: string
  action: string          // e.g. "CREATE" | "UPDATE" | "DELETE" | "CHECKOUT" | "RETURN"
  entityType: string      // e.g. "Instrument" | "Movement" | "Maintenance"
  entityId: string
  details: Record<string, unknown>
}

export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  // 1. Fetch the most recent audit entry to get its rowHash
  const prevSnap = await getDocs(
    query(
      collection(db, 'audit_log'),
      orderBy('timestamp', 'desc'),
      limit(1),
    ),
  )

  const prevHash =
    prevSnap.empty ? '' : (prevSnap.docs[0].data().rowHash as string) ?? ''

  // 2. Compute rowHash for this entry
  const canonical = JSON.stringify({
    userId: payload.userId,
    userEmail: payload.userEmail,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    details: payload.details,
    prevHash,
  })
  const rowHash = await sha256(canonical)

  // 3. Generate next audit ID
  const auditId = await generateNextId('audit_log')

  // 4. Write to Firestore (no merge — audit entries are append-only)
  const entry: Omit<AuditLog, 'timestamp'> & { timestamp: ReturnType<typeof serverTimestamp> } = {
    timestamp: serverTimestamp(),
    userId: payload.userId,
    userEmail: payload.userEmail,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    details: JSON.stringify(payload.details),
    prevHash,
    rowHash,
  }

  await setDoc(doc(db, 'audit_log', auditId), entry)
}

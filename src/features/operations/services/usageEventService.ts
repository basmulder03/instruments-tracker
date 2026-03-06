import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { generateNextId } from '@/lib/idGenerator'
import { writeAuditLog } from '@/lib/auditLogger'
import type { UsageEvent } from '@/lib/types/models'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsageEventWithId {
  id: string
  data: UsageEvent
}

export type UsageEventInput = Omit<
  UsageEvent,
  'createdAt' | 'updatedAt' | 'createdBy'
>

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listUsageEventsForInstrument(
  instrumentId: string,
): Promise<UsageEventWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, 'usage_events'),
      where('instrumentId', '==', instrumentId),
      orderBy('sessionAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as UsageEvent }))
}

export async function listAllUsageEvents(): Promise<UsageEventWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'usage_events'), orderBy('sessionAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as UsageEvent }))
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createUsageEvent(
  input: UsageEventInput,
  createdBy: string,
  userEmail: string,
): Promise<string> {
  const id = await generateNextId('usage_events')

  await setDoc(doc(db, 'usage_events', id), {
    ...input,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    userId: createdBy,
    userEmail,
    action: 'CREATE',
    entityType: 'UsageEvent',
    entityId: id,
    details: {
      instrumentId: input.instrumentId,
      units: input.units,
      unitType: input.unitType,
      sessionAt: input.sessionAt,
    },
  })

  return id
}

export async function updateUsageEvent(
  id: string,
  input: Partial<UsageEventInput>,
  userId: string,
  userEmail: string,
): Promise<void> {
  await updateDoc(doc(db, 'usage_events', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    userId,
    userEmail,
    action: 'UPDATE',
    entityType: 'UsageEvent',
    entityId: id,
    details: input as Record<string, unknown>,
  })
}

export async function deleteUsageEvent(
  id: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  await deleteDoc(doc(db, 'usage_events', id))

  await writeAuditLog({
    userId,
    userEmail,
    action: 'DELETE',
    entityType: 'UsageEvent',
    entityId: id,
    details: {},
  })
}

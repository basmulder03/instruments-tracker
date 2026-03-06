/**
 * Movement Service — checkout and return operations.
 *
 * Checkout:
 *   1. Create a Movement document with status OPEN
 *   2. Update Instrument.currentStatus = CHECKED_OUT, currentPersonId
 *   3. Write audit log entry
 *
 * Return:
 *   1. Update Movement: status = CLOSED, returnAt, returnLocationId
 *   2. Update Instrument.currentStatus = IN_STORAGE, currentPersonId = ''
 *   3. Write audit log entry
 */

import {
  collection,
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
import type { Movement } from '@/lib/types/models'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MovementWithId {
  id: string
  data: Movement
}

export interface CheckoutInput {
  instrumentId: string
  checkoutPersonId: string
  checkoutLocationId: string
  checkoutAt: string    // ISO timestamp string
  notes: string
}

export interface ReturnInput {
  returnLocationId: string
  returnAt: string      // ISO timestamp string
  notes: string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listMovements(): Promise<MovementWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'movements'), orderBy('checkoutAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Movement }))
}

export async function listMovementsForInstrument(
  instrumentId: string,
): Promise<MovementWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, 'movements'),
      where('instrumentId', '==', instrumentId),
      orderBy('checkoutAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Movement }))
}

export async function getOpenMovement(
  instrumentId: string,
): Promise<MovementWithId | null> {
  const snap = await getDocs(
    query(
      collection(db, 'movements'),
      where('instrumentId', '==', instrumentId),
      where('status', '==', 'OPEN'),
    ),
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, data: d.data() as Movement }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function checkoutInstrument(
  input: CheckoutInput,
  createdBy: string,
  userEmail: string,
): Promise<string> {
  const movementId = await generateNextId('movements')

  const movement: Omit<Movement, 'createdAt' | 'updatedAt'> = {
    instrumentId: input.instrumentId,
    checkoutPersonId: input.checkoutPersonId,
    checkoutLocationId: input.checkoutLocationId,
    checkoutAt: input.checkoutAt,
    returnLocationId: '',
    returnAt: '',
    status: 'OPEN',
    notes: input.notes,
    createdBy,
  }

  await setDoc(doc(db, 'movements', movementId), {
    ...movement,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Update instrument status
  await updateDoc(doc(db, 'instruments', input.instrumentId), {
    currentStatus: 'CHECKED_OUT',
    currentPersonId: input.checkoutPersonId,
    updatedAt: serverTimestamp(),
  })

  // Audit
  await writeAuditLog({
    userId: createdBy,
    userEmail,
    action: 'CHECKOUT',
    entityType: 'Movement',
    entityId: movementId,
    details: {
      instrumentId: input.instrumentId,
      checkoutPersonId: input.checkoutPersonId,
      checkoutAt: input.checkoutAt,
    },
  })

  return movementId
}

export async function returnInstrument(
  movementId: string,
  instrumentId: string,
  input: ReturnInput,
  userId: string,
  userEmail: string,
): Promise<void> {
  await updateDoc(doc(db, 'movements', movementId), {
    status: 'CLOSED',
    returnLocationId: input.returnLocationId,
    returnAt: input.returnAt,
    notes: input.notes,
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'instruments', instrumentId), {
    currentStatus: 'IN_STORAGE',
    currentPersonId: '',
    currentLocationId: input.returnLocationId,
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    userId,
    userEmail,
    action: 'RETURN',
    entityType: 'Movement',
    entityId: movementId,
    details: {
      instrumentId,
      returnLocationId: input.returnLocationId,
      returnAt: input.returnAt,
    },
  })
}

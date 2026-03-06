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
import type { Maintenance } from '@/lib/types/models'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaintenanceWithId {
  id: string
  data: Maintenance
}

export type MaintenanceInput = Omit<
  Maintenance,
  'createdAt' | 'updatedAt' | 'createdBy'
>

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listMaintenanceForInstrument(
  instrumentId: string,
): Promise<MaintenanceWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, 'maintenance'),
      where('instrumentId', '==', instrumentId),
      orderBy('performedAt', 'desc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Maintenance }))
}

export async function listAllMaintenance(): Promise<MaintenanceWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'maintenance'), orderBy('performedAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Maintenance }))
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createMaintenance(
  input: MaintenanceInput,
  createdBy: string,
  userEmail: string,
): Promise<string> {
  const id = await generateNextId('maintenance')

  await setDoc(doc(db, 'maintenance', id), {
    ...input,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    userId: createdBy,
    userEmail,
    action: 'CREATE',
    entityType: 'Maintenance',
    entityId: id,
    details: { instrumentId: input.instrumentId, category: input.category, cost: input.cost },
  })

  return id
}

export async function updateMaintenance(
  id: string,
  input: Partial<MaintenanceInput>,
  userId: string,
  userEmail: string,
): Promise<void> {
  await updateDoc(doc(db, 'maintenance', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    userId,
    userEmail,
    action: 'UPDATE',
    entityType: 'Maintenance',
    entityId: id,
    details: input as Record<string, unknown>,
  })
}

export async function deleteMaintenance(
  id: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  await deleteDoc(doc(db, 'maintenance', id))

  await writeAuditLog({
    userId,
    userEmail,
    action: 'DELETE',
    entityType: 'Maintenance',
    entityId: id,
    details: {},
  })
}

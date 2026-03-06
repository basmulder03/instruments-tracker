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
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { generateNextId } from '@/lib/idGenerator'
import type { Location } from '@/lib/types/models'

export interface LocationWithId {
  id: string
  data: Location
}

export async function listLocations(): Promise<LocationWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'locations'), orderBy('naam')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Location }))
}

export type LocationInput = Omit<
  Location,
  'createdAt' | 'updatedAt' | 'createdBy'
>

export async function createLocation(
  input: LocationInput,
  createdBy: string,
): Promise<string> {
  const id = await generateNextId('locations')
  await setDoc(doc(db, 'locations', id), {
    ...input,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

export async function updateLocation(
  id: string,
  input: Partial<LocationInput>,
): Promise<void> {
  await updateDoc(doc(db, 'locations', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteLocation(id: string): Promise<void> {
  await deleteDoc(doc(db, 'locations', id))
}

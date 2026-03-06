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
import type { Person } from '@/lib/types/models'

export interface PersonWithId {
  id: string
  data: Person
}

export async function listPeople(): Promise<PersonWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'people'), orderBy('naam')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Person }))
}

export type PersonInput = Omit<Person, 'createdAt' | 'updatedAt' | 'createdBy'>

export async function createPerson(
  input: PersonInput,
  createdBy: string,
): Promise<string> {
  const id = await generateNextId('people')
  await setDoc(doc(db, 'people', id), {
    ...input,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

export async function updatePerson(
  id: string,
  input: Partial<PersonInput>,
): Promise<void> {
  await updateDoc(doc(db, 'people', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePerson(id: string): Promise<void> {
  await deleteDoc(doc(db, 'people', id))
}

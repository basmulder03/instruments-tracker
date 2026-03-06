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
import type { Instrument } from '@/lib/types/models'

export interface InstrumentWithId {
  id: string
  data: Instrument
}

export async function listInstruments(): Promise<InstrumentWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'instruments'), orderBy('naam')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as Instrument }))
}

export type InstrumentInput = Omit<
  Instrument,
  'createdAt' | 'updatedAt' | 'createdBy'
>

export async function createInstrument(
  input: InstrumentInput,
  createdBy: string,
): Promise<string> {
  const id = await generateNextId('instruments')
  await setDoc(doc(db, 'instruments', id), {
    ...input,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

export async function updateInstrument(
  id: string,
  input: Partial<InstrumentInput>,
): Promise<void> {
  await updateDoc(doc(db, 'instruments', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteInstrument(id: string): Promise<void> {
  await deleteDoc(doc(db, 'instruments', id))
}

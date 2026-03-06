import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { User } from '@/lib/types/users'

// ---------------------------------------------------------------------------
// Shape returned by list queries — includes the Firestore doc ID (uid)
// ---------------------------------------------------------------------------

export interface UserWithId {
  id: string   // Firebase Auth UID / Firestore doc ID
  data: User
}

// ---------------------------------------------------------------------------
// listUsers — returns all users ordered by displayName
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<UserWithId[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('displayName')),
  )
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as User }))
}

// ---------------------------------------------------------------------------
// setUserStatus — activate / deactivate / suspend a user
// ---------------------------------------------------------------------------

export async function setUserStatus(
  uid: string,
  status: User['status'],
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    status,
    updatedAt: serverTimestamp(),
  })
}

// ---------------------------------------------------------------------------
// updateUserRoleAndPermissions — change role + permission set
// ---------------------------------------------------------------------------

export async function updateUserRoleAndPermissions(
  uid: string,
  role: string,
  permissions: string[],
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role,
    permissions,
    updatedAt: serverTimestamp(),
  })
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Role } from '@/lib/types/users'

// ---------------------------------------------------------------------------
// RoleData — what callers provide (no timestamps)
// ---------------------------------------------------------------------------

export interface RoleData {
  name: string
  description: string
  permissions: string[]
}

// ---------------------------------------------------------------------------
// createRole — adds a new custom role; returns the new Firestore doc ID
// ---------------------------------------------------------------------------

export async function createRole(data: RoleData): Promise<string> {
  const ref = await addDoc(collection(db, 'roles'), {
    ...data,
    isSystem: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

// ---------------------------------------------------------------------------
// updateRole — updates name, description and/or permissions of a custom role
// ---------------------------------------------------------------------------

export async function updateRole(roleId: string, data: Partial<RoleData>): Promise<void> {
  await updateDoc(doc(db, 'roles', roleId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ---------------------------------------------------------------------------
// deleteRole — removes a custom role.
// Throws if the role is still assigned to at least one user.
// ---------------------------------------------------------------------------

export async function deleteRole(roleId: string): Promise<void> {
  // Guard: reject if any user currently has this role
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('role', '==', roleId)),
  )
  if (!usersSnap.empty) {
    throw new Error(
      `Cannot delete role "${roleId}": it is assigned to ${usersSnap.size} user(s). Reassign those users first.`,
    )
  }
  await deleteDoc(doc(db, 'roles', roleId))
}

// ---------------------------------------------------------------------------
// RoleWithId — shape returned by list queries
// ---------------------------------------------------------------------------

export interface RoleWithId {
  id: string
  data: Role
}

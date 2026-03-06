import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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

// ---------------------------------------------------------------------------
// Audit log retention config — Firestore doc: config/auditRetention
// ---------------------------------------------------------------------------

export interface AuditRetentionConfig {
  retentionDays: number
}

export async function getAuditRetentionConfig(): Promise<AuditRetentionConfig> {
  const snap = await getDoc(doc(db, 'config', 'auditRetention'))
  if (snap.exists()) {
    return snap.data() as AuditRetentionConfig
  }
  return { retentionDays: 365 }
}

export async function setAuditRetentionConfig(
  retentionDays: number,
): Promise<void> {
  await setDoc(
    doc(db, 'config', 'auditRetention'),
    { retentionDays },
    { merge: true },
  )
}

// ---------------------------------------------------------------------------
// User data export — returns a JSON-serialisable snapshot of all records
// tied to the given UID.
// ---------------------------------------------------------------------------

export interface UserDataExport {
  uid: string
  profile: User | null
  movements: unknown[]
  maintenanceRecords: unknown[]
  auditLogs: unknown[]
}

export async function exportUserData(uid: string): Promise<UserDataExport> {
  const [profileSnap, movementsSnap, maintenanceSnap, auditSnap] =
    await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDocs(query(collection(db, 'movements'), where('createdBy', '==', uid))),
      getDocs(query(collection(db, 'maintenance'), where('createdBy', '==', uid))),
      getDocs(query(collection(db, 'auditLog'), where('userId', '==', uid))),
    ])

  return {
    uid,
    profile: profileSnap.exists() ? (profileSnap.data() as User) : null,
    movements: movementsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    maintenanceRecords: maintenanceSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    auditLogs: auditSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  }
}

// ---------------------------------------------------------------------------
// Anonymise user — replaces personal fields with anonymised-<uid>@deleted.
// Operational records (movements, maintenance, audit) are kept intact — only
// the Firestore `users` doc is scrubbed.
// ---------------------------------------------------------------------------

export async function anonymiseUser(uid: string): Promise<void> {
  const anonymisedEmail = `anonymised-${uid}@deleted`
  await updateDoc(doc(db, 'users', uid), {
    email: anonymisedEmail,
    displayName: 'Anonymised User',
    status: 'inactive',
    preferences: {
      theme: 'light',
      language: 'en',
      defaultView: '/dashboard',
      notificationsEnabled: false,
    },
    updatedAt: serverTimestamp(),
  })
}

// ---------------------------------------------------------------------------
// Hard-delete user — permanently removes the Firestore `users` doc.
// NOTE: Firebase Auth account deletion requires a Cloud Function or Admin SDK
// and cannot be done client-side. This removes the app record only.
// ---------------------------------------------------------------------------

export async function hardDeleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid))
}

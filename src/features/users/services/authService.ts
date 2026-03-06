import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import type { User, UserPreferences } from '@/lib/types/users'
import { SYSTEM_ROLES_MAP } from '@/lib/roles'

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

// ---------------------------------------------------------------------------
// Change password (requires recent sign-in)
// ---------------------------------------------------------------------------

export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await updatePassword(user, newPassword)
}

// ---------------------------------------------------------------------------
// Check if any admin user exists (used to gate the register page)
// ---------------------------------------------------------------------------

export async function hasAdminUser(): Promise<boolean> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'admin'),
    where('status', '==', 'active'),
    limit(1),
  )
  const snap = await getDocs(q)
  return !snap.empty
}

// ---------------------------------------------------------------------------
// Register first admin
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  defaultView: '/dashboard',
  notificationsEnabled: true,
}

export async function registerFirstAdmin(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  // Guard: only allowed when no admin exists yet
  const adminExists = await hasAdminUser()
  if (adminExists) {
    throw new Error('An administrator account already exists. Use the invitation system to add new users.')
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { uid } = credential.user

  const adminRole = SYSTEM_ROLES_MAP.get('admin')
  const adminDoc: User = {
    email,
    displayName,
    role: 'admin',
    permissions: adminRole?.data.permissions ?? ['*:*'],
    status: 'active',
    preferences: DEFAULT_PREFERENCES,
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
    createdBy: 'system',
  }

  await setDoc(doc(db, 'users', uid), adminDoc)
  return credential.user
}

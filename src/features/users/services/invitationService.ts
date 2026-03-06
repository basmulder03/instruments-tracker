import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/config/firebase'
import type { Invitation, User, UserPreferences } from '@/lib/types/users'
import { generateNextId } from '@/lib/idGenerator'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  defaultView: '/dashboard',
  notificationsEnabled: true,
}

// ---------------------------------------------------------------------------
// inviteUser — called by an admin to create a pending invitation
// ---------------------------------------------------------------------------

export interface InviteUserParams {
  email: string
  role: string
  permissions?: string[]
}

export async function inviteUser(
  params: InviteUserParams,
  inviterUid: string,
): Promise<{ invitationId: string; token: string }> {
  const { email, role, permissions = [] } = params

  // Ensure no pending invitation already exists for this email
  const existingQ = query(
    collection(db, 'invitations'),
    where('email', '==', email),
    where('status', '==', 'pending'),
  )
  const existingSnap = await getDocs(existingQ)
  if (!existingSnap.empty) {
    throw new Error(`A pending invitation already exists for ${email}.`)
  }

  const invitationId = await generateNextId('invitations')
  const token = generateToken()
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromDate(new Date(now.toMillis() + 7 * 24 * 60 * 60 * 1000))

  const invitation: Invitation = {
    email,
    role,
    permissions,
    invitedBy: inviterUid,
    invitedAt: now,
    expiresAt,
    status: 'pending',
    token,
  }

  await setDoc(doc(db, 'invitations', invitationId), invitation)
  return { invitationId, token }
}

// ---------------------------------------------------------------------------
// getInvitationByToken — fetches a pending invitation by its token
// ---------------------------------------------------------------------------

export interface InvitationWithId {
  id: string
  data: Invitation
}

export async function getInvitationByToken(token: string): Promise<InvitationWithId | null> {
  const q = query(collection(db, 'invitations'), where('token', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, data: docSnap.data() as Invitation }
}

// ---------------------------------------------------------------------------
// acceptInvitation — creates a Firebase Auth user + Firestore user doc
// ---------------------------------------------------------------------------

export interface AcceptInvitationParams {
  token: string
  password: string
  displayName: string
}

export async function acceptInvitation(params: AcceptInvitationParams): Promise<void> {
  const { token, password, displayName } = params

  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    throw new Error('Invitation not found or already used.')
  }

  const { id: invitationId, data } = invitation

  if (data.status !== 'pending') {
    throw new Error('This invitation has already been used or has been cancelled.')
  }

  if (data.expiresAt.toMillis() < Date.now()) {
    // Mark expired
    await updateDoc(doc(db, 'invitations', invitationId), { status: 'expired' })
    throw new Error('This invitation has expired. Ask an administrator to send a new one.')
  }

  // Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, data.email, password)
  const { uid } = credential.user

  // Create Firestore user doc
  const userDoc: User = {
    email: data.email,
    displayName,
    role: data.role,
    permissions: data.permissions,
    status: 'active',
    preferences: DEFAULT_PREFERENCES,
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
    createdBy: data.invitedBy,
  }

  await setDoc(doc(db, 'users', uid), userDoc)

  // Mark invitation as accepted
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  })
}

// ---------------------------------------------------------------------------
// cancelInvitation — admin can cancel a pending invitation
// ---------------------------------------------------------------------------

export async function cancelInvitation(invitationId: string): Promise<void> {
  const invRef = doc(db, 'invitations', invitationId)
  const snap = await getDoc(invRef)
  if (!snap.exists()) throw new Error('Invitation not found.')
  if (snap.data().status !== 'pending') {
    throw new Error('Only pending invitations can be cancelled.')
  }
  await updateDoc(invRef, { status: 'cancelled' })
}

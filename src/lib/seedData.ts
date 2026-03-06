import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SYSTEM_PERMISSIONS } from '@/lib/permissions';
import { SYSTEM_ROLES } from '@/lib/roles';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Seeds all entries from `SYSTEM_PERMISSIONS` into the `permissions`
 * Firestore collection. Uses `setDoc` with merge so re-runs are idempotent.
 */
async function seedPermissions(): Promise<void> {
  const writes = SYSTEM_PERMISSIONS.map(({ id, data }) =>
    setDoc(doc(db, 'permissions', id), data, { merge: true }),
  );
  await Promise.all(writes);
  console.log(`[seed] Seeded ${SYSTEM_PERMISSIONS.length} permissions.`);
}

/**
 * Seeds all entries from `SYSTEM_ROLES` into the `roles` Firestore
 * collection. Uses `setDoc` with merge so re-runs are idempotent.
 */
async function seedRoles(): Promise<void> {
  const now = serverTimestamp();

  const writes = SYSTEM_ROLES.map(({ id, data }) =>
    setDoc(
      doc(db, 'roles', id),
      { ...data, createdAt: now, updatedAt: now },
      { merge: true },
    ),
  );

  await Promise.all(writes);
  console.log(`[seed] Seeded ${SYSTEM_ROLES.length} roles.`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks whether the system data has already been seeded by looking for the
 * `admin` role document.
 */
export async function isSystemSeeded(): Promise<boolean> {
  const adminRoleSnap = await getDoc(doc(db, 'roles', 'admin'));
  return adminRoleSnap.exists();
}

/**
 * Seeds the `permissions` and `roles` Firestore collections with the
 * predefined system data.
 *
 * This function is idempotent — it is safe to call multiple times.
 * Existing documents are merged rather than overwritten.
 *
 * Typical call sites:
 *   - First-admin registration flow
 *   - A one-time setup/migration script
 */
export async function seedSystemData(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  console.log('[seed] System data seeded successfully.');
}

/**
 * Conditionally seeds system data only if it has not been seeded yet.
 * Useful on app startup to bootstrap a fresh deployment.
 */
export async function seedSystemDataIfNeeded(): Promise<void> {
  const already = await isSystemSeeded();
  if (already) {
    console.log('[seed] System data already present — skipping.');
    return;
  }
  await seedSystemData();
}

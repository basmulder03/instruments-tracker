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
 * Checks whether the system data has already been seeded by reading the
 * publicly-accessible /config/bootstrap sentinel document.
 * This avoids an authenticated Firestore read on /roles which would fail
 * before the calling user has permissions in place.
 */
export async function isSystemSeeded(): Promise<boolean> {
  const snap = await getDoc(doc(db, 'config', 'bootstrap'));
  return snap.exists() && snap.data()?.systemSeeded === true;
}

/**
 * Seeds the `permissions` and `roles` Firestore collections with the
 * predefined system data, then marks the bootstrap sentinel so subsequent
 * calls skip the work.
 *
 * MUST be called after the admin user doc has been written to Firestore,
 * so that hasPermission() resolves correctly for the roles/permissions writes.
 *
 * This function is idempotent — it is safe to call multiple times.
 */
export async function seedSystemData(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  // Mark seeded in the bootstrap sentinel (merge so adminCreated is preserved)
  await setDoc(doc(db, 'config', 'bootstrap'), { systemSeeded: true }, { merge: true });
  console.log('[seed] System data seeded successfully.');
}

/**
 * Conditionally seeds system data only if it has not been seeded yet.
 * Must be called while an authenticated admin session is active.
 */
export async function seedSystemDataIfNeeded(): Promise<void> {
  const already = await isSystemSeeded();
  if (already) {
    console.log('[seed] System data already present — skipping.');
    return;
  }
  await seedSystemData();
}

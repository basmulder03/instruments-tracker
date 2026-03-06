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
 * collection. Plain setDoc (no merge) — documents don't exist yet on first
 * seed, so this is always a create operation, avoiding the deny-on-update
 * noise that { merge: true } produces in the Rules evaluator.
 */
async function seedPermissions(): Promise<void> {
  const writes = SYSTEM_PERMISSIONS.map(({ id, data }) =>
    setDoc(doc(db, 'permissions', id), data),
  );
  await Promise.all(writes);
  console.log(`[seed] Seeded ${SYSTEM_PERMISSIONS.length} permissions.`);
}

/**
 * Seeds all entries from `SYSTEM_ROLES` into the `roles` collection.
 * Plain setDoc — always a create on first seed.
 */
async function seedRoles(): Promise<void> {
  const now = serverTimestamp();

  const writes = SYSTEM_ROLES.map(({ id, data }) =>
    setDoc(doc(db, 'roles', id), { ...data, createdAt: now, updatedAt: now }),
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
 */
export async function isSystemSeeded(): Promise<boolean> {
  const snap = await getDoc(doc(db, 'config', 'bootstrap'));
  return snap.exists() && snap.data()?.systemSeeded === true;
}

/**
 * Seeds the `permissions` and `roles` collections, then marks the bootstrap
 * sentinel so subsequent calls are skipped.
 *
 * MUST be called after the admin user doc has been written to Firestore so
 * that hasPermission() can resolve for the roles/permissions creates.
 */
export async function seedSystemData(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  // Merge so adminCreated (written by registerFirstAdmin) is preserved.
  await setDoc(doc(db, 'config', 'bootstrap'), { systemSeeded: true }, { merge: true });
  console.log('[seed] System data seeded successfully.');
}

/**
 * Seeds system data only if not already seeded.
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

import type { Role } from '@/lib/types/users';

// ---------------------------------------------------------------------------
// Seed type: doc ID + document body
// The `id` field is used as the Firestore document ID and is NOT stored inside
// the document itself.
// ---------------------------------------------------------------------------

export interface RoleSeed {
  id: string;                             // Firestore document ID, e.g. "admin"
  data: Omit<Role, 'createdAt' | 'updatedAt'>; // Timestamps injected at write time
}

// ---------------------------------------------------------------------------
// Predefined system roles
// ---------------------------------------------------------------------------

export const SYSTEM_ROLES: RoleSeed[] = [
  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    id: 'admin',
    data: {
      name: 'Administrator',
      description: 'Full system access, including user and system management.',
      permissions: ['*:*'],
      isSystem: true,
    },
  },

  // ── Manager ───────────────────────────────────────────────────────────────
  {
    id: 'manager',
    data: {
      name: 'Manager',
      description:
        'Can manage day-to-day operations and view analytics, but cannot manage users or system settings.',
      permissions: [
        // Master data – full CRUD
        'instruments:create',
        'instruments:read',
        'instruments:update',
        'instruments:delete',
        'instruments:checkout',
        'instruments:return',
        'people:create',
        'people:read',
        'people:update',
        'people:delete',
        'locations:create',
        'locations:read',
        'locations:update',
        'locations:delete',
        // Operations
        'movements:read',
        'movements:export',
        'maintenance:create',
        'maintenance:read',
        'maintenance:update',
        'maintenance:delete',
        'usage:create',
        'usage:read',
        'usage:update',
        'usage:delete',
        // Analytics
        'analytics:view',
        'analytics:rebuild',
        'dashboard:view',
        'dashboard:export',
        // Audit (view only)
        'audit:view',
      ],
      isSystem: true,
    },
  },

  // ── User ──────────────────────────────────────────────────────────────────
  {
    id: 'user',
    data: {
      name: 'User',
      description:
        'Can perform daily operations (checkout, return, log maintenance/usage) but cannot delete data or access administration.',
      permissions: [
        'instruments:read',
        'instruments:checkout',
        'instruments:return',
        'people:read',
        'locations:read',
        'movements:read',
        'maintenance:create',
        'maintenance:read',
        'usage:create',
        'usage:read',
        'analytics:view',
      ],
      isSystem: true,
    },
  },

  // ── Viewer ────────────────────────────────────────────────────────────────
  {
    id: 'viewer',
    data: {
      name: 'Viewer',
      description: 'Read-only access to all data except administration.',
      permissions: [
        'instruments:read',
        'people:read',
        'locations:read',
        'movements:read',
        'maintenance:read',
        'usage:read',
        'analytics:view',
        'dashboard:view',
      ],
      isSystem: true,
    },
  },
];

/** Quick lookup map from role doc ID → seed */
export const SYSTEM_ROLES_MAP = new Map(SYSTEM_ROLES.map((r) => [r.id, r]));

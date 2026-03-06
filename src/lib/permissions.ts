import type { Permission } from '@/lib/types/permissions';

// ---------------------------------------------------------------------------
// Seed type: doc ID + document body
// The `id` field is used as the Firestore document ID and is NOT stored inside
// the document itself.
// ---------------------------------------------------------------------------

export interface PermissionSeed {
  id: string;       // Firestore document ID, e.g. "instruments:create"
  data: Permission; // Document body (no id field)
}

// ---------------------------------------------------------------------------
// Complete permission registry
// ---------------------------------------------------------------------------

export const SYSTEM_PERMISSIONS: PermissionSeed[] = [
  // ── Master Data: Instruments ──────────────────────────────────────────────
  {
    id: 'instruments:create',
    data: { resource: 'instruments', action: 'create', description: 'Create new instruments', category: 'masterData', isSystem: true },
  },
  {
    id: 'instruments:read',
    data: { resource: 'instruments', action: 'read', description: 'View instruments list and details', category: 'masterData', isSystem: true },
  },
  {
    id: 'instruments:update',
    data: { resource: 'instruments', action: 'update', description: 'Edit instrument information', category: 'masterData', isSystem: true },
  },
  {
    id: 'instruments:delete',
    data: { resource: 'instruments', action: 'delete', description: 'Delete instruments', category: 'masterData', isSystem: true },
  },
  {
    id: 'instruments:checkout',
    data: { resource: 'instruments', action: 'checkout', description: 'Checkout instruments to people', category: 'masterData', isSystem: true },
  },
  {
    id: 'instruments:return',
    data: { resource: 'instruments', action: 'return', description: 'Return checked-out instruments', category: 'masterData', isSystem: true },
  },

  // ── Master Data: People ───────────────────────────────────────────────────
  {
    id: 'people:create',
    data: { resource: 'people', action: 'create', description: 'Add new people', category: 'masterData', isSystem: true },
  },
  {
    id: 'people:read',
    data: { resource: 'people', action: 'read', description: 'View people list', category: 'masterData', isSystem: true },
  },
  {
    id: 'people:update',
    data: { resource: 'people', action: 'update', description: 'Edit people information', category: 'masterData', isSystem: true },
  },
  {
    id: 'people:delete',
    data: { resource: 'people', action: 'delete', description: 'Delete people', category: 'masterData', isSystem: true },
  },

  // ── Master Data: Locations ────────────────────────────────────────────────
  {
    id: 'locations:create',
    data: { resource: 'locations', action: 'create', description: 'Add new locations', category: 'masterData', isSystem: true },
  },
  {
    id: 'locations:read',
    data: { resource: 'locations', action: 'read', description: 'View locations list', category: 'masterData', isSystem: true },
  },
  {
    id: 'locations:update',
    data: { resource: 'locations', action: 'update', description: 'Edit location information', category: 'masterData', isSystem: true },
  },
  {
    id: 'locations:delete',
    data: { resource: 'locations', action: 'delete', description: 'Delete locations', category: 'masterData', isSystem: true },
  },

  // ── Operations: Movements ─────────────────────────────────────────────────
  {
    id: 'movements:read',
    data: { resource: 'movements', action: 'read', description: 'View checkout/return history', category: 'operations', isSystem: true },
  },
  {
    id: 'movements:export',
    data: { resource: 'movements', action: 'export', description: 'Export movement data', category: 'operations', isSystem: true },
  },

  // ── Operations: Maintenance ───────────────────────────────────────────────
  {
    id: 'maintenance:create',
    data: { resource: 'maintenance', action: 'create', description: 'Log maintenance records', category: 'operations', isSystem: true },
  },
  {
    id: 'maintenance:read',
    data: { resource: 'maintenance', action: 'read', description: 'View maintenance history', category: 'operations', isSystem: true },
  },
  {
    id: 'maintenance:update',
    data: { resource: 'maintenance', action: 'update', description: 'Edit maintenance records', category: 'operations', isSystem: true },
  },
  {
    id: 'maintenance:delete',
    data: { resource: 'maintenance', action: 'delete', description: 'Delete maintenance records', category: 'operations', isSystem: true },
  },

  // ── Operations: Usage ─────────────────────────────────────────────────────
  {
    id: 'usage:create',
    data: { resource: 'usage', action: 'create', description: 'Log usage events', category: 'operations', isSystem: true },
  },
  {
    id: 'usage:read',
    data: { resource: 'usage', action: 'read', description: 'View usage history', category: 'operations', isSystem: true },
  },
  {
    id: 'usage:update',
    data: { resource: 'usage', action: 'update', description: 'Edit usage records', category: 'operations', isSystem: true },
  },
  {
    id: 'usage:delete',
    data: { resource: 'usage', action: 'delete', description: 'Delete usage records', category: 'operations', isSystem: true },
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    id: 'analytics:view',
    data: { resource: 'analytics', action: 'view', description: 'View analytics pages', category: 'analytics', isSystem: true },
  },
  {
    id: 'analytics:rebuild',
    data: { resource: 'analytics', action: 'rebuild', description: 'Trigger analytics recalculation', category: 'analytics', isSystem: true },
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    id: 'dashboard:view',
    data: { resource: 'dashboard', action: 'view', description: 'View financial dashboard', category: 'analytics', isSystem: true },
  },
  {
    id: 'dashboard:export',
    data: { resource: 'dashboard', action: 'export', description: 'Export dashboard to PDF', category: 'analytics', isSystem: true },
  },

  // ── Admin: Users ──────────────────────────────────────────────────────────
  {
    id: 'users:invite',
    data: { resource: 'users', action: 'invite', description: 'Invite new users', category: 'admin', isSystem: true },
  },
  {
    id: 'users:read',
    data: { resource: 'users', action: 'read', description: 'View user list', category: 'admin', isSystem: true },
  },
  {
    id: 'users:manage',
    data: { resource: 'users', action: 'manage', description: 'Edit user roles and permissions', category: 'admin', isSystem: true },
  },
  {
    id: 'users:deactivate',
    data: { resource: 'users', action: 'deactivate', description: 'Deactivate user accounts', category: 'admin', isSystem: true },
  },

  // ── Admin: Roles ──────────────────────────────────────────────────────────
  {
    id: 'roles:create',
    data: { resource: 'roles', action: 'create', description: 'Create custom roles', category: 'admin', isSystem: true },
  },
  {
    id: 'roles:read',
    data: { resource: 'roles', action: 'read', description: 'View roles list', category: 'admin', isSystem: true },
  },
  {
    id: 'roles:update',
    data: { resource: 'roles', action: 'update', description: 'Edit role permissions', category: 'admin', isSystem: true },
  },
  {
    id: 'roles:delete',
    data: { resource: 'roles', action: 'delete', description: 'Delete custom roles (not system roles)', category: 'admin', isSystem: true },
  },

  // ── Admin: Audit ──────────────────────────────────────────────────────────
  {
    id: 'audit:view',
    data: { resource: 'audit', action: 'view', description: 'View audit log', category: 'admin', isSystem: true },
  },
  {
    id: 'audit:verify',
    data: { resource: 'audit', action: 'verify', description: 'Verify audit chain integrity', category: 'admin', isSystem: true },
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    id: 'system:settings',
    data: { resource: 'system', action: 'settings', description: 'Edit system settings', category: 'system', isSystem: true },
  },
  {
    id: 'system:backup',
    data: { resource: 'system', action: 'backup', description: 'Trigger system backups', category: 'system', isSystem: true },
  },
  {
    id: 'system:seed',
    data: { resource: 'system', action: 'seed', description: 'Seed demo data', category: 'system', isSystem: true },
  },
];

/** Quick lookup set of all permission doc IDs */
export const PERMISSION_IDS = new Set(SYSTEM_PERMISSIONS.map((p) => p.id));

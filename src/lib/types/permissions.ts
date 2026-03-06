// ---------------------------------------------------------------------------
// CASL action & subject types
// ---------------------------------------------------------------------------

export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'checkout'
  | 'return'
  | 'export'
  | 'verify'
  | 'invite'
  | 'manage'
  | 'rebuild'
  | 'view'
  | 'deactivate'
  | 'settings'
  | 'backup'
  | 'seed'
  | 'anonymise'
  | '*';

export type Subjects =
  | 'Instrument'
  | 'Person'
  | 'Location'
  | 'Movement'
  | 'Maintenance'
  | 'Usage'
  | 'Analytics'
  | 'Dashboard'
  | 'User'
  | 'Role'
  | 'Audit'
  | 'Privacy'
  | 'System'
  | 'all';

// ---------------------------------------------------------------------------
// Permission registry entry (stored in Firestore `permissions` collection)
// ---------------------------------------------------------------------------

export interface Permission {
  resource: string;               // e.g., "instruments"
  action: string;                 // e.g., "create"
  description: string;            // Human-readable description
  category: 'masterData' | 'operations' | 'analytics' | 'admin' | 'system';
  isSystem: boolean;              // System permissions cannot be deleted
}

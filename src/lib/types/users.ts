import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// User (stored in Firestore `users` collection, keyed by Firebase Auth UID)
// ---------------------------------------------------------------------------

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'nl' | 'en';
  defaultView: string;            // Default page path on login
  notificationsEnabled: boolean;
}

export interface User {
  email: string;
  displayName: string;

  // Authorization
  role: string;                   // e.g., 'admin' | 'manager' | 'user' | 'viewer'
  permissions: string[];          // e.g., ["instruments:create", "*:*"]

  // Account status
  status: 'active' | 'inactive' | 'suspended';

  preferences: UserPreferences;

  // Metadata
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;              // UID of the inviter, or "system"
  lastLoginAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Role (stored in Firestore `roles` collection)
// ---------------------------------------------------------------------------

export interface Role {
  name: string;                   // Display name
  description: string;
  permissions: string[];          // Array of permission strings
  isSystem: boolean;              // System roles cannot be deleted
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Invitation (stored in Firestore `invitations` collection)
// ---------------------------------------------------------------------------

export interface Invitation {
  email: string;
  role: string;
  permissions: string[];          // Custom permission overrides

  invitedBy: string;              // UID of inviter
  invitedAt: Timestamp;
  expiresAt: Timestamp;           // Usually 7 days after invitation

  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;                  // Secure random token for the invite URL

  organizationId?: string;
  acceptedAt?: Timestamp;
}

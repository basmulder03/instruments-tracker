import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Master Data
// ---------------------------------------------------------------------------

export interface Instrument {
  naam: string;                   // Display name

  // Classification
  type: string;                   // Instrument type (e.g., "Trumpet", "Violin")
  merk: string;                   // Brand/manufacturer
  serienummer: string;            // Serial number

  // Financial
  purchaseDate: string;           // ISO date: "2024-01-15"
  purchaseCost: number;           // Purchase cost in currency
  usefulLifeYears: number;        // Expected lifetime (for depreciation)
  salvageValue: number;           // Residual value at end of life

  // Current State
  currentStatus: 'IN_STORAGE' | 'CHECKED_OUT' | 'IN_REPAIR';
  currentLocationId: string;      // Reference to locations collection
  currentPersonId: string;        // Reference to people collection (if checked out)

  // Media
  photoUrl?: string;              // Firebase Storage download URL for instrument photo

  // Metadata
  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Person {
  naam: string;                   // Full name
  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Location {
  naam: string;                   // Location name
  adres: string;                  // Address
  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Transactional
// ---------------------------------------------------------------------------

export interface Movement {
  instrumentId: string;

  // Checkout
  checkoutPersonId: string;
  checkoutLocationId: string;
  checkoutAt: string;             // ISO timestamp

  // Return
  returnLocationId: string;       // Empty if still checked out
  returnAt: string;               // Empty if still checked out

  status: 'OPEN' | 'CLOSED';

  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Maintenance {
  instrumentId: string;

  category: 'PADS' | 'OVERHAUL' | 'ADJUSTMENT' | 'CLEANING' | 'REPAIR_OTHER';
  cost: number;
  isMajor: boolean;
  performedAt: string;            // ISO date

  // Media
  damagePhotoUrls?: string[];     // Firebase Storage download URLs for damage photos

  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface UsageEvent {
  instrumentId: string;

  units: number;
  unitType: string;               // e.g., "hours", "sessions"
  sessionAt: string;              // ISO timestamp

  notes: string;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Analytics (computed / rebuilt periodically)
// ---------------------------------------------------------------------------

export interface UsageStats {
  instrumentId: string;
  unitsTotal: number;
  unitsPerDay: number;
  unitsPerWeek: number;
  updatedAt: Timestamp;
}

export interface MaintenancePrediction {
  instrumentId: string;
  category: string;
  predictedNextRevision: string;  // ISO date
  predictedCost: number;
  basis: 'time' | 'usage';
  updatedAt: Timestamp;
}

export interface Depreciation {
  instrumentId: string;
  year: string;                   // e.g., "2024"
  startValue: number;
  depreciation: number;
  endValue: number;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLog {
  timestamp: Timestamp;

  // Actor
  userId: string;
  userEmail: string;

  // Action
  action: string;                 // "CREATE" | "UPDATE" | "DELETE" | "CHECKOUT" | etc.
  entityType: string;             // e.g., "Instrument", "Movement"
  entityId: string;
  details: string;                // JSON-stringified change details

  // Optional context
  ipAddress?: string;
  userAgent?: string;

  // Hash chain (tamper evidence)
  prevHash: string;
  rowHash: string;
}

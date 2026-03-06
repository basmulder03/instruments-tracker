# Data Model

## Overview

The Instruments Tracker uses Firebase Firestore as its database. Firestore is a NoSQL document database organized into collections. This document describes all collections, their schemas, and relationships.

---

## Collections Overview

### Master Data Collections
1. **instruments** - Musical instruments inventory
2. **people** - People who can checkout instruments
3. **locations** - Physical locations for storage

### Transactional Collections
4. **movements** - Checkout/return transactions
5. **maintenance** - Maintenance records
6. **usage_events** - Usage logging

### RBAC Collections
7. **users** - User accounts with roles and permissions
8. **roles** - Role definitions with permissions
9. **permissions** - Permission registry
10. **invitations** - User invitation tokens

### Analytics Collections
11. **usage_stats** - Computed usage statistics
12. **maintenance_predictions** - Predicted maintenance schedules
13. **depreciation** - Depreciation schedules

### System Collections
14. **audit_log** - Immutable audit trail

---

## Collection Schemas

### 1. instruments

Stores all musical instruments in inventory.

```typescript
interface Instrument {
  // Identity
  instrumentId: string;           // Primary key: "INS-0001"
  naam: string;                   // Display name (Dutch: "Naam")
  
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
  
  // Metadata
  notes: string;                  // Free-form notes
  organizationId?: string;        // For future multi-tenancy
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;              // User UID who created
}
```

**Indexes:**
- `currentStatus` (for filtering)
- `type` (for grouping)
- `currentLocationId` (for location-based queries)
- `organizationId` (for multi-tenant queries)

**Example Document:**
```json
{
  "instrumentId": "INS-0001",
  "naam": "Yamaha Trumpet YTR-2330",
  "type": "Trumpet",
  "merk": "Yamaha",
  "serienummer": "Y12345",
  "purchaseDate": "2023-06-15",
  "purchaseCost": 1200.00,
  "usefulLifeYears": 10,
  "salvageValue": 200.00,
  "currentStatus": "IN_STORAGE",
  "currentLocationId": "LOC-0001",
  "currentPersonId": "",
  "notes": "Excellent condition",
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-10T10:30:00Z",
  "createdBy": "user123"
}
```

---

### 2. people

People who can borrow/use instruments.

```typescript
interface Person {
  personId: string;               // Primary key: "PER-0001"
  naam: string;                   // Full name
  notes: string;                  // Free-form notes (contact info, etc.)
  organizationId?: string;        // For future multi-tenancy
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Example Document:**
```json
{
  "personId": "PER-0001",
  "naam": "Jan de Vries",
  "notes": "Student, contact: jan@example.com",
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-10T10:30:00Z",
  "createdBy": "user123"
}
```

---

### 3. locations

Physical storage locations for instruments.

```typescript
interface Location {
  locationId: string;             // Primary key: "LOC-0001"
  naam: string;                   // Location name
  adres: string;                  // Address
  notes: string;                  // Free-form notes
  organizationId?: string;        // For future multi-tenancy
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Example Document:**
```json
{
  "locationId": "LOC-0001",
  "naam": "Main Storage Room",
  "adres": "Building A, Room 101",
  "notes": "Climate controlled",
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-10T10:30:00Z",
  "createdBy": "user123"
}
```

---

### 4. movements

Tracks instrument checkout and return transactions.

```typescript
interface Movement {
  movementId: string;             // Primary key: "MOV-0001"
  instrumentId: string;           // Reference to instrument
  
  // Checkout
  checkoutPersonId: string;       // Who borrowed it
  checkoutLocationId: string;     // Where it was when checked out
  checkoutAt: string;             // ISO timestamp
  
  // Return
  returnLocationId: string;       // Where it was returned (empty if still out)
  returnAt: string;               // ISO timestamp (empty if still out)
  
  // Status
  status: 'OPEN' | 'CLOSED';      // OPEN = checked out, CLOSED = returned
  
  // Metadata
  notes: string;                  // Notes about checkout/return
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Indexes:**
- `instrumentId` (for instrument history)
- `status` (for open checkouts)
- `checkoutPersonId` (for person's borrowing history)

**Example Document:**
```json
{
  "movementId": "MOV-0001",
  "instrumentId": "INS-0001",
  "checkoutPersonId": "PER-0001",
  "checkoutLocationId": "LOC-0001",
  "checkoutAt": "2024-03-01T09:00:00Z",
  "returnLocationId": "LOC-0001",
  "returnAt": "2024-03-05T16:30:00Z",
  "status": "CLOSED",
  "notes": "Returned in good condition",
  "createdAt": "2024-03-01T09:00:00Z",
  "updatedAt": "2024-03-05T16:30:00Z",
  "createdBy": "user123"
}
```

---

### 5. maintenance

Maintenance and repair records for instruments.

```typescript
interface Maintenance {
  maintenanceId: string;          // Primary key: "MNT-0001"
  instrumentId: string;           // Reference to instrument
  
  category: 'PADS' | 'OVERHAUL' | 'ADJUSTMENT' | 'CLEANING' | 'REPAIR_OTHER';
  cost: number;                   // Cost of maintenance
  isMajor: boolean;               // Major or minor maintenance
  performedAt: string;            // ISO date when performed
  
  notes: string;                  // Description of work done
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Indexes:**
- `instrumentId` (for instrument history)
- `category` (for analytics)
- `performedAt` (for time-based queries)

**Example Document:**
```json
{
  "maintenanceId": "MNT-0001",
  "instrumentId": "INS-0001",
  "category": "PADS",
  "cost": 150.00,
  "isMajor": false,
  "performedAt": "2024-02-15",
  "notes": "Replaced worn pads",
  "createdAt": "2024-02-15T14:00:00Z",
  "updatedAt": "2024-02-15T14:00:00Z",
  "createdBy": "user123"
}
```

---

### 6. usage_events

Logs usage sessions for instruments (e.g., hours played, practice sessions).

```typescript
interface UsageEvent {
  usageId: string;                // Primary key: "USE-0001"
  instrumentId: string;           // Reference to instrument
  
  units: number;                  // Usage amount (hours, sessions, etc.)
  unitType: string;               // Type of unit (e.g., "hours", "sessions")
  sessionAt: string;              // ISO timestamp of usage
  
  notes: string;                  // Usage notes
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Indexes:**
- `instrumentId` (for instrument usage history)
- `sessionAt` (for time-based analytics)

**Example Document:**
```json
{
  "usageId": "USE-0001",
  "instrumentId": "INS-0001",
  "units": 3.5,
  "unitType": "hours",
  "sessionAt": "2024-03-02T18:00:00Z",
  "notes": "Practice session",
  "createdAt": "2024-03-02T18:30:00Z",
  "updatedAt": "2024-03-02T18:30:00Z",
  "createdBy": "user123"
}
```

---

### 7. users

User accounts with authentication and authorization data.

```typescript
interface User {
  uid: string;                    // Primary key (Firebase Auth UID)
  email: string;                  // User email (from Firebase Auth)
  displayName: string;            // Full name
  
  // Authorization
  role: string;                   // Default role: 'admin' | 'manager' | 'user' | 'viewer'
  permissions: string[];          // Array of permission strings (e.g., "instruments:create")
  
  // Account Status
  status: 'active' | 'inactive' | 'suspended';
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark';
    language: 'nl' | 'en';
    defaultView: string;          // Default page on login
    notificationsEnabled: boolean;
  };
  
  // Metadata
  organizationId?: string;        // For future multi-tenancy
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;              // UID of inviter
  lastLoginAt?: Timestamp;
}
```

**Indexes:**
- `email` (for user lookup)
- `role` (for role-based queries)
- `status` (for active user queries)
- `organizationId` (for multi-tenant queries)

**Example Document:**
```json
{
  "uid": "auth-uid-12345",
  "email": "admin@example.com",
  "displayName": "Admin User",
  "role": "admin",
  "permissions": ["*:*"],
  "status": "active",
  "preferences": {
    "theme": "light",
    "language": "nl",
    "defaultView": "/dashboard",
    "notificationsEnabled": true
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-03-06T10:00:00Z",
  "createdBy": "system",
  "lastLoginAt": "2024-03-06T10:00:00Z"
}
```

---

### 8. roles

Defines roles with associated permissions.

```typescript
interface Role {
  roleId: string;                 // Primary key: "admin", "manager", "user", "viewer"
  name: string;                   // Display name
  description: string;            // Role description
  permissions: string[];          // Array of permission strings
  isSystem: boolean;              // System roles cannot be deleted
  organizationId?: string;        // For future multi-tenancy
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Example Document:**
```json
{
  "roleId": "admin",
  "name": "Administrator",
  "description": "Full system access",
  "permissions": ["*:*"],
  "isSystem": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 9. permissions

Registry of all available permissions in the system.

```typescript
interface Permission {
  permissionId: string;           // Primary key: "instruments:create"
  resource: string;               // Resource name: "instruments"
  action: string;                 // Action: "create", "read", "update", "delete", etc.
  description: string;            // Human-readable description
  category: 'masterData' | 'operations' | 'analytics' | 'admin' | 'system';
  isSystem: boolean;              // System permissions cannot be deleted
}
```

**Example Document:**
```json
{
  "permissionId": "instruments:create",
  "resource": "instruments",
  "action": "create",
  "description": "Create new instruments",
  "category": "masterData",
  "isSystem": true
}
```

---

### 10. invitations

User invitation tokens for onboarding new users.

```typescript
interface Invitation {
  invitationId: string;           // Primary key: "INV-0001"
  email: string;                  // Email to invite
  role: string;                   // Role to assign
  permissions: string[];          // Custom permissions (overrides role defaults)
  
  invitedBy: string;              // UID of inviter
  invitedAt: Timestamp;
  expiresAt: Timestamp;           // Usually 7 days from invitation
  
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;                  // Secure random token for URL
  
  organizationId?: string;
  acceptedAt?: Timestamp;         // When invitation was accepted
}
```

**Indexes:**
- `email` (for lookup)
- `token` (for validation)
- `status` (for pending invitations)

**Example Document:**
```json
{
  "invitationId": "INV-0001",
  "email": "newuser@example.com",
  "role": "user",
  "permissions": [],
  "invitedBy": "admin-uid-12345",
  "invitedAt": "2024-03-01T10:00:00Z",
  "expiresAt": "2024-03-08T10:00:00Z",
  "status": "pending",
  "token": "secure-random-token-abc123",
  "organizationId": null
}
```

---

### 11. usage_stats

Computed usage statistics (rebuilt periodically).

```typescript
interface UsageStats {
  instrumentId: string;           // Primary key
  unitsTotal: number;             // Total units logged
  unitsPerDay: number;            // Average units per day
  unitsPerWeek: number;           // Average units per week
  updatedAt: Timestamp;           // When stats were last computed
}
```

**Example Document:**
```json
{
  "instrumentId": "INS-0001",
  "unitsTotal": 120.5,
  "unitsPerDay": 2.5,
  "unitsPerWeek": 17.5,
  "updatedAt": "2024-03-06T00:00:00Z"
}
```

---

### 12. maintenance_predictions

Predicted next maintenance dates (rebuilt periodically).

```typescript
interface MaintenancePrediction {
  instrumentId: string;           // Composite key with category
  category: string;               // Maintenance category
  predictedNextRevision: string;  // ISO date of predicted next maintenance
  predictedCost: number;          // Predicted cost
  basis: 'time' | 'usage';        // Prediction basis
  updatedAt: Timestamp;
}
```

**Indexes:**
- Composite: `instrumentId + category`
- `predictedNextRevision` (for upcoming maintenance)

**Example Document:**
```json
{
  "instrumentId": "INS-0001",
  "category": "PADS",
  "predictedNextRevision": "2024-08-15",
  "predictedCost": 150.00,
  "basis": "time",
  "updatedAt": "2024-03-06T00:00:00Z"
}
```

---

### 13. depreciation

Depreciation schedules for instruments (rebuilt periodically).

```typescript
interface Depreciation {
  instrumentId: string;           // Composite key with year
  year: string;                   // Year as string: "2024"
  startValue: number;             // Value at start of year
  depreciation: number;           // Depreciation for this year
  endValue: number;               // Value at end of year
  updatedAt: Timestamp;
}
```

**Indexes:**
- Composite: `instrumentId + year`
- `year` (for aggregations)

**Example Document:**
```json
{
  "instrumentId": "INS-0001",
  "year": "2024",
  "startValue": 1200.00,
  "depreciation": 100.00,
  "endValue": 1100.00,
  "updatedAt": "2024-03-06T00:00:00Z"
}
```

---

### 14. audit_log

Immutable audit trail with hash chaining for integrity.

```typescript
interface AuditLog {
  auditId: string;                // Primary key: "AUD-0001"
  timestamp: Timestamp;
  
  // Actor
  userId: string;                 // Firebase Auth UID
  userEmail: string;              // User email (for readability)
  
  // Action
  action: string;                 // e.g., "CREATE", "UPDATE", "DELETE", "CHECKOUT", etc.
  entityType: string;             // e.g., "Instrument", "Movement"
  entityId: string;               // ID of affected entity
  details: string;                // JSON string with change details
  
  // Optional context
  ipAddress?: string;
  userAgent?: string;
  
  // Hash chain
  prevHash: string;               // Hash of previous audit entry
  rowHash: string;                // SHA-256 hash of this entry
}
```

**Indexes:**
- `timestamp` (for chronological queries)
- `userId` (for user activity)
- `entityType + entityId` (for entity audit trail)

**Example Document:**
```json
{
  "auditId": "AUD-0001",
  "timestamp": "2024-03-06T10:30:00Z",
  "userId": "user123",
  "userEmail": "user@example.com",
  "action": "CREATE",
  "entityType": "Instrument",
  "entityId": "INS-0001",
  "details": "{\"naam\":\"Yamaha Trumpet YTR-2330\",\"type\":\"Trumpet\"}",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "prevHash": "",
  "rowHash": "abc123def456..."
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ createdBy
       ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ instruments │       │   people    │       │  locations  │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                      │
       │ instrumentId        │ personId             │ locationId
       ↓                     ↓                      ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  movements  │←──────┤             │←──────│             │
└─────────────┘       └─────────────┘       └─────────────┘
       │
       │ instrumentId
       ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ maintenance │       │usage_events │       │  audit_log  │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Reference Fields

- **instruments.currentLocationId** → locations.locationId
- **instruments.currentPersonId** → people.personId (if checked out)
- **movements.instrumentId** → instruments.instrumentId
- **movements.checkoutPersonId** → people.personId
- **movements.checkoutLocationId** → locations.locationId
- **movements.returnLocationId** → locations.locationId
- **maintenance.instrumentId** → instruments.instrumentId
- **usage_events.instrumentId** → instruments.instrumentId

---

## ID Generation

All primary keys follow the pattern: `PREFIX-####`

### Prefixes
- **INS** - Instruments
- **PER** - People
- **LOC** - Locations
- **MOV** - Movements
- **MNT** - Maintenance
- **USE** - Usage Events
- **AUD** - Audit Log
- **INV** - Invitations

### Generation Logic
1. Query collection for all IDs with matching prefix
2. Extract numeric part and find maximum
3. Increment by 1
4. Pad to 4 digits with leading zeros
5. Combine prefix and number: `INS-0042`

---

## Data Migration from Google Sheets

### Sheet → Collection Mapping

| Google Sheet | Firestore Collection |
|--------------|---------------------|
| Instruments | instruments |
| People | people |
| Locations | locations |
| Movements | movements |
| Maintenance | maintenance |
| Usage_Events | usage_events |
| AuditLog | audit_log |
| Usage_Stats | usage_stats |
| Maintenance_Predictions | maintenance_predictions |
| Depreciation | depreciation |

### Migration Steps

1. **Export from Sheets:** Use Google Sheets API or manual CSV export
2. **Transform Data:** Convert to Firestore format (add Timestamps, etc.)
3. **Import to Firestore:** Use Firebase Admin SDK or batch writes
4. **Rebuild Analytics:** Run depreciation, usage stats, predictions calculations
5. **Verify:** Check data integrity and relationships

---

## Multi-Tenancy Support (Future)

### Changes Required

1. **Add organizationId to all collections:**
   ```typescript
   organizationId?: string;  // null for single-tenant, ID for multi-tenant
   ```

2. **Update security rules:**
   ```javascript
   allow read: if resource.data.organizationId == getUserData().organizationId;
   ```

3. **Add organizations collection:**
   ```typescript
   interface Organization {
     organizationId: string;
     name: string;
     plan: 'free' | 'pro' | 'enterprise';
     settings: {...};
   }
   ```

4. **Update queries to filter by organizationId**

---

## Next Steps

1. Review [RBAC & Permissions](./03-rbac-permissions.md) for access control
2. Study [Security Rules](./06-security-rules.md) for data protection
3. See [Code Patterns](./07-code-patterns.md) for implementation examples

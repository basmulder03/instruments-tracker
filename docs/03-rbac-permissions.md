# RBAC & Permissions System

## Overview

The Instruments Tracker implements a fine-grained, flexible Role-Based Access Control (RBAC) system using **dynamic permissions**. Instead of simple role checks, the system uses an action + resource permission model that allows administrators to customize access at a granular level.

---

## Permission Model

### Permission Format

Permissions follow the format: `resource:action[:scope]`

**Examples:**
- `instruments:create` - Create new instruments
- `instruments:read` - View instruments
- `instruments:update` - Edit instruments
- `instruments:delete` - Delete instruments
- `instruments:checkout` - Checkout instruments
- `instruments:return` - Return instruments
- `instruments:*` - All instrument operations (wildcard)

### Wildcard Support

- `*:*` - All permissions (super admin)
- `instruments:*` - All instrument permissions
- `*:read` - Read permission for all resources

---

## Permission Registry

All available permissions are stored in the `permissions` collection.

### Permission Categories

1. **masterData** - CRUD operations on master data
2. **operations** - Workflow operations (checkout, return, etc.)
3. **analytics** - View analytics and reports
4. **admin** - System administration
5. **system** - Critical system operations

### Complete Permission List

#### Master Data Permissions

**Instruments:**
```
instruments:create      - Create new instruments
instruments:read        - View instruments list and details
instruments:update      - Edit instrument information
instruments:delete      - Delete instruments
instruments:checkout    - Checkout instruments to people
instruments:return      - Return checked-out instruments
```

**People:**
```
people:create           - Add new people
people:read             - View people list
people:update           - Edit people information
people:delete           - Delete people
```

**Locations:**
```
locations:create        - Add new locations
locations:read          - View locations list
locations:update        - Edit location information
locations:delete        - Delete locations
```

#### Operations Permissions

**Movements:**
```
movements:read          - View checkout/return history
movements:export        - Export movement data
```

**Maintenance:**
```
maintenance:create      - Log maintenance records
maintenance:read        - View maintenance history
maintenance:update      - Edit maintenance records
maintenance:delete      - Delete maintenance records
```

**Usage:**
```
usage:create            - Log usage events
usage:read              - View usage history
usage:update            - Edit usage records
usage:delete            - Delete usage records
```

#### Analytics Permissions

```
analytics:view          - View analytics pages
analytics:rebuild       - Trigger analytics recalculation
```

#### Dashboard Permissions

```
dashboard:view          - View financial dashboard
dashboard:export        - Export dashboard to PDF
```

#### Admin Permissions

**User Management:**
```
users:invite            - Invite new users
users:read              - View user list
users:manage            - Edit user roles and permissions
users:deactivate        - Deactivate user accounts
```

**Role Management:**
```
roles:create            - Create custom roles
roles:read              - View roles list
roles:update            - Edit role permissions
roles:delete            - Delete custom roles (not system roles)
```

**Audit:**
```
audit:view              - View audit log
audit:verify            - Verify audit chain integrity
```

**System:**
```
system:settings         - Edit system settings
system:backup           - Trigger system backups
system:seed             - Seed demo data
```

---

## Predefined Roles

### Admin Role

**Description:** Full system access, including user and system management.

**Permissions:**
```typescript
[
  '*:*'  // All permissions via wildcard
]
```

**Typical Users:** System administrators, IT staff

---

### Manager Role

**Description:** Can manage day-to-day operations and view analytics, but cannot manage users or system settings.

**Permissions:**
```typescript
[
  // Master Data (full CRUD)
  'instruments:*',
  'people:*',
  'locations:*',
  
  // Operations (full access)
  'movements:read',
  'movements:export',
  'maintenance:*',
  'usage:*',
  
  // Analytics (view and rebuild)
  'analytics:view',
  'analytics:rebuild',
  
  // Dashboard
  'dashboard:view',
  'dashboard:export',
  
  // Audit (view only)
  'audit:view'
]
```

**Typical Users:** Inventory managers, supervisors

---

### User Role

**Description:** Can perform daily operations (checkout, return, log maintenance/usage) but cannot delete data or access administration.

**Permissions:**
```typescript
[
  // Instruments (read + checkout/return only)
  'instruments:read',
  'instruments:checkout',
  'instruments:return',
  
  // People and Locations (read only)
  'people:read',
  'locations:read',
  
  // Movements (read only)
  'movements:read',
  
  // Maintenance (create and read)
  'maintenance:create',
  'maintenance:read',
  
  // Usage (create and read)
  'usage:create',
  'usage:read',
  
  // Analytics (view only)
  'analytics:view'
]
```

**Typical Users:** Staff members, technicians

---

### Viewer Role

**Description:** Read-only access to all data except administration.

**Permissions:**
```typescript
[
  // All read permissions
  'instruments:read',
  'people:read',
  'locations:read',
  'movements:read',
  'maintenance:read',
  'usage:read',
  'analytics:view',
  'dashboard:view'
]
```

**Typical Users:** Auditors, stakeholders, read-only access accounts

---

## Custom Roles

Administrators can create custom roles via the admin UI with any combination of permissions.

**Example: Maintenance Specialist Role**
```typescript
{
  roleId: "maintenance_specialist",
  name: "Maintenance Specialist",
  description: "Can only log and view maintenance, no other operations",
  permissions: [
    "instruments:read",
    "maintenance:create",
    "maintenance:read",
    "maintenance:update"
  ],
  isSystem: false
}
```

---

## Permission Overrides

Individual users can have custom permissions that override their role's defaults.

**Example:**
- User has role: `user` (default permissions)
- Admin adds custom permission: `instruments:delete`
- User now has all `user` permissions PLUS `instruments:delete`

**Use Cases:**
- Temporary elevated access
- Special project needs
- Training scenarios

---

## CASL Integration

The system uses [CASL](https://casl.js.org/) for client-side permission checking.

### Ability Definition

```typescript
// lib/ability.ts
import { defineAbility, AbilityBuilder } from '@casl/ability';

export type Actions = 
  | 'create' | 'read' | 'update' | 'delete' 
  | 'checkout' | 'return' | 'export' | 'verify'
  | 'invite' | 'manage' | 'rebuild' | 'view';

export type Subjects = 
  | 'Instrument' | 'Person' | 'Location'
  | 'Movement' | 'Maintenance' | 'Usage'
  | 'Analytics' | 'Dashboard' | 'User' 
  | 'Role' | 'Audit' | 'System' | 'all';

export function defineAbilityFor(user: User) {
  const { can, build } = new AbilityBuilder(defineAbility);

  // Parse user permissions
  user.permissions.forEach(permission => {
    if (permission === '*:*') {
      // Super admin - all permissions
      can('manage', 'all');
      return;
    }

    const [resource, action] = permission.split(':');
    
    if (action === '*') {
      // All actions on resource
      can('manage', resource as Subjects);
    } else {
      // Specific action on resource
      can(action as Actions, resource as Subjects);
    }
  });

  return build();
}
```

### Usage in Components

**Conditional Rendering:**
```typescript
import { Can } from '@/contexts/AbilityContext';

function InstrumentsPage() {
  return (
    <div>
      <h1>Instruments</h1>
      
      <Can I="create" a="Instrument">
        <button onClick={openAddDialog}>
          Add Instrument
        </button>
      </Can>
      
      <InstrumentsList />
    </div>
  );
}
```

**Programmatic Checks:**
```typescript
import { useAbility } from '@/hooks/useAbility';

function InstrumentCard({ instrument }) {
  const ability = useAbility();
  
  const canEdit = ability.can('update', 'Instrument');
  const canDelete = ability.can('delete', 'Instrument');
  const canCheckout = ability.can('checkout', 'Instrument');
  
  return (
    <Card>
      <h3>{instrument.naam}</h3>
      {canCheckout && <CheckoutButton />}
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </Card>
  );
}
```

---

## User Invitation Flow

### 1. Admin Invites User

```typescript
// Admin fills form with:
// - Email address
// - Role (dropdown: admin, manager, user, viewer, custom)
// - Custom permissions (optional overrides)

async function inviteUser(data: InviteUserData) {
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Create invitation document
  const invitation = {
    invitationId: generateId('INV'),
    email: data.email,
    role: data.role,
    permissions: data.customPermissions || [],
    invitedBy: currentUser.uid,
    invitedAt: serverTimestamp(),
    expiresAt: addDays(new Date(), 7), // 7 day expiry
    status: 'pending',
    token: token
  };
  
  await addDoc(collection(db, 'invitations'), invitation);
  
  // Send invitation email (Cloud Function or Extension)
  await sendInvitationEmail({
    to: data.email,
    inviteLink: `${APP_URL}/accept-invitation?token=${token}`
  });
}
```

### 2. User Receives Email

Email contains:
- Invitation message
- Link: `https://app.example.com/accept-invitation?token=abc123...`
- Expiry date

### 3. User Accepts Invitation

```typescript
// Accept invitation page: /accept-invitation?token=...

async function acceptInvitation(token: string, password: string) {
  // 1. Verify token
  const invitationsRef = collection(db, 'invitations');
  const q = query(invitationsRef, 
    where('token', '==', token), 
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('Invalid or expired invitation');
  }
  
  const invitation = snapshot.docs[0].data();
  
  // 2. Check expiry
  if (invitation.expiresAt.toDate() < new Date()) {
    throw new Error('Invitation expired');
  }
  
  // 3. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    invitation.email,
    password
  );
  
  // 4. Get role permissions
  const roleDoc = await getDoc(doc(db, 'roles', invitation.role));
  const rolePermissions = roleDoc.data()?.permissions || [];
  
  // 5. Merge with custom permissions
  const allPermissions = [
    ...rolePermissions,
    ...invitation.permissions
  ];
  
  // 6. Create user document
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email: invitation.email,
    displayName: '', // User can update later
    role: invitation.role,
    permissions: [...new Set(allPermissions)], // Remove duplicates
    status: 'active',
    preferences: {
      theme: 'light',
      language: 'nl',
      defaultView: '/dashboard',
      notificationsEnabled: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: invitation.invitedBy
  });
  
  // 7. Mark invitation as accepted
  await updateDoc(doc(db, 'invitations', snapshot.docs[0].id), {
    status: 'accepted',
    acceptedAt: serverTimestamp()
  });
  
  // 8. Sign user in
  await signInWithEmailAndPassword(auth, invitation.email, password);
}
```

---

## First Admin Setup

When the system is first deployed, there are no users. The first user to register automatically becomes an admin.

```typescript
async function checkIfFirstUser() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.empty;
}

async function registerFirstAdmin(email: string, password: string) {
  // Check if truly first user
  const isFirst = await checkIfFirstUser();
  
  if (!isFirst) {
    throw new Error('Users already exist. Use invitation system.');
  }
  
  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  // Create user doc with admin role
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email: email,
    displayName: 'System Administrator',
    role: 'admin',
    permissions: ['*:*'],
    status: 'active',
    preferences: {
      theme: 'light',
      language: 'nl',
      defaultView: '/dashboard',
      notificationsEnabled: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'system'
  });
  
  // Seed system roles and permissions
  await seedSystemRoles();
  await seedSystemPermissions();
}
```

---

## Permission Checking Flow

### Client-Side (UI)

```
User logs in
     ↓
Fetch user document from Firestore
     ↓
Extract permissions array
     ↓
Create CASL ability object
     ↓
Provide via AbilityContext
     ↓
Components use Can component or useAbility hook
     ↓
Show/hide UI elements based on permissions
```

### Server-Side (Firestore Rules)

```
User makes request
     ↓
Firebase Auth validates token
     ↓
Security rules fetch user document
     ↓
Check if permission exists in user.permissions array
     ↓
Allow or deny request
```

---

## Security Rules Integration

```javascript
// firestore.rules

function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

function hasPermission(permission) {
  let userPermissions = getUserData().permissions;
  
  // Check exact permission
  if (permission in userPermissions) {
    return true;
  }
  
  // Check wildcard: *:*
  if ('*:*' in userPermissions) {
    return true;
  }
  
  // Check resource wildcard: instruments:*
  let parts = permission.split(':');
  let resourceWildcard = parts[0] + ':*';
  if (resourceWildcard in userPermissions) {
    return true;
  }
  
  return false;
}

function isActive() {
  return getUserData().status == 'active';
}

// Usage in rules
match /instruments/{instrumentId} {
  allow read: if request.auth != null && isActive() && hasPermission('instruments:read');
  allow create: if request.auth != null && isActive() && hasPermission('instruments:create');
  allow update: if request.auth != null && isActive() && hasPermission('instruments:update');
  allow delete: if request.auth != null && isActive() && hasPermission('instruments:delete');
}
```

---

## Managing Permissions via Admin UI

### User Management Page

**List Users:**
- Display all users with role badges
- Show status (active/inactive/suspended)
- Search/filter by name, email, role

**Edit User:**
- Change role (dropdown)
- Add/remove custom permissions (multi-select)
- Activate/deactivate account
- View last login date
- View audit trail for user

**Invite User:**
- Enter email
- Select role
- Optionally add custom permissions
- Send invitation

### Role Management Page

**List Roles:**
- System roles (locked)
- Custom roles (editable)

**Create/Edit Role:**
- Name and description
- Permission matrix (checkboxes grouped by category)
- Preview users with this role

**Permission Matrix Example:**

| Resource | Create | Read | Update | Delete | Special |
|----------|--------|------|--------|--------|---------|
| Instruments | ☐ | ☑ | ☐ | ☐ | ☑ Checkout, ☑ Return |
| People | ☐ | ☑ | ☐ | ☐ | - |
| Locations | ☐ | ☑ | ☐ | ☐ | - |
| Maintenance | ☑ | ☑ | ☐ | ☐ | - |
| Usage | ☑ | ☑ | ☐ | ☐ | - |
| Analytics | - | - | - | - | ☑ View |
| Dashboard | - | - | - | - | ☑ View, ☐ Export |

---

## Account Management

Users can manage their own account settings.

### Profile Settings

- Display name
- Email (read-only, managed by Firebase Auth)
- Change password

### Preferences

- Theme: Light/Dark
- Language: Dutch/English
- Default view: Which page to show on login
- Notifications: Enable/disable

### Activity Log

- Recent logins
- Recent actions (from audit log)

---

## Best Practices

### 1. Principle of Least Privilege
Grant users only the permissions they need for their role.

### 2. Regular Audits
Review user permissions periodically to ensure they're still appropriate.

### 3. Use Roles, Not Individual Permissions
Assign permissions via roles when possible. Use custom permissions sparingly.

### 4. Document Custom Roles
Document why custom roles were created and who they're for.

### 5. Deactivate, Don't Delete
When users leave, deactivate their accounts rather than deleting them to preserve audit trail.

### 6. Test Permission Changes
Test permission changes in development before applying in production.

---

## Next Steps

1. Review [Implementation Plan](./04-implementation-plan.md) for development phases
2. Study [Security Rules](./06-security-rules.md) for server-side enforcement
3. See [Code Patterns](./07-code-patterns.md) for implementation examples

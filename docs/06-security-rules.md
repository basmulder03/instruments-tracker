# Firestore Security Rules

## Overview

Firebase Firestore Security Rules provide server-side validation and authorization for database access. These rules are the last line of defense and should be comprehensive, as they cannot be bypassed by client-side code.

**Key Principles:**
1. **Deny by default** - If no rule matches, access is denied
2. **Defense in depth** - Complement client-side permission checks
3. **Validate all writes** - Check data structure and values
4. **User context** - Base rules on authenticated user's data

---

## Complete Security Rules

Create `firebase/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== Helper Functions =====
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Get current user's data from users collection
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Check if user has a specific permission
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
      if (parts.size() == 2) {
        let resourceWildcard = parts[0] + ':*';
        if (resourceWildcard in userPermissions) {
          return true;
        }
      }
      
      return false;
    }
    
    // Check if user is active (not suspended)
    function isActive() {
      return getUserData().status == 'active';
    }
    
    // Check if user is admin
    function isAdmin() {
      return getUserData().role == 'admin';
    }
    
    // Check if user is accessing their own document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Check if document belongs to user's organization (for multi-tenancy)
    function sameOrg() {
      return !resource.data.keys().hasAny(['organizationId']) ||
             resource.data.organizationId == getUserData().organizationId;
    }
    
    // Validate that required fields are present
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    // Check if field is being modified
    function fieldChanged(field) {
      return request.resource.data[field] != resource.data[field];
    }
    
    
    // ===== User Management =====
    
    match /users/{userId} {
      // Users can read their own document, admins can read all
      allow read: if isAuthenticated() && isActive() && 
                     (isOwner(userId) || hasPermission('users:read'));
      
      // Allow creation (for registration and invitation acceptance)
      // First user becomes admin, subsequent users need invitation
      allow create: if isAuthenticated() &&
                       (
                         // First user (admin setup)
                         !exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
                         // User accepting invitation
                         request.resource.data.email == request.auth.token.email
                       );
      
      // Users can update their own profile and preferences
      // Admins can update roles and permissions
      allow update: if isAuthenticated() && isActive() &&
                       (
                         // Update own profile (not role/permissions/status)
                         (isOwner(userId) &&
                          !fieldChanged('role') &&
                          !fieldChanged('permissions') &&
                          !fieldChanged('status') &&
                          !fieldChanged('createdAt') &&
                          !fieldChanged('createdBy')) ||
                         // Admin can update anything
                         hasPermission('users:manage')
                       );
      
      // Only admins can delete users
      allow delete: if isAuthenticated() && isActive() && hasPermission('users:manage');
    }
    
    
    // ===== Role Management =====
    
    match /roles/{roleId} {
      // All authenticated users can read roles
      allow read: if isAuthenticated() && isActive();
      
      // Only admins can create/update/delete roles
      allow create: if isAuthenticated() && isActive() && hasPermission('roles:create');
      allow update: if isAuthenticated() && isActive() && hasPermission('roles:update');
      // Cannot delete system roles
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('roles:delete') &&
                       !resource.data.isSystem;
    }
    
    
    // ===== Permissions Registry =====
    
    match /permissions/{permissionId} {
      // All authenticated users can read permissions
      allow read: if isAuthenticated() && isActive();
      
      // Permissions are managed programmatically (seed scripts only)
      allow write: if false;
    }
    
    
    // ===== Invitations =====
    
    match /invitations/{invitationId} {
      // Only users with invite permission can read
      allow read: if isAuthenticated() && isActive() && hasPermission('users:invite');
      
      // Only users with invite permission can create
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('users:invite') &&
                       hasRequiredFields(['email', 'role', 'token', 'status']);
      
      // Can update to accept invitation or cancel
      allow update: if isAuthenticated() && isActive() &&
                       (
                         // User accepting invitation
                         (request.resource.data.status == 'accepted' &&
                          resource.data.status == 'pending') ||
                         // Admin cancelling
                         hasPermission('users:invite')
                       );
      
      // Only admins can delete invitations
      allow delete: if isAuthenticated() && isActive() && hasPermission('users:invite');
    }
    
    
    // ===== Instruments =====
    
    match /instruments/{instrumentId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('instruments:read') &&
                     sameOrg();
      
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('instruments:create') &&
                       hasRequiredFields(['instrumentId', 'naam', 'currentStatus']);
      
      allow update: if isAuthenticated() && isActive() && 
                       (
                         // Regular update permission
                         hasPermission('instruments:update') ||
                         // Checkout/return operations
                         (fieldChanged('currentStatus') && 
                          (hasPermission('instruments:checkout') || hasPermission('instruments:return')))
                       ) &&
                       sameOrg();
      
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('instruments:delete') &&
                       sameOrg();
    }
    
    
    // ===== People =====
    
    match /people/{personId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('people:read') &&
                     sameOrg();
      
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('people:create') &&
                       hasRequiredFields(['personId', 'naam']);
      
      allow update: if isAuthenticated() && isActive() && 
                       hasPermission('people:update') &&
                       sameOrg();
      
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('people:delete') &&
                       sameOrg();
    }
    
    
    // ===== Locations =====
    
    match /locations/{locationId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('locations:read') &&
                     sameOrg();
      
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('locations:create') &&
                       hasRequiredFields(['locationId', 'naam']);
      
      allow update: if isAuthenticated() && isActive() && 
                       hasPermission('locations:update') &&
                       sameOrg();
      
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('locations:delete') &&
                       sameOrg();
    }
    
    
    // ===== Movements =====
    
    match /movements/{movementId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('movements:read') &&
                     sameOrg();
      
      // Created via checkout operation
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('instruments:checkout') &&
                       hasRequiredFields(['movementId', 'instrumentId', 'checkoutPersonId']);
      
      // Updated via return operation
      allow update: if isAuthenticated() && isActive() && 
                       hasPermission('instruments:return') &&
                       sameOrg();
      
      // Movements should not be deleted (audit trail)
      allow delete: if false;
    }
    
    
    // ===== Maintenance =====
    
    match /maintenance/{maintenanceId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('maintenance:read') &&
                     sameOrg();
      
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('maintenance:create') &&
                       hasRequiredFields(['maintenanceId', 'instrumentId', 'category']);
      
      allow update: if isAuthenticated() && isActive() && 
                       hasPermission('maintenance:update') &&
                       sameOrg();
      
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('maintenance:delete') &&
                       sameOrg();
    }
    
    
    // ===== Usage Events =====
    
    match /usage_events/{usageId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('usage:read') &&
                     sameOrg();
      
      allow create: if isAuthenticated() && isActive() && 
                       hasPermission('usage:create') &&
                       hasRequiredFields(['usageId', 'instrumentId', 'units']);
      
      allow update: if isAuthenticated() && isActive() && 
                       hasPermission('usage:update') &&
                       sameOrg();
      
      allow delete: if isAuthenticated() && isActive() && 
                       hasPermission('usage:delete') &&
                       sameOrg();
    }
    
    
    // ===== Analytics Collections (Read-only for most, writable by admins) =====
    
    match /usage_stats/{instrumentId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('analytics:view') &&
                     sameOrg();
      
      allow write: if isAuthenticated() && isActive() && 
                      hasPermission('analytics:rebuild');
    }
    
    match /maintenance_predictions/{docId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('analytics:view') &&
                     sameOrg();
      
      allow write: if isAuthenticated() && isActive() && 
                      hasPermission('analytics:rebuild');
    }
    
    match /depreciation/{docId} {
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('analytics:view') &&
                     sameOrg();
      
      allow write: if isAuthenticated() && isActive() && 
                      hasPermission('analytics:rebuild');
    }
    
    
    // ===== Audit Log (Append-only) =====
    
    match /audit_log/{auditId} {
      // Only users with audit permission can read
      allow read: if isAuthenticated() && isActive() && 
                     hasPermission('audit:view');
      
      // Any authenticated user can append to audit log
      allow create: if isAuthenticated() && isActive() &&
                       hasRequiredFields(['auditId', 'timestamp', 'userId', 'action']);
      
      // Audit log is immutable (no updates or deletes)
      allow update, delete: if false;
    }
  }
}
```

---

## Testing Security Rules

### Test with Firebase Emulator

```bash
# Start emulators
firebase emulators:start

# In another terminal, run tests
firebase emulators:exec --only firestore "npm test"
```

### Manual Testing

Use the Emulator UI (http://localhost:4000) to:

1. Create test users with different roles
2. Try to access resources without permission
3. Verify rules block unauthorized access
4. Check that authorized access works

### Example Test Scenarios

**Scenario 1: User cannot edit another user's profile**
```javascript
// As user1, try to update user2's role
// Should fail
```

**Scenario 2: Viewer cannot create instruments**
```javascript
// As viewer role, try to create instrument
// Should fail
```

**Scenario 3: Admin can do everything**
```javascript
// As admin, try all operations
// Should succeed
```

**Scenario 4: User cannot delete from audit log**
```javascript
// As any user, try to delete audit entry
// Should fail
```

---

## Deploying Security Rules

### Deploy to Production

```bash
# Deploy only firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

### Verify Deployment

1. Go to Firebase Console
2. Navigate to Firestore Database → Rules
3. Verify the rules match your local `firestore.rules`
4. Check the "Published" timestamp

---

## Common Patterns

### Pattern 1: Resource-based Permission Check

```javascript
function hasPermission(permission) {
  let userPermissions = getUserData().permissions;
  return permission in userPermissions || '*:*' in userPermissions;
}

// Usage
allow read: if hasPermission('instruments:read');
```

### Pattern 2: Field-level Validation

```javascript
function validInstrument() {
  let data = request.resource.data;
  return data.naam is string &&
         data.naam.size() > 0 &&
         data.currentStatus in ['IN_STORAGE', 'CHECKED_OUT', 'IN_REPAIR'];
}

allow create: if hasPermission('instruments:create') && validInstrument();
```

### Pattern 3: Prevent Privilege Escalation

```javascript
allow update: if isOwner(userId) &&
                 !fieldChanged('role') &&
                 !fieldChanged('permissions');
```

### Pattern 4: Organization Isolation (Multi-tenancy)

```javascript
function sameOrg() {
  return resource.data.organizationId == getUserData().organizationId;
}

allow read: if hasPermission('instruments:read') && sameOrg();
```

---

## Best Practices

### 1. Always Check Authentication
```javascript
// Bad
allow read: if true;

// Good
allow read: if isAuthenticated() && hasPermission('resource:read');
```

### 2. Use Helper Functions
```javascript
// Extract common logic into functions
function isAuthenticated() {
  return request.auth != null;
}
```

### 3. Validate Write Data
```javascript
// Check required fields and data types
allow create: if hasRequiredFields(['field1', 'field2']) &&
                 request.resource.data.field1 is string;
```

### 4. Prevent Audit Log Tampering
```javascript
// Audit log is append-only
allow create: if isAuthenticated();
allow update, delete: if false;
```

### 5. Limit Read Access
```javascript
// Don't expose sensitive data to all users
allow read: if hasPermission('resource:read');
```

---

## Security Rule Debugging

### Enable Debug Mode

In `firebase.json`:
```json
{
  "emulators": {
    "firestore": {
      "port": 8080,
      "debug": true
    }
  }
}
```

### Check Emulator Logs

Watch the terminal where emulators are running for detailed rule evaluation logs.

### Use Firestore Rules Playground

1. Go to Firebase Console → Firestore Database → Rules
2. Click "Rules Playground" tab
3. Simulate reads/writes with different users and data
4. See which rules match and why

---

## Performance Considerations

### Minimize get() Calls

```javascript
// Bad: Multiple get() calls
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

allow read: if getUserData().status == 'active' && getUserData().role == 'admin';

// Good: Cache the result
let userData = getUserData();
allow read: if userData.status == 'active' && userData.role == 'admin';
```

### Use Indexes for Complex Queries

If you have complex permission checks, ensure Firestore has appropriate indexes.

---

## Migrating from Development to Production

### Step 1: Update Rules

Replace permissive test rules with the comprehensive rules above.

### Step 2: Test Thoroughly

Test all operations with different user roles in the emulator.

### Step 3: Deploy

```bash
firebase deploy --only firestore:rules
```

### Step 4: Monitor

Watch for permission denied errors in your application and investigate.

---

## Next Steps

1. Copy the complete security rules to `firebase/firestore.rules`
2. Test with Firebase emulators
3. Review [Code Patterns](./07-code-patterns.md) for client-side implementation
4. Deploy to production when ready

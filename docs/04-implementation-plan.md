# Implementation Plan

## Overview

This document provides a detailed, phase-by-phase plan for implementing the Instruments Tracker Firebase application. Each phase builds upon the previous one, allowing for iterative development and testing.

**Total Estimated Time:** 18-26 days

---

## Phase 1: Project Setup & Infrastructure (3-4 days)

### 1.1 Initialize Firebase Project

**Time:** 2-3 hours

**Tasks:**
1. Create Firebase project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (start in test mode)
3. Enable Authentication (Email/Password provider)
4. Enable Firebase Hosting
5. Note project ID and config values

**Deliverables:**
- Firebase project created
- Services enabled
- Configuration values documented

---

### 1.2 Setup Local Development Environment

**Time:** 3-4 hours

**Tasks:**
1. Install Node.js 18+ and npm
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Create Vite React TypeScript project:
   ```bash
   npm create vite@latest instruments-tracker -- --template react-ts
   cd instruments-tracker
   npm install
   ```
4. Install dependencies:
   ```bash
   # Firebase
   npm install firebase
   
   # TanStack
   npm install @tanstack/react-query @tanstack/react-form
   npm install @tanstack/zod-form-adapter
   
   # UI
   npm install tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   
   # Forms & Validation
   npm install zod
   
   # Routing
   npm install react-router-dom
   
   # Permissions
   npm install @casl/ability @casl/react
   
   # Charts
   npm install recharts
   
   # Utilities
   npm install date-fns
   npm install lucide-react
   npm install sonner  # Toast notifications
   
   # Dev dependencies
   npm install -D @types/node
   ```
5. Initialize Firebase in project:
   ```bash
   firebase login
   firebase init
   # Select: Firestore, Hosting, Emulators
   ```
6. Configure Tailwind CSS (update `tailwind.config.js`)
7. Install shadcn/ui:
   ```bash
   npx shadcn-ui@latest init
   ```

**Deliverables:**
- Project scaffolded with all dependencies
- Tailwind CSS configured
- shadcn/ui installed
- Firebase initialized

---

### 1.3 Project Structure Setup

**Time:** 2-3 hours

**Tasks:**
1. Create folder structure:
   ```bash
   mkdir -p src/{components/{ui,auth,layout,common},features,lib/{types},hooks,contexts,pages}
   mkdir -p firebase
   ```
2. Configure path aliases in `vite.config.ts` and `tsconfig.json`:
   ```typescript
   // vite.config.ts
   import path from 'path'
   
   export default defineConfig({
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```
3. Create `.env.example` and `.env.local` files
4. Set up ESLint and Prettier
5. Create `.gitignore` (include `.env.local`, `firebase-debug.log`, etc.)

**Deliverables:**
- Organized folder structure
- Path aliases configured
- Environment variable templates
- Code quality tools configured

---

### 1.4 Firebase Configuration

**Time:** 2-3 hours

**Tasks:**
1. Create `src/lib/firebase.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth, connectAuthEmulator } from 'firebase/auth';
   import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
   
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID,
   };
   
   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   
   // Connect to emulators in development
   if (import.meta.env.DEV) {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```
2. Configure `firebase.json` for emulators:
   ```json
   {
     "firestore": {
       "rules": "firebase/firestore.rules",
       "indexes": "firebase/firestore.indexes.json"
     },
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     },
     "emulators": {
       "auth": {
         "port": 9099
       },
       "firestore": {
         "port": 8080
       },
       "hosting": {
         "port": 5000
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```
3. Create temporary `firebase/firestore.rules` (permissive for now):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. Add npm scripts to `package.json`:
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview",
       "emulators": "firebase emulators:start --import=./firebase-data --export-on-exit",
       "deploy": "npm run build && firebase deploy"
     }
   }
   ```

**Deliverables:**
- Firebase SDK initialized
- Emulators configured
- npm scripts for development

---

## Phase 2: Core Infrastructure + RBAC Foundation (3-4 days)

### 2.1 TypeScript Types & Interfaces

**Time:** 3-4 hours

**Tasks:**
1. Create `src/lib/types/models.ts` with all data model interfaces (from 02-data-model.md)
2. Create `src/lib/types/permissions.ts`:
   ```typescript
   export type Actions = 
     | 'create' | 'read' | 'update' | 'delete' 
     | 'checkout' | 'return' | 'export' | 'verify'
     | 'invite' | 'manage' | 'rebuild' | 'view' | '*';
   
   export type Subjects = 
     | 'Instrument' | 'Person' | 'Location'
     | 'Movement' | 'Maintenance' | 'Usage'
     | 'Analytics' | 'Dashboard' | 'User' 
     | 'Role' | 'Audit' | 'System' | 'all';
   
   export interface Permission {
     permissionId: string;
     resource: string;
     action: string;
     description: string;
     category: 'masterData' | 'operations' | 'analytics' | 'admin' | 'system';
     isSystem: boolean;
   }
   ```
3. Create `src/lib/types/users.ts` with User, Role, Invitation interfaces

**Deliverables:**
- Complete TypeScript type definitions
- Type safety throughout application

---

### 2.2 ID Generation System

**Time:** 2-3 hours

**Tasks:**
1. Create `src/lib/idGenerator.ts`:
   ```typescript
   import { collection, query, where, getDocs } from 'firebase/firestore';
   import { db } from './firebase';
   
   const prefixMap: Record<string, string> = {
     instruments: 'INS',
     people: 'PER',
     locations: 'LOC',
     movements: 'MOV',
     maintenance: 'MNT',
     usage_events: 'USE',
     audit_log: 'AUD',
     invitations: 'INV',
   };
   
   export async function generateNextId(collectionName: string): Promise<string> {
     const prefix = prefixMap[collectionName] || 'GEN';
     const idField = getIdFieldName(collectionName);
     
     const q = query(
       collection(db, collectionName),
       where(idField, '>=', `${prefix}-0000`),
       where(idField, '<=', `${prefix}-9999`)
     );
     
     const snapshot = await getDocs(q);
     
     let maxNum = 0;
     snapshot.forEach(doc => {
       const id = doc.data()[idField];
       const match = id.match(/^[A-Z]+-(\d+)$/);
       if (match) {
         const num = parseInt(match[1], 10);
         if (num > maxNum) maxNum = num;
       }
     });
     
     const nextNum = maxNum + 1;
     return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
   }
   ```

**Deliverables:**
- ID generation utility
- Consistent ID format across collections

---

### 2.3 CASL Permission System

**Time:** 4-5 hours

**Tasks:**
1. Create `src/lib/permissions.ts` with all permission constants
2. Create `src/lib/roles.ts` with predefined roles
3. Create `src/lib/ability.ts`:
   ```typescript
   import { AbilityBuilder, createMongoAbility } from '@casl/ability';
   import type { User } from './types/users';
   import type { Actions, Subjects } from './types/permissions';
   
   export function defineAbilityFor(user: User) {
     const { can, build } = new AbilityBuilder(createMongoAbility);
     
     user.permissions.forEach(permission => {
       if (permission === '*:*') {
         can('manage', 'all');
         return;
       }
       
       const [resource, action] = permission.split(':');
       
       if (action === '*') {
         can('manage', resource as Subjects);
       } else {
         can(action as Actions, resource as Subjects);
       }
     });
     
     return build();
   }
   ```
4. Create `src/contexts/AbilityContext.tsx`:
   ```typescript
   import { createContext, useContext, ReactNode } from 'react';
   import { createContextualCan } from '@casl/react';
   import type { AppAbility } from '@/lib/ability';
   
   export const AbilityContext = createContext<AppAbility | undefined>(undefined);
   export const Can = createContextualCan(AbilityContext.Consumer);
   
   export function useAbility() {
     const ability = useContext(AbilityContext);
     if (!ability) throw new Error('useAbility must be used within AbilityProvider');
     return ability;
   }
   ```

**Deliverables:**
- CASL ability definitions
- Permission checking hooks
- Ability context provider

---

### 2.4 Seed System Data

**Time:** 2-3 hours

**Tasks:**
1. Create `src/lib/seedData.ts`:
   ```typescript
   // Seed system roles and permissions
   export async function seedSystemData() {
     await seedPermissions();
     await seedRoles();
   }
   ```
2. Implement functions to populate `permissions` and `roles` collections
3. Create script to run on first deployment

**Deliverables:**
- System permissions seeded
- Default roles seeded

---

## Phase 3: Authentication & User Management (3-4 days)

### 3.1 Authentication Context

**Time:** 3-4 hours

**Tasks:**
1. Create `src/contexts/AuthContext.tsx`:
   ```typescript
   import { createContext, useContext, useEffect, useState } from 'react';
   import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
   import { doc, getDoc } from 'firebase/firestore';
   import { auth, db } from '@/lib/firebase';
   import type { User } from '@/lib/types/users';
   
   interface AuthContextValue {
     currentUser: User | null;
     firebaseUser: FirebaseUser | null;
     loading: boolean;
   }
   
   const AuthContext = createContext<AuthContextValue | undefined>(undefined);
   
   export function AuthProvider({ children }) {
     const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
     const [currentUser, setCurrentUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       const unsubscribe = onAuthStateChanged(auth, async (user) => {
         setFirebaseUser(user);
         
         if (user) {
           const userDoc = await getDoc(doc(db, 'users', user.uid));
           if (userDoc.exists()) {
             setCurrentUser(userDoc.data() as User);
           }
         } else {
           setCurrentUser(null);
         }
         
         setLoading(false);
       });
       
       return unsubscribe;
     }, []);
     
     return (
       <AuthContext.Provider value={{ currentUser, firebaseUser, loading }}>
         {children}
       </AuthContext.Provider>
     );
   }
   
   export function useAuth() {
     const context = useContext(AuthContext);
     if (!context) throw new Error('useAuth must be used within AuthProvider');
     return context;
   }
   ```

**Deliverables:**
- Auth context with user state
- Hook for accessing current user

---

### 3.2 Login & Registration Pages

**Time:** 4-6 hours

**Tasks:**
1. Create `src/pages/auth/LoginPage.tsx` with TanStack Form
2. Create `src/pages/auth/RegisterPage.tsx` (first admin only)
3. Implement login/register logic
4. Style with shadcn/ui components
5. Add password reset flow

**Deliverables:**
- Login page
- Registration page (for first admin)
- Password reset

---

### 3.3 User Invitation System

**Time:** 6-8 hours

**Tasks:**
1. Create `src/features/users/services/invitationService.ts`
2. Implement `inviteUser()` function
3. Create `src/pages/auth/AcceptInvitationPage.tsx`
4. Implement `acceptInvitation()` function
5. Create UI for sending invitations (admin page)

**Deliverables:**
- Invitation creation
- Invitation acceptance flow
- Admin UI for inviting users

---

### 3.4 Account Management

**Time:** 3-4 hours

**Tasks:**
1. Create `src/pages/account/AccountSettingsPage.tsx`
2. Profile section (display name)
3. Change password section
4. Preferences section (theme, language, default view)
5. Save preferences to Firestore

**Deliverables:**
- Account settings page
- Profile management
- Preferences management

---

## Phase 4: Main Layout with RBAC (1-2 days)

### 4.1 App Shell & Navigation

**Time:** 4-6 hours

**Tasks:**
1. Create `src/components/layout/AppShell.tsx`
2. Create `src/components/layout/Sidebar.tsx` with permission-based nav items
3. Create `src/components/layout/Header.tsx` with user menu
4. Create `src/components/layout/UserMenu.tsx`
5. Implement responsive design
6. Add dark mode toggle

**Deliverables:**
- App shell layout
- Permission-based sidebar
- User menu with account settings

---

### 4.2 Routing Setup

**Time:** 2-3 hours

**Tasks:**
1. Create `src/App.tsx` with React Router
2. Create `src/components/auth/ProtectedRoute.tsx`
3. Define all routes
4. Implement lazy loading for pages

**Deliverables:**
- Complete routing structure
- Protected routes
- Lazy-loaded pages

---

## Phase 5: Admin Features (2-3 days)

### 5.1 User Management Page

**Time:** 6-8 hours

**Tasks:**
1. Create `src/pages/admin/UsersPage.tsx`
2. List all users with search/filter
3. Create `src/features/users/components/InviteUserDialog.tsx`
4. Create `src/features/users/components/UserRoleEditor.tsx`
5. Implement user activation/deactivation
6. View user activity

**Deliverables:**
- User management page
- Invite user dialog
- Edit user permissions
- Deactivate users

---

### 5.2 Role Management Page (Optional)

**Time:** 4-6 hours

**Tasks:**
1. Create `src/pages/admin/RolesPage.tsx`
2. List all roles
3. Create custom role form
4. Create permission matrix component
5. Assign roles to users

**Deliverables:**
- Role management page
- Custom role creation
- Permission matrix UI

---

## Phase 6: Master Data Management (3-4 days)

### 6.1 Instruments Module

**Time:** 8-10 hours

**Tasks:**
1. Create `src/features/instruments/services/instrumentService.ts`
2. Create `src/features/instruments/components/InstrumentsList.tsx`
3. Create `src/features/instruments/components/InstrumentForm.tsx` with TanStack Form
4. Create `src/features/instruments/components/InstrumentDetails.tsx`
5. Create `src/pages/instruments/InstrumentsPage.tsx`
6. Implement CRUD operations with permission guards
7. Add search/filter functionality

**Deliverables:**
- Instruments list page
- Add/edit instrument forms
- Instrument details view
- Permission-based access

---

### 6.2 People & Locations Modules

**Time:** 4-6 hours

**Tasks:**
1. Create services, components, and pages for People
2. Create services, components, and pages for Locations
3. Implement CRUD operations
4. Add permission guards

**Deliverables:**
- People management
- Locations management

---

## Phase 7: Core Operations (3-4 days)

### 7.1 Checkout/Return

**Time:** 6-8 hours

**Tasks:**
1. Create `src/features/operations/components/CheckoutForm.tsx`
2. Create `src/features/operations/components/ReturnForm.tsx`
3. Implement checkout logic (create movement, update instrument)
4. Implement return logic (close movement, update instrument)
5. Add validations
6. Create audit log entries

**Deliverables:**
- Checkout form and logic
- Return form and logic
- Audit logging

---

### 7.2 Maintenance & Usage Logging

**Time:** 4-6 hours

**Tasks:**
1. Create maintenance form and service
2. Create usage logging form and service
3. Implement with permission checks

**Deliverables:**
- Maintenance logging
- Usage logging

---

## Phase 8: History & Audit (2-3 days)

### 8.1 Instrument History

**Time:** 4-6 hours

**Tasks:**
1. Create `src/features/history/services/historyService.ts`
2. Fetch movements, maintenance, usage for instrument
3. Create timeline UI component
4. Display with user info

**Deliverables:**
- Instrument history page
- Timeline UI

---

### 8.2 Audit Trail System

**Time:** 4-6 hours

**Tasks:**
1. Create `src/lib/auditLogger.ts`
2. Implement hash chaining (SHA-256)
3. Create audit log viewer page
4. Implement audit chain verification
5. Admin-only access

**Deliverables:**
- Automatic audit logging
- Audit log viewer
- Chain verification

---

## Phase 9: Analytics & Dashboard (3-4 days)

### 9.1 Financial Analytics

**Time:** 6-8 hours

**Tasks:**
1. Create depreciation calculation service
2. Create book value computation
3. Implement rebuild mechanism
4. Create UI for financial analytics

**Deliverables:**
- Depreciation schedules
- Book value calculations

---

### 9.2 Maintenance Analytics

**Time:** 4-6 hours

**Tasks:**
1. Create usage statistics calculation
2. Create maintenance predictions
3. Implement rebuild mechanism

**Deliverables:**
- Usage statistics
- Maintenance predictions

---

### 9.3 Financial Dashboard

**Time:** 6-8 hours

**Tasks:**
1. Create dashboard page with Recharts
2. Key metrics cards
3. Book value over time chart
4. Maintenance costs chart
5. Export to PDF (optional)

**Deliverables:**
- Financial dashboard
- Interactive charts

---

## Phase 10: Views & Reports (2-3 days)

### 10.1 Overview Pages

**Time:** 6-8 hours

**Tasks:**
1. Create instruments overview page
2. Create open checkouts view
3. Create recent returns view
4. Create maintenance overview
5. Create usage overview
6. Implement sortable, filterable tables

**Deliverables:**
- All overview pages
- Data tables with sorting/filtering

---

## Phase 11: Optimization & Polish (2-3 days)

### 11.1 Performance Optimization

**Time:** 4-6 hours

**Tasks:**
1. Implement React Query caching strategies
2. Add pagination to lists
3. Optimize Firestore queries
4. Add indexes to Firestore

**Deliverables:**
- Optimized queries
- Caching implemented
- Pagination added

---

### 11.2 UI/UX Polish

**Time:** 6-8 hours

**Tasks:**
1. Add loading skeletons
2. Implement error boundaries
3. Add toast notifications
4. Polish forms with better validation errors
5. Add dark mode
6. Test responsive design

**Deliverables:**
- Loading states
- Error handling
- Toast notifications
- Dark mode
- Mobile-friendly

---

## Phase 12: Multi-Tenant Readiness (1 day)

### 12.1 Prepare Data Model

**Time:** 2-3 hours

**Tasks:**
1. Add `organizationId` field to interfaces (optional, null)
2. Document multi-tenant activation steps

**Deliverables:**
- Multi-tenant ready data model

---

## Phase 13: Testing & Deployment (1-2 days)

### 13.1 Testing

**Time:** 4-6 hours

**Tasks:**
1. Manual testing with Firebase emulators
2. Test all CRUD operations with different roles
3. Test permission guards
4. Test invitation flow
5. Test audit trail
6. Test analytics

**Deliverables:**
- Comprehensive manual testing

---

### 13.2 Production Deployment

**Time:** 2-3 hours

**Tasks:**
1. Update Firestore security rules for production
2. Deploy to Firebase Hosting: `npm run deploy`
3. Seed system roles and permissions
4. Create first admin user
5. Invite team members
6. Monitor for issues

**Deliverables:**
- Application deployed to production
- First admin created
- Team invited

---

## Milestone Checklist

### ✅ Phase 1-2 Complete
- [ ] Firebase project setup
- [ ] Local dev environment working
- [ ] Firebase emulators running
- [ ] RBAC system foundation in place
- [ ] TypeScript types defined

### ✅ Phase 3-4 Complete
- [ ] Authentication working
- [ ] User invitation system working
- [ ] Account management functional
- [ ] App layout with permission-based nav

### ✅ Phase 5-6 Complete
- [ ] User management page working
- [ ] Instruments CRUD complete
- [ ] People and Locations CRUD complete

### ✅ Phase 7-8 Complete
- [ ] Checkout/Return working
- [ ] Maintenance and usage logging working
- [ ] Instrument history visible
- [ ] Audit trail functioning

### ✅ Phase 9-10 Complete
- [ ] Analytics calculating correctly
- [ ] Dashboard displaying charts
- [ ] All overview pages complete

### ✅ Phase 11-13 Complete
- [ ] Performance optimized
- [ ] UI polished
- [ ] Tested thoroughly
- [ ] Deployed to production

---

## Phase 14: Internationalisation / Translations (1-2 days)

**Goal:** Replace all hard-coded UI strings with a JSON-key-value translation system supporting English (`en`) and Dutch (`nl`). The language selection is persisted per-user in Firestore (already part of the account preferences object).

### 14.1 Translation Infrastructure

**Tasks:**
1. Install `i18next` + `react-i18next` (no heavy framework, minimal footprint):
   ```bash
   npm install i18next react-i18next
   ```
2. Create `src/i18n/index.ts` — initialises i18next with JSON resources, `fallbackLng: 'en'`, reads `navigator.language` as default.
3. Create translation files:
   - `src/i18n/locales/en.json`
   - `src/i18n/locales/nl.json`
   Each file is a flat or shallowly-nested key-value map organised by feature area:
   ```json
   {
     "instruments.title": "Instruments",
     "instruments.addButton": "Add instrument",
     ...
   }
   ```
4. Bootstrap i18n in `src/main.tsx` (import `'@/i18n'` before rendering).

### 14.2 Wire Translations into Components

**Tasks:**
1. Replace every hard-coded string in routes, components, and dialogs with `t('key')` calls using the `useTranslation` hook.
2. Start with high-traffic pages (instruments, movements, maintenance, dashboard) then proceed to dialogs and admin pages.
3. Keep translation keys co-located by feature prefix (e.g. `instruments.*`, `movements.*`, `nav.*`, `common.*`).

### 14.3 Language Switcher

**Tasks:**
1. Add a language dropdown to the Account Settings page that calls `i18n.changeLanguage(lang)`.
2. Persist selected language to `users/{uid}.preferences.language` in Firestore (already in the `User` type).
3. On app load, read `currentUser.preferences.language` and call `i18n.changeLanguage()` after auth resolves.

**Deliverables:**
- `en.json` + `nl.json` covering all UI strings
- All components use `useTranslation` / `t()`
- Language persisted per user in Firestore

---

## Phase 15: Dynamic Role Creation (1-2 days)

**Goal:** Allow admins to create, edit, and delete custom roles through the UI using a permission-matrix form. System roles (seeded) are read-only.

### 15.1 Role Service

**Tasks:**
1. Extend `src/features/users/services/userService.ts` (or create `roleService.ts`) with:
   - `createRole(data: RoleData): Promise<string>`
   - `updateRole(roleId: string, data: Partial<RoleData>): Promise<void>`
   - `deleteRole(roleId: string): Promise<void>`
2. Guard against deleting a role that is still assigned to at least one user (query `users` collection first).
3. Mark system roles with `isSystem: true` in Firestore; UI disables edit/delete for those.

### 15.2 Role Form with Permission Matrix

**Tasks:**
1. Create `src/features/users/components/RoleDialog.tsx` — a shadcn Dialog with:
   - `name` text field + `description` text field
   - Permission matrix: rows = permissions grouped by category (`masterData`, `operations`, `analytics`, `admin`, `system`), columns = action checkboxes
   - Uses TanStack Form + Zod validation (inline parse in `onSubmit`)
2. Wire `RoleDialog` into `src/routes/_authenticated/admin/roles.tsx`:
   - Add **Create role** button (visible only if `can('create', 'Role')`)
   - Each row shows **Edit** / **Delete** actions (disabled for system roles)

### 15.3 Firestore Rules Update

**Tasks:**
1. Add rules for `roles` collection: only users with the `Role:create/update/delete` permission may write; all authenticated users may read.

**Deliverables:**
- Create / edit / delete custom roles from the Admin → Roles page
- Permission matrix UI
- System roles remain locked

---

## Phase 16: Usage Calculated by Days Checked Out (1 day)

**Goal:** Replace the current manual usage-event logging model with an automatic day-based accumulation. Usage is derived on-the-fly from `movements` records — no extra Firestore writes needed.

### 16.1 Days-Checked-Out Calculation

**Tasks:**
1. Create `src/features/analytics/services/usageDaysService.ts`:
   ```typescript
   // For a single instrument
   export function calcCheckedOutDays(movements: MovementWithId[]): number
   // For all instruments (returns Map<instrumentId, days>)
   export function calcAllCheckedOutDays(movements: MovementWithId[]): Map<string, number>
   ```
   Logic:
   - For each closed movement (has `returnedAt`): `days += differenceInCalendarDays(returnedAt, checkedOutAt)`
   - For each open movement (no `returnedAt`): `days += differenceInCalendarDays(today, checkedOutAt)`
   - Sum all movements per instrument.
2. Replace the existing `usageStats` rebuild logic in `analyticsService.ts` with a call to `calcAllCheckedOutDays`.

### 16.2 UI Updates

**Tasks:**
1. Instruments list: add a **Days checked out** column (hide if 0, show tooltip with breakdown if available).
2. Instrument detail / history page (`$instrumentId.tsx`): show total days checked out at the top of the history panel.
3. Analytics page (`analytics/index.tsx`): replace the old usage-events table with a **Usage by days** table showing `instrumentId`, `name`, `totalDays`, `avgDaysPerCheckout`.
4. Dashboard KPI: add a "Most-used instrument" card (highest total days).

### 16.3 Depreciate Manual Usage Events (Optional)

**Tasks:**
1. Keep the `usage_events` collection and `UsageEventDialog` in place for now (they may track practice hours separately), but clearly separate the concepts in the UI: "Usage events" = practice sessions logged manually; "Days checked out" = automatically derived from movements.
2. Add a UI label clarifying the distinction on the Analytics page.

**Deliverables:**
- `calcCheckedOutDays` utility
- Analytics page shows days-based usage
- Dashboard KPI updated
- Instrument detail shows total days

---

## Next Steps

1. Begin with Phase 1: Project Setup
2. Follow [Development Setup Guide](./05-development-setup.md)
3. Reference [Code Patterns](./07-code-patterns.md) during development
4. Consult [Security Rules](./06-security-rules.md) when implementing access control

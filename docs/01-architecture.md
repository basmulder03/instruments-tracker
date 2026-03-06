# Architecture & Tech Stack

## System Architecture

### Overview

The Instruments Tracker is a modern web application built with a clear separation between frontend and backend, leveraging Firebase's Backend-as-a-Service (BaaS) platform.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (SPA)                              │  │
│  │  - React Router (Client-side routing)                │  │
│  │  - TanStack Query (State management & caching)       │  │
│  │  - CASL (Permission checks)                          │  │
│  │  - shadcn/ui + Tailwind (UI components)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      Firebase Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firestore  │  │  Auth        │  │  Hosting     │     │
│  │   (NoSQL DB) │  │  (Identity)  │  │  (Static)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Functions*  │  │  Storage*    │  * Future/Optional     │
│  │  (Serverless)│  │  (Files)     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Client-Side First:** Most logic runs in the browser for fast UX
2. **Declarative Security:** Firestore security rules enforce access control
3. **Optimistic Updates:** UI updates immediately, syncs in background
4. **Caching Strategy:** Aggressive caching to minimize Firestore reads
5. **Progressive Enhancement:** Core features work without JavaScript (where possible)

---

## Technology Stack

### Frontend Stack

#### Core Framework
**React 18 + TypeScript**
- **React 18:** Modern React with concurrent features, automatic batching
- **TypeScript:** Type safety, better IDE support, fewer runtime errors
- **Why:** Industry standard, huge ecosystem, excellent tooling

#### Build Tool
**Vite**
- **Version:** Latest (5.x+)
- **Features:** 
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds with Rollup
  - Native ESM support
  - Built-in TypeScript support
- **Why:** Faster than Create React App, modern, great DX

#### UI Framework
**shadcn/ui + Tailwind CSS**
- **shadcn/ui:** Copy-paste component library built on Radix UI
  - Accessible by default (ARIA compliant)
  - Fully customizable (owns the code)
  - Beautiful default styling
- **Tailwind CSS:** Utility-first CSS framework
  - Rapid UI development
  - Small bundle size (purges unused CSS)
  - Consistent design system
- **Why:** Modern, trendy, flexible, great developer experience

#### Form Management
**TanStack Form (React) + Zod**
- **TanStack Form:** Headless form library
  - Type-safe form state management
  - Field-level validation
  - Framework-agnostic core
  - Small bundle size (~13KB)
- **Zod:** TypeScript-first schema validation
  - Runtime type checking
  - Excellent TypeScript inference
  - Composable validators
- **Why:** Modern alternative to React Hook Form, better TypeScript support

#### State Management
**TanStack Query (React Query v5)**
- **Features:**
  - Server state management & caching
  - Automatic background refetching
  - Optimistic updates
  - Request deduplication
  - Garbage collection
- **Why:** Perfect for Firebase, reduces Firestore reads dramatically

#### Routing
**React Router v6**
- **Features:**
  - Declarative routing
  - Nested routes
  - Lazy loading
  - Protected routes
- **Why:** Industry standard, mature, great TypeScript support

#### Permission Management
**CASL (Isomorphic Authorization)**
- **Features:**
  - Declarative permission definitions
  - Type-safe ability checks
  - React integration
  - Works client and server-side
- **Why:** Flexible, powerful, supports fine-grained permissions

#### Charts & Visualization
**Recharts**
- **Features:**
  - Built on D3.js
  - Composable chart components
  - Responsive by default
  - TypeScript support
- **Why:** Easy to use, great for business dashboards

#### Date Handling
**date-fns**
- **Features:**
  - Modular (tree-shakeable)
  - Immutable
  - TypeScript support
- **Why:** Smaller than Moment.js, modern, functional approach

#### Additional UI Libraries
- **Lucide React:** Beautiful, consistent icons
- **Sonner:** Toast notifications
- **cmdk:** Command palette (for future keyboard shortcuts)
- **react-hot-toast:** Alternative toast library

---

### Backend Stack

#### Database
**Firebase Firestore**
- **Type:** NoSQL document database
- **Features:**
  - Real-time synchronization (optional)
  - Offline support
  - Automatic scaling
  - Rich querying capabilities
  - Compound indexes
- **Why:** Serverless, scales automatically, excellent free tier

#### Authentication
**Firebase Authentication**
- **Provider:** Email/Password (extensible to OAuth later)
- **Features:**
  - Built-in security
  - Session management
  - Password reset flows
  - Email verification
- **Why:** Integrates seamlessly with Firestore, secure by default

#### Hosting
**Firebase Hosting**
- **Features:**
  - Global CDN
  - Automatic HTTPS
  - Custom domains
  - Rollback support
  - Preview channels
- **Why:** Free tier, perfect for SPAs, integrates with Firebase

#### Cloud Functions (Optional/Future)
**Firebase Cloud Functions**
- **Use Cases:**
  - Send invitation emails
  - Complex analytics calculations
  - Scheduled tasks (depreciation recalculation)
  - Background data processing
- **Why:** Serverless, scales automatically, integrates with Firebase

#### File Storage (Future)
**Firebase Storage**
- **Use Cases:**
  - Instrument photos
  - Maintenance receipts
  - PDF exports
- **Why:** Integrates with Firestore, secure, scalable

---

## Development Tools

### Package Manager
**npm** (can use yarn or pnpm if preferred)

### Code Quality
- **ESLint:** JavaScript/TypeScript linting
  - React plugin
  - TypeScript ESLint parser
  - Recommended rules + custom rules
- **Prettier:** Code formatting
  - Consistent code style
  - Integrates with ESLint
- **TypeScript Strict Mode:** Maximum type safety

### Local Development
**Firebase Emulators Suite**
- **Emulators:**
  - Firestore Emulator (database)
  - Authentication Emulator (users/auth)
  - Hosting Emulator (serves static files)
  - Functions Emulator (optional)
- **Features:**
  - Complete local testing
  - No cloud costs during development
  - Fast iteration
  - Data persistence between runs
  - UI for inspecting data

### Version Control
**Git**
- Semantic commit messages
- Feature branches
- Pull request workflow (optional)

---

## Project Structure

```
instruments-tracker/
├── .firebase/                 # Firebase config and cache
├── .vscode/                   # VS Code settings (optional)
├── docs/                      # Documentation (this folder)
├── firebase/                  # Firebase-specific files
│   ├── firestore.rules       # Security rules
│   ├── firestore.indexes.json# Firestore indexes
│   └── functions/            # Cloud Functions (optional)
├── public/                    # Static assets
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Auth-specific components
│   │   ├── layout/          # Layout components
│   │   └── common/          # Shared components
│   ├── features/            # Feature-based modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── account/
│   │   ├── instruments/
│   │   ├── people/
│   │   ├── locations/
│   │   ├── operations/
│   │   ├── history/
│   │   ├── analytics/
│   │   └── dashboard/
│   ├── lib/                 # Utilities and config
│   │   ├── firebase.ts      # Firebase initialization
│   │   ├── ability.ts       # CASL ability definitions
│   │   ├── permissions.ts   # Permission constants
│   │   ├── roles.ts         # Default roles
│   │   ├── idGenerator.ts   # ID generation logic
│   │   ├── auditLogger.ts   # Audit trail helpers
│   │   └── types/           # TypeScript types
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAbility.ts
│   │   ├── useCurrentUser.ts
│   │   └── useFirestore.ts
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── AbilityContext.tsx
│   ├── pages/               # Route components
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── account/
│   │   ├── instruments/
│   │   └── ...
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── .env.example             # Example environment variables
├── .env.local               # Local environment variables (git-ignored)
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
└── README.md                # Project overview
```

---

## Feature-Based Organization

Each feature module follows this structure:

```
features/instruments/
├── components/              # Feature-specific components
│   ├── InstrumentsList.tsx
│   ├── InstrumentForm.tsx
│   ├── InstrumentDetails.tsx
│   └── InstrumentFilters.tsx
├── hooks/                   # Feature-specific hooks
│   ├── useInstruments.ts
│   ├── useInstrument.ts
│   └── useInstrumentForm.ts
├── services/                # API/Firebase interactions
│   └── instrumentService.ts
├── types.ts                 # Feature-specific types
└── index.ts                 # Public exports
```

**Benefits:**
- Clear boundaries between features
- Easy to find related code
- Better code splitting
- Easier to test
- Scales well as app grows

---

## Data Flow

### 1. User Action (e.g., Create Instrument)

```
User fills form
     ↓
TanStack Form validates with Zod
     ↓
Submit handler calls service function
     ↓
Service checks permissions (CASL)
     ↓
Service calls Firebase SDK
     ↓
Firestore security rules validate
     ↓
Document created in Firestore
     ↓
TanStack Query invalidates cache
     ↓
UI re-renders with new data
     ↓
Toast notification shows success
     ↓
Audit log entry created
```

### 2. Permission Check

```
Component renders
     ↓
useAbility() hook gets current user's abilities
     ↓
ability.can('create', 'Instrument') checks permission
     ↓
Button shows/hides or enables/disables based on result
```

### 3. Data Fetching

```
Component mounts
     ↓
useQuery hook runs
     ↓
Check TanStack Query cache (is data fresh?)
     ↓ YES → Return cached data
     ↓ NO  → Fetch from Firestore
     ↓
Firestore security rules validate read permission
     ↓
Data returned and cached
     ↓
Component renders with data
     ↓
Background refetch after staleTime (5 min)
```

---

## Deployment Architecture

### Development
```
Local Machine
├── Vite Dev Server (localhost:5173)
└── Firebase Emulators (localhost:4000)
    ├── Firestore (localhost:8080)
    ├── Auth (localhost:9099)
    └── Hosting (localhost:5000)
```

### Production
```
Firebase Platform
├── Hosting (CDN)
│   └── Static React SPA
├── Firestore
│   └── Production database
└── Authentication
    └── User management
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Firebase Authentication**
- Only authenticated users can access the app
- Email verification (optional)
- Password complexity requirements

**Layer 2: Firestore Security Rules**
- Server-side enforcement of permissions
- Validates user role and permissions
- Prevents unauthorized reads/writes
- Immutable audit log

**Layer 3: Client-Side Permission Checks (CASL)**
- UI-level enforcement
- Hides/disables unauthorized actions
- Better UX (no failed requests)

**Layer 4: Application Logic**
- Service layer validates inputs
- Prevents business logic violations
- Consistent ID generation
- Audit logging

---

## Performance Considerations

### Bundle Size Optimization
- Code splitting by route (React.lazy)
- Tree-shaking (Vite + ES modules)
- Dynamic imports for large libraries
- Optimized images (WebP, lazy loading)

### Firestore Read Optimization
- TanStack Query caching (5-minute stale time)
- Pagination (10-20 items per page)
- Selective real-time listeners
- Compound queries with indexes

### Rendering Optimization
- React.memo for expensive components
- useMemo/useCallback where beneficial
- Virtual scrolling for long lists (react-virtual)
- Debounced search inputs

---

## Scalability

### Current Architecture (Single Tenant)
- Supports hundreds of users
- Thousands of instruments
- Millions of documents
- Sub-second response times

### Future Multi-Tenant Architecture
- Add `organizationId` to all documents
- Update security rules to filter by org
- Add organization management UI
- Billing per organization (optional)

---

## Extensibility

### Easy to Add
- New resources (e.g., Suppliers, Contracts)
- New permissions (add to registry)
- New roles (admin UI)
- New chart types (Recharts)
- File uploads (Firebase Storage)

### Requires More Work
- Mobile app (React Native + shared logic)
- Email notifications (Cloud Functions)
- Complex workflows (state machines)
- Advanced analytics (BigQuery integration)

---

## Comparison: Old vs New

| Aspect | Google Sheets | Firebase App |
|--------|--------------|--------------|
| **Performance** | Slow (5-10s loads) | Fast (<1s loads) |
| **UX** | Spreadsheet UI | Modern web app |
| **Offline** | Limited | Full offline support* |
| **Scalability** | 100s of rows | Millions of docs |
| **Access Control** | Sheet-level | Fine-grained RBAC |
| **Customization** | Limited | Fully customizable |
| **Mobile** | Poor | Responsive |
| **Search** | Basic | Advanced filters |
| **Reports** | Static charts | Interactive charts |
| **Audit** | Hash chain | Hash chain + user tracking |
| **Cost** | Free | Free tier sufficient |

\* With additional PWA setup

---

## Next Steps

1. Review [Data Model](./02-data-model.md) to understand Firestore collections
2. Study [RBAC & Permissions](./03-rbac-permissions.md) for access control
3. Follow [Development Setup](./05-development-setup.md) to start coding

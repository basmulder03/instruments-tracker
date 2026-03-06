# Instruments Tracker - Firebase Migration Project

## Overview

This document outlines the complete migration plan for the Instruments Tracker application from Google Sheets with Google Apps Script to a modern Firebase-based web application.

### Current System
- **Platform:** Google Sheets with Google Apps Script
- **Issues:** Slow performance, poor UX, limited by spreadsheet constraints
- **Link:** [Current Google Sheet](https://docs.google.com/spreadsheets/d/1JtFMiroym9F2YcRYKHj0j8Ukrv8SlCh2cfgmWOGGJAc/edit?usp=sharing)

### New System Goals
- **Fast & Responsive:** Modern web application with instant loading
- **Sleek UI:** Modern, intuitive interface designed for workflows
- **Local Development:** Completely locally runnable with Firebase emulators
- **Scalable:** Built to grow with your needs
- **Secure:** Fine-grained RBAC with permission-based access control
- **Cost-Effective:** Optimized for Firebase free tier

---

## Documentation Structure

### Core Documentation
1. **[Architecture & Tech Stack](./01-architecture.md)** - System design and technology choices
2. **[Data Model](./02-data-model.md)** - Complete Firestore collections and schemas
3. **[RBAC & Permissions](./03-rbac-permissions.md)** - Role-based access control system
4. **[Implementation Plan](./04-implementation-plan.md)** - Detailed phase-by-phase plan
5. **[Development Setup](./05-development-setup.md)** - Getting started with local development
6. **[Security Rules](./06-security-rules.md)** - Firestore security rules reference
7. **[Code Patterns](./07-code-patterns.md)** - Common patterns and examples
8. **[API Reference](./08-api-reference.md)** - Service layer documentation

### Additional Documentation
- **[Migration from Google Sheets](./migration-guide.md)** - Steps to migrate existing data
- **[Deployment Guide](./deployment-guide.md)** - Production deployment steps
- **[User Management Guide](./user-management-guide.md)** - Managing users and permissions
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project created
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repo-url>
cd instruments-tracker

# Install dependencies
npm install

# Configure Firebase
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Start Firebase emulators
npm run emulators

# In another terminal, start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

---

## Key Features

### Current Features (from Google Apps Script)
- ✅ Instrument, People, and Location management
- ✅ Checkout/Return instrument workflows
- ✅ Maintenance logging and tracking
- ✅ Usage event logging
- ✅ Complete instrument history
- ✅ Financial analytics (depreciation, book value)
- ✅ Maintenance predictions (time-based and usage-based)
- ✅ Audit trail with hash chaining
- ✅ Financial dashboard with charts
- ✅ Protected read-only views

### New Features (Firebase Migration)
- ✅ Fine-grained permission system (action + resource based)
- ✅ User invitation system with role assignment
- ✅ Account management with preferences
- ✅ Multi-tenant ready architecture
- ✅ Modern, responsive UI
- ✅ Real-time updates (optional)
- ✅ Offline capability (PWA ready)
- ✅ Dark mode support
- ✅ Enhanced search and filtering
- ✅ Export capabilities (CSV, PDF)

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **Forms:** TanStack Form + Zod validation
- **State:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Charts:** Recharts
- **Permissions:** CASL

### Backend
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password)
- **Hosting:** Firebase Hosting
- **Functions:** Firebase Cloud Functions (optional)

### Development
- **Package Manager:** npm
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Local Development:** Firebase Emulators Suite

---

## Project Timeline

**Estimated Duration:** 18-26 days of focused development

### Phase Breakdown
- **Setup & RBAC Foundation** (3-4 days)
- **Authentication & User Management** (3-4 days)
- **Layout & Navigation** (1-2 days)
- **Admin Features** (2-3 days)
- **Core CRUD Operations** (3-4 days)
- **History & Audit** (3-4 days)
- **Analytics & Dashboard** (2-3 days)
- **Polish & Testing** (1-2 days)

See [Implementation Plan](./04-implementation-plan.md) for detailed breakdown.

---

## Firebase Free Tier Considerations

The application is optimized to stay within Firebase free tier limits:

### Quotas
- **Firestore:** 50K reads, 20K writes, 20K deletes per day
- **Authentication:** Unlimited for email/password
- **Hosting:** 10GB storage, 360MB/day transfer
- **Storage:** 5GB total (for future file uploads)

### Optimization Strategies
1. **Caching:** React Query with 5-minute stale time for master data
2. **Pagination:** Limit queries to 10-20 items per page
3. **Batch Operations:** Group writes when possible
4. **Selective Listeners:** Avoid real-time listeners where not needed
5. **Audit Logging:** Only for CUD operations (not reads)

---

## Security & Access Control

### Authentication
- Email/password authentication via Firebase Auth
- Invitation-only user registration (after first admin)
- Password reset flows
- Session management

### Authorization (RBAC)
- **Fine-grained permissions:** `resource:action` format (e.g., `instruments:create`)
- **Dynamic role system:** Predefined + custom roles
- **Per-user permission overrides:** Customize beyond role defaults
- **Client-side enforcement:** CASL ability checks
- **Server-side enforcement:** Firestore security rules

### Predefined Roles
- **Admin:** Full system access
- **Manager:** Operations + analytics, no user management
- **User:** Daily operations (checkout, return, maintenance)
- **Viewer:** Read-only access

See [RBAC & Permissions](./03-rbac-permissions.md) for complete details.

---

## Support & Contribution

### Getting Help
- Review [Troubleshooting Guide](./troubleshooting.md)
- Check [Code Patterns](./07-code-patterns.md) for examples
- Review Firebase documentation

### Development Guidelines
- Follow TypeScript strict mode
- Use TanStack Form for all forms
- Implement permission checks for all actions
- Add audit logging for CUD operations
- Write clear commit messages
- Test with Firebase emulators before deploying

---

## License

[Specify your license here]

---

## Authors & Acknowledgments

- **Original System:** Google Apps Script implementation
- **Firebase Migration:** [Your name/team]
- **UI Framework:** shadcn/ui by shadcn
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Next Steps

1. Read [Architecture & Tech Stack](./01-architecture.md)
2. Review [Data Model](./02-data-model.md)
3. Understand [RBAC System](./03-rbac-permissions.md)
4. Follow [Development Setup](./05-development-setup.md)
5. Start implementing following [Implementation Plan](./04-implementation-plan.md)

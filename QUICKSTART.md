# Quick Start Guide

## Phase 1 Complete! 🎉

The project infrastructure is now set up. Here's what you need to know:

## Current Status

- ✅ Vite + React + TypeScript configured
- ✅ All dependencies defined in package.json
- ✅ Firebase configuration ready
- ✅ Firestore security rules created
- ✅ Tailwind CSS + shadcn/ui configured
- ✅ Project folder structure created
- ✅ Environment variables set up
- ⏳ Dependencies are installing (may take a few minutes)

## What's Next?

### Option 1: Wait for Installation to Complete & Test
Once `npm install` finishes, you can test the setup:

```bash
# Start the dev server
npm run dev

# In another terminal, start Firebase emulators (requires Firebase CLI)
npm run firebase:emulators
```

Then visit http://localhost:5173 to see the app.

### Option 2: Set Up Firebase Project (Can do while waiting)

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enable these services:
   - **Authentication** → Sign-in method → Email/Password (enable it)
   - **Firestore Database** → Create database (start in test mode)
4. Register a web app:
   - Project Settings → Your apps → Add app → Web
   - Copy the Firebase config values
5. Install Firebase CLI (if not already):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

### Option 3: Continue with Phase 2 Implementation

Since the infrastructure is ready, we can start implementing Phase 2:
- Type definitions
- CASL permission system
- Auth context
- Firestore services
- Custom hooks

## Before You Start Development

You'll need the Firebase CLI for emulators:

```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this project (if using a real Firebase project)
firebase init
# Select:
# - Firestore (already configured)
# - Emulators (already configured)
```

## Development Workflow

### For Local Development (No Real Firebase Project Needed)

```bash
# Terminal 1: Start Firebase Emulators
npm run firebase:emulators

# Terminal 2: Start Vite dev server
npm run dev
```

### For Production/Real Firebase

1. Update `.env.local` with real Firebase config values
2. Set `VITE_USE_EMULATORS=false`
3. Deploy: `firebase deploy`

## File Organization

```
src/
├── components/     # Reusable UI components
│   ├── ui/        # shadcn/ui components
│   └── layout/    # Header, Sidebar, etc.
├── features/      # Feature-specific code
│   ├── auth/      # Login, signup, etc.
│   ├── instruments/
│   ├── people/
│   └── ...
├── config/        # App configuration
│   └── firebase.ts
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── lib/          # Utilities
├── services/     # API/Firestore services
├── types/        # TypeScript types
└── utils/        # Helper functions
```

## Import Aliases

Use the `@/` alias for cleaner imports:

```tsx
// Instead of: import { cn } from '../../../lib/utils'
import { cn } from '@/lib/utils'

// Instead of: import { Button } from '../../components/ui/button'
import { Button } from '@/components/ui/button'
```

## Key Commands

```bash
npm run dev                          # Start dev server
npm run build                        # Build for production
npm run preview                      # Preview production build
npm run lint                         # Run ESLint
npm run firebase:emulators           # Start Firebase emulators
npm run firebase:emulators:export    # Export emulator data
npm run firebase:emulators:import    # Import emulator data
```

## Need Help?

- 📚 Full documentation: `docs/README.md`
- 🏗️ Architecture: `docs/01-architecture.md`
- 📊 Data model: `docs/02-data-model.md`
- 🔐 Permissions: `docs/03-rbac-permissions.md`
- 📋 Implementation plan: `docs/04-implementation-plan.md`
- ⚙️ Detailed setup: `docs/05-development-setup.md`
- 🔒 Security rules: `docs/06-security-rules.md`
- 💻 Code patterns: `docs/07-code-patterns.md`

## Troubleshooting

### Dependencies taking too long?
The initial install can take 3-5 minutes depending on your connection. If it fails, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port already in use?
Change the port in `vite.config.ts` or `firebase.json`

### Type errors?
Make sure TypeScript is using the workspace version:
```bash
npm run build
```

---

**Ready to proceed?** Let me know if you want to:
1. Wait for installation to finish and test the setup
2. Continue with Phase 2 implementation
3. Set up a real Firebase project first
4. Something else!

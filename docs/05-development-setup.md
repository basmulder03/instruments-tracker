# Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**
- **Code Editor** (VS Code recommended)
- **Firebase Account** (free tier is sufficient)

---

## Step 1: Create Firebase Project

### 1.1 Create Project in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `instruments-tracker` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

### 1.2 Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Choose a location (e.g., `europe-west3`)
5. Click "Enable"

### 1.3 Enable Authentication

1. Go to "Build" → "Authentication"
2. Click "Get started"
3. Click on "Email/Password" provider
4. Enable "Email/Password"
5. Disable "Email link (passwordless sign-in)" for now
6. Click "Save"

### 1.4 Enable Firebase Hosting

1. Go to "Build" → "Hosting"
2. Click "Get started"
3. Follow the setup wizard (we'll configure this later)

### 1.5 Get Firebase Configuration

1. Go to Project Settings (gear icon → Project settings)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Register app with nickname: "instruments-tracker-web"
5. Copy the `firebaseConfig` object - you'll need this later
6. Don't worry about adding Firebase SDK yet (we'll do this in code)

**Example config (save this somewhere safe):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

## Step 2: Install Firebase CLI

### 2.1 Install Globally

```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase

```bash
firebase login
```

This will open a browser window to authenticate with your Google account.

### 2.3 Verify Installation

```bash
firebase --version
# Should output something like: 12.x.x
```

---

## Step 3: Create React + Vite Project

### 3.1 Create Project

```bash
npm create vite@latest instruments-tracker -- --template react-ts
cd instruments-tracker
```

### 3.2 Install Dependencies

```bash
# Install all dependencies at once
npm install

# Firebase
npm install firebase

# TanStack libraries
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/react-form @tanstack/zod-form-adapter

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge

# Routing
npm install react-router-dom

# Forms & Validation
npm install zod

# Permissions (CASL)
npm install @casl/ability @casl/react

# Charts
npm install recharts

# Utilities
npm install date-fns
npm install lucide-react
npm install sonner

# Dev Dependencies
npm install -D @types/node
```

---

## Step 4: Configure Tailwind CSS

### 4.1 Initialize Tailwind

```bash
npx tailwindcss init -p
```

### 4.2 Update `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 4.3 Update `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 174 72% 24%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 174 72% 24%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 174 72% 24%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 174 72% 40%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Step 5: Install shadcn/ui

### 5.1 Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

Answer the prompts:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 5.2 Install Common Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add skeleton
```

---

## Step 6: Configure Path Aliases

### 6.1 Update `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6.2 Update `vite.config.ts`

```typescript
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

---

## Step 7: Initialize Firebase in Project

### 7.1 Run Firebase Init

```bash
firebase init
```

Select:
- `Firestore: Configure security rules and indexes files for Firestore`
- `Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys`
- `Emulators: Set up local emulators for Firebase products`

For each selection:
- **Firestore:**
  - Use default `firebase/firestore.rules`
  - Use default `firebase/firestore.indexes.json`
- **Hosting:**
  - Public directory: `dist`
  - Configure as single-page app: Yes
  - Set up automatic builds with GitHub: No
- **Emulators:**
  - Select: Authentication, Firestore, Hosting
  - Accept default ports (or customize)
  - Download emulators now: Yes

### 7.2 Update `firebase.json`

```json
{
  "firestore": {
    "rules": "firebase/firestore.rules",
    "indexes": "firebase/firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
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

---

## Step 8: Create Project Structure

### 8.1 Create Directories

```bash
mkdir -p src/components/{ui,auth,layout,common}
mkdir -p src/features
mkdir -p src/lib/{types}
mkdir -p src/hooks
mkdir -p src/contexts
mkdir -p src/pages
mkdir -p firebase
```

### 8.2 Create `.env` Files

Create `.env.example`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

Create `.env.local` and fill in your actual Firebase config values.

### 8.3 Update `.gitignore`

```
# Environment variables
.env.local
.env.*.local

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Firebase emulator data
firebase-data/
```

---

## Step 9: Configure Firebase SDK

### 9.1 Create `src/lib/firebase.ts`

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

---

## Step 10: Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "emulators": "firebase emulators:start --import=./firebase-data --export-on-exit",
    "emulators:clean": "firebase emulators:start",
    "deploy": "npm run build && firebase deploy",
    "deploy:hosting": "npm run build && firebase deploy --only hosting"
  }
}
```

---

## Step 11: Create Temporary Firestore Rules

Create `firebase/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporarily allow all reads/writes for development
    // We'll add proper security rules later
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 12: Start Development

### 12.1 Start Firebase Emulators

In one terminal:
```bash
npm run emulators
```

This will start:
- Authentication Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Hosting Emulator: http://localhost:5000
- Emulator UI: http://localhost:4000

### 12.2 Start Vite Dev Server

In another terminal:
```bash
npm run dev
```

This will start the Vite dev server at http://localhost:5173

### 12.3 Open Application

Open http://localhost:5173 in your browser.

---

## Step 13: Verify Setup

### 13.1 Check Firebase Connection

Create a simple test component to verify Firebase is connected:

```typescript
// src/App.tsx
import { db } from './lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

function App() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocs(collection(db, 'test'));
        setConnected(true);
      } catch (error) {
        console.error('Firebase connection error:', error);
      }
    }
    testConnection();
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Instruments Tracker</h1>
      <p className="mt-4">
        Firebase Status: {connected ? '✅ Connected' : '❌ Not Connected'}
      </p>
    </div>
  );
}

export default App;
```

---

## Troubleshooting

### Issue: Emulators won't start

**Solution:** 
- Check if ports are already in use
- Try `npm run emulators:clean` to start fresh
- Check `firebase-debug.log` for errors

### Issue: Firebase connection error in browser

**Solution:**
- Verify `.env.local` has correct Firebase config
- Check browser console for specific errors
- Ensure emulators are running
- Clear browser cache and restart dev server

### Issue: Module path errors

**Solution:**
- Verify `tsconfig.json` and `vite.config.ts` have correct path aliases
- Restart TypeScript server in VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### Issue: Tailwind styles not working

**Solution:**
- Verify `tailwind.config.js` has correct `content` paths
- Check `src/index.css` imports Tailwind directives
- Restart dev server

---

## VS Code Recommended Extensions

Install these extensions for better DX:

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Firebase Explorer
- Error Lens
- Auto Rename Tag
- Path Intellisense

---

## Next Steps

1. Review [Implementation Plan](./04-implementation-plan.md) to start building
2. Reference [Code Patterns](./07-code-patterns.md) for implementation examples
3. Consult [Data Model](./02-data-model.md) when creating Firestore documents
4. Review [RBAC & Permissions](./03-rbac-permissions.md) for authorization logic

---

## Quick Reference

### Start Development
```bash
# Terminal 1: Firebase Emulators
npm run emulators

# Terminal 2: Vite Dev Server
npm run dev
```

### Access Points
- **App:** http://localhost:5173
- **Emulator UI:** http://localhost:4000
- **Firestore Emulator:** http://localhost:8080
- **Auth Emulator:** http://localhost:9099

### Deploy to Production
```bash
npm run deploy
```

### View Firestore Data
Open http://localhost:4000 → Firestore tab

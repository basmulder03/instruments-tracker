# Code Patterns & Examples

## Overview

This document provides code examples and common patterns for implementing features in the Instruments Tracker application. Use these as templates when building new features.

---

## Table of Contents

1. [TanStack Form Patterns](#tanstack-form-patterns)
2. [TanStack Query Patterns](#tanstack-query-patterns)
3. [Permission Checking](#permission-checking)
4. [Firestore Operations](#firestore-operations)
5. [Authentication](#authentication)
6. [ID Generation](#id-generation)
7. [Audit Logging](#audit-logging)
8. [Common Components](#common-components)

---

## TanStack Form Patterns

### Basic Form with Validation

```typescript
// src/features/instruments/components/InstrumentForm.tsx
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const instrumentSchema = z.object({
  naam: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  merk: z.string().optional(),
  serienummer: z.string().optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  purchaseCost: z.number().positive('Cost must be positive'),
  usefulLifeYears: z.number().int().positive('Must be positive integer'),
  salvageValue: z.number().nonnegative('Cannot be negative'),
  currentLocationId: z.string().optional(),
  notes: z.string().optional(),
});

type InstrumentFormData = z.infer<typeof instrumentSchema>;

interface InstrumentFormProps {
  initialValues?: Partial<InstrumentFormData>;
  onSubmit: (data: InstrumentFormData) => Promise<void>;
  onCancel?: () => void;
}

export function InstrumentForm({ initialValues, onSubmit, onCancel }: InstrumentFormProps) {
  const form = useForm({
    defaultValues: {
      naam: initialValues?.naam || '',
      type: initialValues?.type || '',
      merk: initialValues?.merk || '',
      serienummer: initialValues?.serienummer || '',
      purchaseDate: initialValues?.purchaseDate || '',
      purchaseCost: initialValues?.purchaseCost || 0,
      usefulLifeYears: initialValues?.usefulLifeYears || 10,
      salvageValue: initialValues?.salvageValue || 0,
      currentLocationId: initialValues?.currentLocationId || '',
      notes: initialValues?.notes || '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validatorAdapter: zodValidator,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="naam"
        validators={{
          onChange: instrumentSchema.shape.naam,
        }}
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Name *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <p className="text-sm text-destructive mt-1">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      <form.Field
        name="type"
        validators={{
          onChange: instrumentSchema.shape.type,
        }}
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Type *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <p className="text-sm text-destructive mt-1">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      {/* Add more fields similarly */}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
```

---

## TanStack Query Patterns

### Fetching Data

```typescript
// src/features/instruments/hooks/useInstruments.ts
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Instrument } from '@/lib/types/models';

export function useInstruments() {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const q = query(
        collection(db, 'instruments'),
        orderBy('naam', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Instrument[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Creating Data

```typescript
// src/features/instruments/hooks/useCreateInstrument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateNextId } from '@/lib/idGenerator';
import { useAuth } from '@/hooks/useAuth';
import type { Instrument } from '@/lib/types/models';

export function useCreateInstrument() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<Instrument, 'instrumentId' | 'createdAt' | 'updatedAt'>) => {
      const instrumentId = await generateNextId('instruments');
      
      const newInstrument: Instrument = {
        instrumentId,
        ...data,
        currentStatus: 'IN_STORAGE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || '',
      };

      await setDoc(doc(db, 'instruments', instrumentId), newInstrument);
      
      return newInstrument;
    },
    onSuccess: () => {
      // Invalidate and refetch instruments list
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
  });
}
```

### Updating Data

```typescript
// src/features/instruments/hooks/useUpdateInstrument.ts
import { useMutation, useQueryClient } from '@tantml:@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUpdateInstrument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Instrument> }) => {
      await updateDoc(doc(db, 'instruments', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
  });
}
```

---

## Permission Checking

### Using Can Component

```typescript
// src/pages/instruments/InstrumentsPage.tsx
import { Can } from '@/contexts/AbilityContext';
import { Button } from '@/components/ui/button';

export function InstrumentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Instruments</h1>
        
        <Can I="create" a="Instrument">
          <Button onClick={() => setShowAddDialog(true)}>
            Add Instrument
          </Button>
        </Can>
      </div>
      
      <InstrumentsList />
    </div>
  );
}
```

### Using useAbility Hook

```typescript
// src/features/instruments/components/InstrumentCard.tsx
import { useAbility } from '@/hooks/useAbility';
import { Button } from '@/components/ui/button';

export function InstrumentCard({ instrument }: { instrument: Instrument }) {
  const ability = useAbility();
  
  const canEdit = ability.can('update', 'Instrument');
  const canDelete = ability.can('delete', 'Instrument');
  const canCheckout = ability.can('checkout', 'Instrument');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{instrument.naam}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Type: {instrument.type}</p>
        <p>Status: {instrument.currentStatus}</p>
      </CardContent>
      <CardFooter className="gap-2">
        {canCheckout && instrument.currentStatus === 'IN_STORAGE' && (
          <Button onClick={() => handleCheckout(instrument)}>
            Checkout
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" onClick={() => handleEdit(instrument)}>
            Edit
          </Button>
        )}
        {canDelete && (
          <Button variant="destructive" onClick={() => handleDelete(instrument)}>
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

### Protected Route

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAbility } from '@/hooks/useAbility';
import type { Actions, Subjects } from '@/lib/types/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: {
    action: Actions;
    subject: Subjects;
  };
}

export function ProtectedRoute({ children, requirePermission }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const ability = useAbility();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requirePermission && !ability.can(requirePermission.action, requirePermission.subject)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Usage in routes
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requirePermission={{ action: 'read', subject: 'User' }}>
      <UsersPage />
    </ProtectedRoute>
  }
/>
```

---

## Firestore Operations

### Service Layer Pattern

```typescript
// src/features/instruments/services/instrumentService.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateNextId } from '@/lib/idGenerator';
import { auditLog } from '@/lib/auditLogger';
import type { Instrument } from '@/lib/types/models';

export const instrumentService = {
  async getAll(): Promise<Instrument[]> {
    const q = query(collection(db, 'instruments'), orderBy('naam', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Instrument[];
  },

  async getById(id: string): Promise<Instrument | null> {
    const docRef = doc(db, 'instruments', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Instrument) : null;
  },

  async create(data: Omit<Instrument, 'instrumentId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const instrumentId = await generateNextId('instruments');
    
    const newInstrument: Instrument = {
      instrumentId,
      ...data,
      currentStatus: data.currentStatus || 'IN_STORAGE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    };

    await setDoc(doc(db, 'instruments', instrumentId), newInstrument);
    
    await auditLog('CREATE', 'Instrument', instrumentId, JSON.stringify(data), userId);
    
    return instrumentId;
  },

  async update(id: string, data: Partial<Instrument>, userId: string): Promise<void> {
    const before = await this.getById(id);
    
    await updateDoc(doc(db, 'instruments', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    await auditLog('UPDATE', 'Instrument', id, JSON.stringify({ before, after: data }), userId);
  },

  async delete(id: string, userId: string): Promise<void> {
    const instrument = await this.getById(id);
    
    await deleteDoc(doc(db, 'instruments', id));
    
    await auditLog('DELETE', 'Instrument', id, JSON.stringify(instrument), userId);
  },

  async getByStatus(status: string): Promise<Instrument[]> {
    const q = query(
      collection(db, 'instruments'),
      where('currentStatus', '==', status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as Instrument[];
  },
};
```

---

## Authentication

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types/users';

interface AuthContextValue {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      setCurrentUser(userDoc.data() as User);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Login Form

```typescript
// src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Instruments Tracker</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

## ID Generation

```typescript
// src/lib/idGenerator.ts
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

const idFieldMap: Record<string, string> = {
  instruments: 'instrumentId',
  people: 'personId',
  locations: 'locationId',
  movements: 'movementId',
  maintenance: 'maintenanceId',
  usage_events: 'usageId',
  audit_log: 'auditId',
  invitations: 'invitationId',
};

export async function generateNextId(collectionName: string): Promise<string> {
  const prefix = prefixMap[collectionName] || 'GEN';
  const idField = idFieldMap[collectionName] || 'id';
  
  // Query for all IDs with this prefix
  const q = query(
    collection(db, collectionName),
    where(idField, '>=', `${prefix}-0000`),
    where(idField, '<=', `${prefix}-9999`)
  );
  
  const snapshot = await getDocs(q);
  
  // Find max number
  let maxNum = 0;
  snapshot.forEach(doc => {
    const id = doc.data()[idField];
    const match = id.match(/^[A-Z]+-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  
  // Generate next ID
  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
}
```

---

## Audit Logging

```typescript
// src/lib/auditLogger.ts
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { generateNextId } from './idGenerator';

async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getLastAuditHash(): Promise<string> {
  const q = query(
    collection(db, 'audit_log'),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return '';
  
  return snapshot.docs[0].data().rowHash || '';
}

export async function auditLog(
  action: string,
  entityType: string,
  entityId: string,
  details: string,
  userId: string,
  userEmail: string
): Promise<void> {
  const auditId = await generateNextId('audit_log');
  const prevHash = await getLastAuditHash();
  
  const auditEntry = {
    auditId,
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    details,
    prevHash,
    rowHash: '', // Will be computed
  };
  
  // Compute hash
  const canonical = [
    auditEntry.auditId,
    auditEntry.timestamp,
    auditEntry.userId,
    auditEntry.action,
    auditEntry.entityType,
    auditEntry.entityId,
    auditEntry.details,
    auditEntry.prevHash,
  ].join('|');
  
  auditEntry.rowHash = await computeHash(canonical);
  
  await addDoc(collection(db, 'audit_log'), {
    ...auditEntry,
    timestamp: serverTimestamp(),
  });
}
```

---

## Common Components

### Data Table with Sorting

```typescript
// src/components/common/DataTable.tsx
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function DataTable<T extends Record<string, any>>({ data, columns }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>
              {column.sortable ? (
                <Button
                  variant="ghost"
                  onClick={() => handleSort(column.key)}
                  className="flex items-center gap-1"
                >
                  {column.label}
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              ) : (
                column.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.render ? column.render(item) : item[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Complete Feature Example: Checkout Operation

```typescript
// src/features/operations/services/checkoutService.ts
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateNextId } from '@/lib/idGenerator';
import { auditLog } from '@/lib/auditLogger';

interface CheckoutData {
  instrumentId: string;
  personId: string;
  locationId: string;
  notes: string;
}

export async function checkoutInstrument(data: CheckoutData, userId: string, userEmail: string) {
  // 1. Get instrument
  const instrumentRef = doc(db, 'instruments', data.instrumentId);
  const instrumentSnap = await getDoc(instrumentRef);
  
  if (!instrumentSnap.exists()) {
    throw new Error('Instrument not found');
  }
  
  const instrument = instrumentSnap.data();
  
  // 2. Validate status
  if (instrument.currentStatus === 'CHECKED_OUT') {
    throw new Error('Instrument is already checked out');
  }
  
  if (instrument.currentStatus === 'IN_REPAIR') {
    throw new Error('Instrument is in repair');
  }
  
  // 3. Create movement
  const movementId = await generateNextId('movements');
  const movement = {
    movementId,
    instrumentId: data.instrumentId,
    checkoutPersonId: data.personId,
    checkoutLocationId: data.locationId || instrument.currentLocationId,
    checkoutAt: new Date().toISOString(),
    returnLocationId: '',
    returnAt: '',
    status: 'OPEN',
    notes: data.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
  };
  
  await setDoc(doc(db, 'movements', movementId), movement);
  
  // 4. Update instrument
  await updateDoc(instrumentRef, {
    currentStatus: 'CHECKED_OUT',
    currentPersonId: data.personId,
    currentLocationId: data.locationId || instrument.currentLocationId,
    updatedAt: serverTimestamp(),
  });
  
  // 5. Audit log
  await auditLog(
    'CHECKOUT',
    'Instrument',
    data.instrumentId,
    JSON.stringify({ movementId, ...data }),
    userId,
    userEmail
  );
  
  return movementId;
}

// src/features/operations/hooks/useCheckout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { checkoutInstrument } from '../services/checkoutService';
import { toast } from 'sonner';

export function useCheckout() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (data: CheckoutData) =>
      checkoutInstrument(data, currentUser!.uid, currentUser!.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Instrument checked out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// src/features/operations/components/CheckoutDialog.tsx
import { useCheckout } from '../hooks/useCheckout';
import { CheckoutForm } from './CheckoutForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrumentId?: string;
}

export function CheckoutDialog({ open, onOpenChange, instrumentId }: CheckoutDialogProps) {
  const checkoutMutation = useCheckout();

  const handleSubmit = async (data: CheckoutData) => {
    await checkoutMutation.mutateAsync(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout Instrument</DialogTitle>
        </DialogHeader>
        <CheckoutForm
          initialInstrumentId={instrumentId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Next Steps

1. Use these patterns as templates for your features
2. Refer to [Implementation Plan](./04-implementation-plan.md) for building order
3. Consult [Data Model](./02-data-model.md) for field names and types
4. Review [RBAC & Permissions](./03-rbac-permissions.md) for permission checks

---

## Additional Resources

- [TanStack Form Docs](https://tanstack.com/form)
- [TanStack Query Docs](https://tanstack.com/query)
- [CASL Docs](https://casl.js.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

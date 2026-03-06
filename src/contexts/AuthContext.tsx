import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/lib/types/users';
import i18n from '@/i18n';

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** App-level user document from Firestore (null when signed out or loading) */
  currentUser: User | null;
  /** Raw Firebase Auth user (null when signed out or loading) */
  firebaseUser: FirebaseUser | null;
  /** True while the initial auth state is resolving */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setCurrentUser(userData);

          // Sync theme preference from Firestore to localStorage + <html>
          const theme = userData.preferences?.theme;
          if (theme) {
            localStorage.setItem('theme', theme);
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          // Sync language preference from Firestore
          const language = userData.preferences?.language;
          if (language) {
            i18n.changeLanguage(language);
            localStorage.setItem('language', language);
          }

          // Update lastLoginAt on each sign-in
          updateDoc(doc(db, 'users', fbUser.uid), {
            lastLoginAt: serverTimestamp(),
          }).catch(() => {
            // Non-critical — don't block the auth flow
          });
        } else {
          // Auth user exists but no Firestore doc yet (edge case)
          setCurrentUser(null);
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

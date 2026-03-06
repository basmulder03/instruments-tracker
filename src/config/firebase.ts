import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Connect to emulators if in development
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

if (useEmulators) {
  console.log('🔧 Using Firebase Emulators')
  
  // Connect to Auth Emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  
  // Connect to Firestore Emulator
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export default app

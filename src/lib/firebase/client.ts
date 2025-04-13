import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app'; // Use type-only import
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Optional: If using Firestore client-side

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (!firebaseConfigString) {
  throw new Error('Missing Firebase client configuration (NEXT_PUBLIC_FIREBASE_CONFIG)');
}

// Type assertion to satisfy the linter
const firebaseConfig = JSON.parse(firebaseConfigString) as FirebaseOptions;

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const authClient = getAuth(app);
const firestoreClient = getFirestore(app); // Optional: If using Firestore client-side

export { app, authClient, firestoreClient }; 
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // If used

// Ensure you have the following environment variables set in your .env file:
// FIREBASE_PROJECT_ID
// FIREBASE_CLIENT_EMAIL
// FIREBASE_PRIVATE_KEY (replace \\n with actual newlines)

// Check for environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Use optional chaining

let initialized = false;
if (projectId && clientEmail && privateKey) {
  const serviceAccount: admin.ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin SDK Initialized');
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      // Prevent further execution if initialization fails
      initialized = false; 
    }
  } else {
    initialized = true; // Already initialized
  }
} else {
  console.warn('Firebase Admin SDK environment variables not set. Skipping initialization.');
}

// Export auth and firestore instances conditionally
export const authAdmin = initialized ? getAuth() : null;
export const firestoreAdmin = initialized ? getFirestore() : null; // If used

/**
 * Verifies the Firebase ID token.
 * If the token is valid, returns the decoded token.
 * Otherwise, returns null.
 */
export async function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!token || !authAdmin) { // Check if authAdmin is initialized
    if (!authAdmin) console.error("authAdmin not initialized in verifyFirebaseToken");
    return null;
  }
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}

/**
 * Gets user data from Firebase Auth using UID.
 */
export async function getUser(uid: string): Promise<admin.auth.UserRecord | null> {
  if (!authAdmin) { // Check if authAdmin is initialized
    console.error("authAdmin not initialized in getUser");
    return null;
  }
  try {
    const userRecord = await authAdmin.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
} 
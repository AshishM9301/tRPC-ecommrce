'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // Type-only import
import {
  getAuth, // Keep this import
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import type { User, IdTokenResult, AuthError } from 'firebase/auth'; // Type-only imports
import { authClient } from '../lib/firebase/client'; // Corrected relative path

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  getToken: () => Promise<string | null>; // Consider renaming if IdTokenResult was needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to set auth token cookie
async function setAuthTokenCookie(user: User | null) {
  if (user) {
    const token = await user.getIdToken();
    // Set cookie accessible by server (HTTPOnly for security)
    document.cookie = `firebaseIdToken=${token}; path=/; SameSite=Lax; Secure`; // Add Secure in production
  } else {
    // Remove cookie on sign out
    document.cookie = 'firebaseIdToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authClient, (user) => {
      // Handle async logic inside the callback using void
      void (async () => {
        setUser(user);
        await setAuthTokenCookie(user); // Set/remove cookie on auth state change
        setLoading(false);
      })();
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Helper function to handle Firebase errors
  const handleAuthError = (err: unknown, defaultMessage: string) => {
    console.error("Auth error:", err);
    if (err instanceof Error) {
      // Check if it's a Firebase AuthError for more specific codes if needed
      if ('code' in err) { // Basic check for AuthError properties
        setError((err as AuthError).message || defaultMessage);
      } else {
        setError(err.message || defaultMessage);
      }
    } else {
      setError(defaultMessage);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(authClient, email, password);
    } catch (err) {
      handleAuthError(err, 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(authClient, email, password);
    } catch (err) {
      handleAuthError(err, 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(authClient);
    } catch (err) {
      handleAuthError(err, 'Failed to sign out');
    } finally {
      // setLoading(false); // Listener handles this
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken(true); // Force refresh if needed
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      // Potentially sign out user if token refresh fails
      // await signOutUser();
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    getToken,
  };

  // Render children only after initial loading is complete
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
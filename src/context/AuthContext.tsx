'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth, DEFAULT_FIREBASE_CONFIG } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch current session on initial load
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Session check failed', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with secure server-side API (verified with hashed credentials)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Invalid email or password.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      setUser(data.user);

      // 2. Synchronize with Firebase Auth if configured with a real production key
      try {
        const auth = getFirebaseAuth();
        const isRealKey = DEFAULT_FIREBASE_CONFIG.apiKey && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Dummy') && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Development');
        if (auth && isRealKey) {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        }
      } catch {
        // Non-fatal if Firebase Auth console is not enabled
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please verify your connection.';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // Sign up handler
  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create account via secure server-side API with password hashing and session cookie
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Failed to create account.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      setUser(data.user);

      // 2. Also register in Firebase Auth if available with real key
      try {
        const auth = getFirebaseAuth();
        const isRealKey = DEFAULT_FIREBASE_CONFIG.apiKey && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Dummy') && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Development');
        if (auth && isRealKey) {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (name.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
          }
        }
      } catch {
        // Non-fatal if Firebase Auth console is not enabled
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Sign up failed. Please check your connection.';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });

      const auth = getFirebaseAuth();
      if (auth) {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
      }

      setUser(null);
      window.location.href = '/login?redirect=/';
    } catch {
      window.location.href = '/login?redirect=/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

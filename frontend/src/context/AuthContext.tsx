import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { apiFetch, setAccessToken } from '../services/api';
import { auth as firebaseAuth, firestore, isFirebaseConfigured } from '../lib/firebase';

export type CivicRole = 'citizen' | 'admin' | 'authority';

export interface CivicProfile {
  uid: string;
  phone: string | null;
  role: CivicRole;
  district: string | null;
  reportsCount: number;
  verifiedCount: number;
  email?: string;
  full_name?: string;
  city?: string;
  cnic?: string | null;
}

export interface UserSession {
  uid: string;
  email: string;
  role: CivicRole;
  full_name: string;
}

interface AuthContextValue {
  user: UserSession | null;
  profile: CivicProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: { full_name: string; phone: string; city: string; cnic: string }) => Promise<any>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function signInFirebaseIfConfigured(email: string, password: string) {
  if (!isFirebaseConfigured) return null;
  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return result.user;
  } catch (err: any) {
    console.warn('Firebase sign-in failed. Firestore features need matching Firebase Auth credentials.', err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
      try {
        console.log('Firebase user not found, attempting auto-registration in Firebase Auth...');
        const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        return result.user;
      } catch (regErr) {
        console.warn('Auto-registration in Firebase failed:', regErr);
      }
    }
    return null;
  }
}

async function registerFirebaseIfConfigured(email: string, password: string) {
  if (!isFirebaseConfigured) return null;
  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    return result.user;
  } catch (err: any) {
    console.warn('Firebase registration failed. The backend account was created, but Firestore features need Firebase Auth.', err);
    if (err.code === 'auth/email-already-in-use') {
      try {
        console.log('Firebase user already exists, attempting auto-sign-in...');
        const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return result.user;
      } catch (signInErr) {
        console.warn('Fallback auto-sign-in in Firebase failed:', signInErr);
      }
    }
    return null;
  }
}

async function syncFirebaseUserProfile(uid: string, apiUser: any) {
  if (!isFirebaseConfigured || !firebaseAuth.currentUser) return;
  await setDoc(
    doc(firestore, 'users', uid),
    {
      uid,
      email: apiUser.email,
      role: apiUser.role,
      phone: apiUser.phone ?? null,
      city: apiUser.city ?? null,
      full_name: apiUser.full_name ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((err) => console.warn('Unable to sync Firebase user profile:', err));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<CivicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load user profile if accessToken exists
  const loadUserSession = async (firebaseUser?: any) => {
    try {
      const response = await apiFetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user;
        
        const fbUser = firebaseUser !== undefined ? firebaseUser : (isFirebaseConfigured ? firebaseAuth.currentUser : null);
        const firebaseUid = fbUser?.uid;
        const apiUid = String(apiUser.id);
        
        const session: UserSession = {
          uid: apiUid,
          email: apiUser.email,
          role: apiUser.role as CivicRole,
          full_name: apiUser.full_name
        };

        const civProfile: CivicProfile = {
          uid: apiUid,
          phone: apiUser.phone,
          role: apiUser.role as CivicRole,
          district: apiUser.city, // Mapping city to district
          reportsCount: 0, // Mocked or fetched from backend in future
          verifiedCount: apiUser.is_verified ? 1 : 0,
          email: apiUser.email,
          full_name: apiUser.full_name,
          city: apiUser.city,
          cnic: apiUser.cnic
        };

        setUser(session);
        setProfile(civProfile);
        if (firebaseUid) {
          await syncFirebaseUserProfile(firebaseUid, apiUser);
        }
      } else {
        // Clear session if fetch me fails
        setUser(null);
        setProfile(null);
        setAccessToken(null);
      }
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadUserSession();
      return;
    }

    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      loadUserSession(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const loginAction = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed / لاگ ان ناکام رہا');
      }

      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      const firebaseUser = await signInFirebaseIfConfigured(email, password);
      
      const apiUser = data.user;
      const apiUid = String(apiUser.id);
      const firebaseUid = firebaseUser?.uid;
      const session: UserSession = {
        uid: apiUid,
        email: apiUser.email,
        role: apiUser.role as CivicRole,
        full_name: apiUser.full_name
      };

      const civProfile: CivicProfile = {
        uid: apiUid,
        phone: apiUser.phone,
        role: apiUser.role as CivicRole,
        district: apiUser.city,
        reportsCount: 0,
        verifiedCount: apiUser.is_verified ? 1 : 0,
        email: apiUser.email,
        full_name: apiUser.full_name,
        city: apiUser.city,
        cnic: apiUser.cnic
      };

      setUser(session);
      setProfile(civProfile);
      if (firebaseUid) {
        await syncFirebaseUserProfile(firebaseUid, apiUser);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerAction = async (userData: any) => {
    setLoading(true);
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed / رجسٹریشن ناکام رہی');
      }

      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      const firebaseUser = await registerFirebaseIfConfigured(userData.email, userData.password);

      const apiUser = data.user;
      const apiUid = String(apiUser.id);
      const firebaseUid = firebaseUser?.uid;
      const session: UserSession = {
        uid: apiUid,
        email: apiUser.email,
        role: apiUser.role as CivicRole,
        full_name: apiUser.full_name
      };

      const civProfile: CivicProfile = {
        uid: apiUid,
        phone: apiUser.phone,
        role: apiUser.role as CivicRole,
        district: apiUser.city,
        reportsCount: 0,
        verifiedCount: apiUser.is_verified ? 1 : 0,
        email: apiUser.email,
        full_name: apiUser.full_name,
        city: apiUser.city,
        cnic: apiUser.cnic
      };

      setUser(session);
      setProfile(civProfile);
      if (firebaseUid) {
        await syncFirebaseUserProfile(firebaseUid, apiUser);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOutAction = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      if (isFirebaseConfigured) {
        await firebaseSignOut(firebaseAuth).catch((err) => console.error('Firebase logout error:', err));
      }
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfileAction = async (profileData: { full_name: string; phone: string; city: string; cnic: string }) => {
    const response = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile / پروفائل تبدیل کرنے میں ناکامی');
    }

    const apiUser = data.profile;
    const apiUid = String(apiUser.id);
    const session: UserSession = {
      uid: apiUid,
      email: apiUser.email,
      role: apiUser.role as CivicRole,
      full_name: apiUser.full_name
    };

    const civProfile: CivicProfile = {
      uid: apiUid,
      phone: apiUser.phone,
      role: apiUser.role as CivicRole,
      district: apiUser.city,
      reportsCount: profile?.reportsCount ?? 0,
      verifiedCount: apiUser.is_verified ? 1 : 0,
      email: apiUser.email,
      full_name: apiUser.full_name,
      city: apiUser.city,
      cnic: apiUser.cnic
    };

    setUser(session);
    setProfile(civProfile);
    return data;
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    login: loginAction,
    register: registerAction,
    signOut: signOutAction,
    updateProfile: updateProfileAction,
    isAdmin: profile?.role === 'admin' || profile?.role === 'authority',
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

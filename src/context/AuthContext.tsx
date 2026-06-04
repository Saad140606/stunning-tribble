import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';

export type CivicRole = 'citizen' | 'admin' | 'authority';

interface CivicProfile {
  uid: string;
  phone: string | null;
  role: CivicRole;
  district: string | null;
  reportsCount: number;
  verifiedCount: number;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: CivicProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<CivicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const ref = doc(firestore, 'users', firebaseUser.uid);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        const newProfile = {
          phone: firebaseUser.phoneNumber,
          role: 'citizen',
          district: null,
          reportsCount: 0,
          verifiedCount: 0,
          todayReportCount: 0,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        };
        await setDoc(ref, newProfile);
        setProfile({ uid: firebaseUser.uid, ...newProfile, role: 'citizen' });
      } else {
        const data = snapshot.data();
        await setDoc(ref, { lastActive: serverTimestamp() }, { merge: true });
        setProfile({
          uid: firebaseUser.uid,
          phone: data.phone ?? firebaseUser.phoneNumber,
          role: (data.role ?? 'citizen') as CivicRole,
          district: data.district ?? null,
          reportsCount: data.reportsCount ?? 0,
          verifiedCount: data.verifiedCount ?? 0,
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'authority',
    signOut: () => firebaseSignOut(auth),
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


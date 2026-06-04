import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, setAccessToken } from '../services/api';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<CivicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load user profile if accessToken exists
  const loadUserSession = async () => {
    try {
      const response = await apiFetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user;
        
        const session: UserSession = {
          uid: String(apiUser.id),
          email: apiUser.email,
          role: apiUser.role as CivicRole,
          full_name: apiUser.full_name
        };

        const civProfile: CivicProfile = {
          uid: String(apiUser.id),
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
    loadUserSession();
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
      
      const apiUser = data.user;
      const session: UserSession = {
        uid: String(apiUser.id),
        email: apiUser.email,
        role: apiUser.role as CivicRole,
        full_name: apiUser.full_name
      };

      const civProfile: CivicProfile = {
        uid: String(apiUser.id),
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

      const apiUser = data.user;
      const session: UserSession = {
        uid: String(apiUser.id),
        email: apiUser.email,
        role: apiUser.role as CivicRole,
        full_name: apiUser.full_name
      };

      const civProfile: CivicProfile = {
        uid: String(apiUser.id),
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
    const session: UserSession = {
      uid: String(apiUser.id),
      email: apiUser.email,
      role: apiUser.role as CivicRole,
      full_name: apiUser.full_name
    };

    const civProfile: CivicProfile = {
      uid: String(apiUser.id),
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

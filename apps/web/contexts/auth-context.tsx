'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'TENANT_OWNER'
  | 'GROOMER'
  | 'VETERINARIAN'
  | 'RECEPTIONIST'
  | 'SAAS_ADMIN';

export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  branchId: string;
  branchName: string;
  avatarText?: string;
  avatarGradient?: string;
}

export const PRESET_USERS: Record<string, AuthUserProfile> = {
  owner: {
    id: 'u-owner-01',
    email: 'owner@demopetcare.com',
    name: 'สมชาย รักสัตว์',
    role: 'TENANT_OWNER',
    roleTitle: 'เจ้าของร้าน (Owner)',
    branchId: 'MAIN',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'ส',
    avatarGradient: 'from-blue-500 to-[#0071e3]',
  },
  admin: {
    id: 'u-admin-01',
    email: 'admin@petflow.co',
    name: 'PetFlow Super Admin (DEV)',
    role: 'SAAS_ADMIN',
    roleTitle: 'Super Admin (DEV Platform HQ)',
    branchId: 'HQ',
    branchName: 'SaaS Headquarter',
    avatarText: '👑',
    avatarGradient: 'from-violet-600 to-purple-800',
  },
  groomer: {
    id: 'u-groomer-01',
    email: 'groomer@demopetcare.com',
    name: 'ช่างเอก สกิลทอง',
    role: 'GROOMER',
    roleTitle: 'ช่างกรูมมิ่ง (Groomer)',
    branchId: 'MAIN',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'อ',
    avatarGradient: 'from-teal-500 to-emerald-600',
  },
  vet: {
    id: 'u-vet-01',
    email: 'vet@demopetcare.com',
    name: 'หมอน้ำใส สัตวแพทย์',
    role: 'VETERINARIAN',
    roleTitle: 'สัตวแพทย์ (Doctor OPD)',
    branchId: 'MAIN',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'น',
    avatarGradient: 'from-purple-500 to-pink-600',
  },
};

interface AuthContextType {
  user: AuthUserProfile;
  setUser: (user: AuthUserProfile) => void;
  loginAs: (roleId: string, branchId?: string) => AuthUserProfile;
  logout: () => void;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'petflow_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUserProfile>(PRESET_USERS.owner);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setUserState(parsed);
        }
      }
    } catch {
      // fallback to default
    }
    setIsLoaded(true);
  }, []);

  const setUser = (newUser: AuthUserProfile) => {
    setUserState(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const loginAs = (roleId: string, branchId = 'MAIN') => {
    const template = PRESET_USERS[roleId] || PRESET_USERS.owner;
    const branchNames: Record<string, string> = {
      MAIN: 'สาขาทองหล่อ (Main)',
      BRANCH_2: 'สาขาอารีย์ (Ari Express)',
      BRANCH_3: 'สาขาเอกมัย (Ekkamai Grooming)',
      HQ: 'SaaS Headquarter',
    };

    const newUser: AuthUserProfile = {
      ...template,
      branchId,
      branchName: branchNames[branchId] || 'สาขาทองหล่อ (Main)',
    };

    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(PRESET_USERS.owner);
  };

  const isRole = (...roles: UserRole[]) => {
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loginAs,
        logout,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

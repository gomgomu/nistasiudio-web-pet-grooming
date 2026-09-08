'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SAAS_ADMIN'
  | 'TENANT_OWNER'
  | 'TENANT_ADMIN'
  | 'BRANCH_MANAGER'
  | 'VETERINARIAN'
  | 'GROOMER'
  | 'RECEPTIONIST'
  | 'STAFF';

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
  accessToken?: string;
  refreshToken?: string;
  allowedBranches?: { id: string; name: string; code: string }[];
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
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Admin (DEV Platform HQ)',
    branchId: 'HQ',
    branchName: 'SaaS Headquarter',
    avatarText: 'AD',
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
  receptionist: {
    id: 'u-reception-01',
    email: 'receptionist@demopetcare.com',
    name: 'ขวัญใจ บริการดี',
    role: 'RECEPTIONIST',
    roleTitle: 'พนักงานต้อนรับ & แคชเชียร์ (Receptionist)',
    branchId: 'MAIN',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'ข',
    avatarGradient: 'from-amber-500 to-orange-600',
  },
};

interface AuthContextType {
  user: AuthUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUserProfile | null) => void;
  loginAs: (roleId: string, branchId?: string) => AuthUserProfile;
  loginWithCredentials: (
    email: string,
    password: string,
    tenantSlug?: string
  ) => Promise<{ success: boolean; message?: string; user?: AuthUserProfile }>;
  logout: () => void;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'petflow_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUserProfile | null>(null);
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
      // fallback to null
    }
    setIsLoaded(true);
  }, []);

  const setUser = (newUser: AuthUserProfile | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
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

  const loginWithCredentials = async (
    email: string,
    password: string,
    tenantSlug = 'demo-pet-clinic'
  ): Promise<{ success: boolean; message?: string; user?: AuthUserProfile }> => {
    const targetSlug = email.trim().toLowerCase().includes('@petflow.co')
      ? 'petflow-hq'
      : tenantSlug;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          tenantSlug: targetSlug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const authUser = data.user;
        const tokens = data.tokens;

        const roleTitles: Record<string, string> = {
          SUPER_ADMIN: 'Super Admin (DEV Platform HQ)',
          TENANT_OWNER: 'เจ้าของร้าน (Owner)',
          TENANT_ADMIN: 'ผู้จัดการระบบร้าน (Admin)',
          BRANCH_MANAGER: 'ผู้จัดการสาขา',
          VETERINARIAN: 'สัตวแพทย์ (Doctor OPD)',
          GROOMER: 'ช่างกรูมมิ่ง (Groomer)',
          RECEPTIONIST: 'พนักงานต้อนรับ & แคชเชียร์',
          STAFF: 'พนักงานทั่วไป',
        };

        const primaryBranch = authUser.allowedBranches?.[0];
        const fullName = `${authUser.firstName} ${authUser.lastName}`.trim();

        const profile: AuthUserProfile = {
          id: authUser.id,
          email: authUser.email,
          name: fullName || authUser.email.split('@')[0],
          role: authUser.role,
          roleTitle: roleTitles[authUser.role] || authUser.role,
          branchId: primaryBranch?.id || 'MAIN',
          branchName: primaryBranch?.name || 'สาขาทองหล่อ (Main)',
          avatarText: (fullName || authUser.email).charAt(0).toUpperCase(),
          accessToken: tokens?.accessToken,
          refreshToken: tokens?.refreshToken,
          allowedBranches: authUser.allowedBranches,
        };

        setUser(profile);
        return { success: true, user: profile };
      }
    } catch {
      // Backend not running on localhost:3001 or network error -> check demo credentials
    }

    // Fallback authentication for offline demo presets
    const matchedPresetKey = Object.keys(PRESET_USERS).find(
      (k) => PRESET_USERS[k].email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedPresetKey) {
      if (password !== 'password123') {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง (รหัสผ่านเดโมคือ password123)' };
      }
      const loggedUser = loginAs(
        matchedPresetKey,
        matchedPresetKey === 'admin' ? 'HQ' : 'MAIN'
      );
      return { success: true, user: loggedUser };
    }

    return {
      success: false,
      message: 'ไม่พบผู้ใช้นี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
    };
  };

  const logout = () => {
    setUser(null);
  };

  const isRole = (...roles: UserRole[]) => {
    if (!user) return false;
    // Map SAAS_ADMIN and SUPER_ADMIN interchangeably for UI checks
    const current = user.role === 'SAAS_ADMIN' ? 'SUPER_ADMIN' : user.role;
    const normalizedRoles = roles.map((r) => (r === 'SAAS_ADMIN' ? 'SUPER_ADMIN' : r));
    return normalizedRoles.includes(current as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading: !isLoaded,
        setUser,
        loginAs,
        loginWithCredentials,
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

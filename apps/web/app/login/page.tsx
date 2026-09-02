'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Sparkles,
  CheckCircle2,
  Mail,
  Lock,
  Scissors,
  Stethoscope,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button } from '@petflow/ui';
import { useAuth } from '../../contexts/auth-context';

interface DemoRoleOption {
  id: string;
  title: string;
  subtitle: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  roleCode: string;
  colorClass: string;
  badgeText: string;
  targetUrl: string;
}

const DEMO_ROLES: DemoRoleOption[] = [
  {
    id: 'owner',
    title: 'เจ้าของร้าน',
    subtitle: 'สมชาย รักสัตว์ (Owner)',
    email: 'owner@demopetcare.com',
    icon: Crown,
    roleCode: 'TENANT_OWNER',
    colorClass: 'from-blue-600 to-indigo-700',
    badgeText: 'Dashboard, POS, จัดการร้าน',
    targetUrl: '/',
  },
  {
    id: 'admin',
    title: 'Super Admin (DEV)',
    subtitle: 'PetFlow Platform HQ',
    email: 'admin@petflow.co',
    icon: Shield,
    roleCode: 'SAAS_ADMIN',
    colorClass: 'from-violet-600 to-purple-800',
    badgeText: 'ดูแลทุกร้าน, จัดการระบบกลาง',
    targetUrl: '/admin',
  },
  {
    id: 'groomer',
    title: 'ช่างกรูมมิ่ง',
    subtitle: 'ช่างเอก (Groomer)',
    email: 'groomer@demopetcare.com',
    icon: Scissors,
    roleCode: 'GROOMER',
    colorClass: 'from-teal-600 to-emerald-700',
    badgeText: 'คิวกรูมมิ่ง, อัปเดตงานตัดขน',
    targetUrl: '/grooming/queue',
  },
  {
    id: 'vet',
    title: 'สัตวแพทย์',
    subtitle: 'หมอน้ำใส (Doctor OPD)',
    email: 'vet@demopetcare.com',
    icon: Stethoscope,
    roleCode: 'VETERINARIAN',
    colorClass: 'from-purple-600 to-pink-700',
    badgeText: 'ตรวจรักษา OPD, ประวัติวัคซีน',
    targetUrl: '/clinical',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, setUser } = useAuth();

  const [email, setEmail] = useState('owner@demopetcare.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('owner');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectRole = (role: DemoRoleOption) => {
    setActiveRole(role.id);
    setEmail(role.email);
    setPassword('password123');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Check if email matches a preset role
    const matchedPreset = DEMO_ROLES.find(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase()
    );

    let loggedInName = '';
    let targetUrl = '/';

    if (matchedPreset) {
      const loggedUser = loginAs(matchedPreset.id, matchedPreset.id === 'admin' ? 'HQ' : 'MAIN');
      loggedInName = `${loggedUser.name} (${loggedUser.roleTitle})`;
      targetUrl = matchedPreset.targetUrl;
    } else {
      // Custom user / newly created store owner
      const emailPrefix = email.split('@')[0];
      const customUser = {
        id: `u-${Date.now()}`,
        email: email.trim(),
        name: `คุณ ${emailPrefix}`,
        role: 'TENANT_OWNER' as const,
        roleTitle: 'เจ้าของร้าน (Owner)',
        branchId: 'MAIN',
        branchName: 'สาขาหลัก (Main Branch)',
        avatarText: emailPrefix.charAt(0).toUpperCase(),
        avatarGradient: 'from-blue-600 to-indigo-700',
      };
      setUser(customUser);
      loggedInName = `${customUser.name} (เจ้าของร้าน)`;
      targetUrl = '/';
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`ยินดีต้อนรับ ${loggedInName} เข้าสู่ระบบ`);

      setTimeout(() => {
        router.push(targetUrl);
      }, 600);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a1128] to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white shadow-xl shadow-blue-500/30 mb-1">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              PetFlow
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              OS v1.0
            </span>
          </div>
          <p className="text-sm text-slate-400">
            ระบบบริหารจัดการคลินิกและร้านกรูมมิ่งสัตว์เลี้ยงครบวงจร
          </p>
        </div>

        {/* Quick Demo Role Switcher Selector */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              เลือกล็อกอินตามบทบาท (1-Click Demo Login):
            </span>
            <Badge variant="default" className="text-[10px] bg-blue-500/20 text-blue-300">
              4 บทบาทหลัก
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {DEMO_ROLES.map((role) => {
              const isSelected = activeRole === role.id && email === role.email;
              const IconComp = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-[#0071e3] ring-2 ring-[#0071e3]/40 shadow-lg'
                      : 'bg-slate-900/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-7 h-7 rounded-xl bg-gradient-to-br ${role.colorClass} flex items-center justify-center text-white text-xs shadow-sm`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#0071e3]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white leading-tight">
                      {role.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate">
                      {role.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          {successMessage ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage} (กำลังนำเข้าสู่ระบบ...)</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0071e3]" />
                อีเมลผู้ใช้งาน (Email):
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@petcare.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden transition font-medium"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0071e3]" />
                  รหัสผ่าน (Password):
                </label>
                <a href="#forgot" className="text-[11px] font-semibold text-[#0071e3] hover:underline">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden transition font-mono"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] border-slate-300"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                จดจำการเข้าสู่ระบบในอุปกรณ์นี้ (30 วัน)
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบสิทธิ์...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Guarantee */}
          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>ระบบปลอดภัยด้วย Argon2 + JWT & Multi-Tenant Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

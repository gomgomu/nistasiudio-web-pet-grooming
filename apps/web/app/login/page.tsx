'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  Scissors,
  Stethoscope,
  CreditCard,
  Crown,
} from 'lucide-react';
import { Button, Badge } from '@petflow/ui';
import { useAuth } from '../../contexts/auth-context';

interface DemoRoleOption {
  id: string;
  roleTitle: string;
  name: string;
  email: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  targetUrl: string;
}

const DEMO_ROLES: DemoRoleOption[] = [
  {
    id: 'owner',
    roleTitle: 'เจ้าของร้าน (Owner)',
    name: 'สมชาย รักสัตว์',
    email: 'owner@demopetcare.com',
    icon: <Crown className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    badge: 'Executive',
    targetUrl: '/',
  },
  {
    id: 'groomer',
    roleTitle: 'ช่างกรูมมิ่ง (Groomer)',
    name: 'ช่างเอก สกิลทอง',
    email: 'groomer@demopetcare.com',
    icon: <Scissors className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white',
    badge: 'Queue Staff',
    targetUrl: '/grooming/queue',
  },
  {
    id: 'vet',
    roleTitle: 'สัตวแพทย์ (Veterinarian)',
    name: 'หมอน้ำใส สัตวแพทย์',
    email: 'vet@demopetcare.com',
    icon: <Stethoscope className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    badge: 'Doctor OPD',
    targetUrl: '/clinical',
  },
  {
    id: 'cashier',
    roleTitle: 'แคชเชียร์ / ต้อนรับ (Receptionist)',
    name: 'น้องแพรว แคชเชียร์',
    email: 'cashier@demopetcare.com',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    badge: 'POS & Front',
    targetUrl: '/pos',
  },
  {
    id: 'admin',
    roleTitle: 'SaaS Platform Admin',
    name: 'PetFlow Super Admin',
    email: 'admin@petflow.co',
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white',
    badge: 'HQ Admin',
    targetUrl: '/admin',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAuth();
  const [email, setEmail] = useState('owner@demopetcare.com');
  const [password, setPassword] = useState('password123');
  const [selectedBranch, setSelectedBranch] = useState('MAIN');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('owner');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectRole = (role: DemoRoleOption) => {
    setActiveRole(role.id);
    setEmail(role.email);
    setPassword('petflow2026!');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loggedUser = loginAs(activeRole, selectedBranch);
    const targetRole = DEMO_ROLES.find((r) => r.id === activeRole) || DEMO_ROLES[0];

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`ยินดีต้อนรับ ${loggedUser.name} (${loggedUser.roleTitle}) เข้าสู่ระบบ`);

      setTimeout(() => {
        router.push(targetRole.targetUrl);
      }, 700);
    }, 500);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white shadow-xl shadow-blue-500/30 text-2xl font-bold mb-1">
            🐾
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
              ทดสอบด่วน
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ROLES.map((role) => {
              const isSelected = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.02]'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isSelected ? role.color : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {role.icon}
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {role.roleTitle.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{role.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
          {successMessage ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage} (กำลังนำเข้าสู่ระบบ...)</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Branch Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0071e3]" />
                เลือกสาขา (Branch):
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden transition"
              >
                <option value="MAIN">🏢 สาขาทองหล่อ (Main Headquarter)</option>
                <option value="BRANCH_2">📍 สาขาอารีย์ (Ari Express)</option>
                <option value="BRANCH_3">📍 สาขาเอกมัย (Ekkamai Grooming)</option>
              </select>
            </div>

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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden transition"
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
                className="w-4 h-4 rounded text-[#0071e3] border-slate-300 focus:ring-[#0071e3]"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                จดจำการเข้าสู่ระบบในอุปกรณ์นี้ (30 วัน)
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0071e3] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบข้อมูล...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Footer Notice */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ระบบปลอดภัยด้วย Argon2 + JWT & Multi-Tenant Isolation</span>
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="text-center text-xs text-slate-400">
          © 2026 PetFlow Inc. Thai Pet Business Operating System
        </p>
      </div>
    </div>
  );
}

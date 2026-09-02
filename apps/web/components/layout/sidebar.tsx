'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@petflow/ui';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Briefcase,
  CreditCard,
  Package,
  BellRing,
  BarChart3,
  Settings,
  ChevronRight,
  Sparkles,
  UserCheck,
  Stethoscope,
  Zap,
  Shield,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/auth-context';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles?: UserRole[];
}

const navItems: NavItem[] = [
  { title: 'ภาพรวมระบบ', href: '/', icon: LayoutDashboard, allowedRoles: ['TENANT_OWNER'] },
  { title: 'นัดหมาย & ปฏิทิน', href: '/appointments', icon: Calendar, badge: '8', allowedRoles: ['TENANT_OWNER', 'GROOMER', 'VETERINARIAN'] },
  { title: 'คิวกรูมมิ่ง (Queue)', href: '/grooming/queue', icon: Scissors, badge: '5', allowedRoles: ['TENANT_OWNER', 'GROOMER'] },
  { title: 'ตรวจรักษา (Clinical)', href: '/clinical', icon: Stethoscope, badge: 'OPD', allowedRoles: ['TENANT_OWNER', 'VETERINARIAN'] },
  { title: 'ลูกค้า & สัตว์เลี้ยง', href: '/customers', icon: Users, allowedRoles: ['TENANT_OWNER', 'GROOMER', 'VETERINARIAN'] },
  { title: 'การรักษาลูกค้า (Retention)', href: '/retention', icon: UserCheck, badge: 'RFM', allowedRoles: ['TENANT_OWNER', 'VETERINARIAN'] },
  { title: 'จุดขายหน้าร้าน (POS)', href: '/pos', icon: CreditCard, allowedRoles: ['TENANT_OWNER'] },
  { title: 'คลังสินค้า (Stock)', href: '/inventory', icon: Package, allowedRoles: ['TENANT_OWNER', 'VETERINARIAN'] },
  { title: 'รายงาน & วิเคราะห์', href: '/reports', icon: BarChart3, allowedRoles: ['TENANT_OWNER'] },
  { title: 'แพ็กเกจ & บิล (SaaS)', href: '/settings/subscription', icon: Zap, badge: 'Pro', allowedRoles: ['TENANT_OWNER'] },
  { title: 'SaaS Admin Hub', href: '/admin', icon: Shield, badge: 'HQ', allowedRoles: ['SAAS_ADMIN'] },
  { title: 'Feature Flags Hub', href: '/admin/feature-flags', icon: Sliders, badge: 'Control', allowedRoles: ['SAAS_ADMIN'] },
  { title: 'ตั้งค่าระบบ', href: '/settings', icon: Settings, allowedRoles: ['TENANT_OWNER'] },
];

export function Sidebar({
  className,
  isMobileOpen = false,
  onCloseMobile,
}: {
  className?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const currentRole = user?.role || 'TENANT_OWNER';
  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(currentRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden transition-opacity cursor-pointer"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <Link href="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  PetFlow
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0071e3] dark:bg-blue-950/60 dark:text-blue-400">
                  OS
                </span>
              </div>
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Thai Pet Business Suite
              </span>
            </div>
          </Link>

          {/* Close button on mobile/iPad */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            เมนูหลัก ({user?.roleTitle ? user.roleTitle.split(' ')[0] : 'ระบบ'})
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-600/25 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 active:scale-[0.99]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-blue-50 text-[#0071e3] dark:bg-blue-950/60 dark:text-blue-400'
                    )}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                  )
                )}
              </Link>
            );
          })}
        </div>

        {/* Tenant/Branch Badge & Subscription Footer */}
        <div className="p-3.5 border-t border-slate-200/60 dark:border-slate-800/60">
          {user?.role === 'SAAS_ADMIN' ? (
            <Link
              href="/admin"
              className="block rounded-2xl bg-gradient-to-br from-violet-950/40 to-purple-900/30 p-3 dark:bg-slate-800/70 border border-violet-500/30 hover:border-violet-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
                    SaaS Platform HQ
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-violet-700 dark:text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded-md">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {user?.name || 'Super Admin'}
              </p>
            </Link>
          ) : (
            <Link
              href="/settings/subscription"
              title="คลิกเพื่อดูรายละเอียดแพ็กเกจและการต่ออายุ"
              className="block rounded-2xl bg-slate-50/90 p-3 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 transition-all hover:bg-blue-50/60 hover:border-blue-300 hover:shadow-xs group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                    {user?.branchName || 'สาขาทองหล่อ'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 group-hover:bg-[#0071e3] group-hover:text-white transition">
                  <Sparkles className="h-2.5 w-2.5" />
                  Pro Plan
                </span>
              </div>

              {/* Package Expiry Countdown - Compact */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  ⏳ สถานะแพ็กเกจ:
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[10px] border border-emerald-500/20">
                  เหลืออีก 31 วัน
                </span>
              </div>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

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
  { title: 'ภาพรวมระบบ', href: '/', icon: LayoutDashboard },
  { title: 'นัดหมาย & ปฏิทิน', href: '/appointments', icon: Calendar, badge: '8', allowedRoles: ['TENANT_OWNER', 'GROOMER', 'VETERINARIAN', 'RECEPTIONIST'] },
  { title: 'คิวกรูมมิ่ง (Queue)', href: '/grooming/queue', icon: Scissors, badge: '5', allowedRoles: ['TENANT_OWNER', 'GROOMER', 'RECEPTIONIST'] },
  { title: 'ตรวจรักษา (Clinical)', href: '/clinical', icon: Stethoscope, badge: 'OPD', allowedRoles: ['TENANT_OWNER', 'VETERINARIAN', 'RECEPTIONIST'] },
  { title: 'ลูกค้า & สัตว์เลี้ยง', href: '/customers', icon: Users, allowedRoles: ['TENANT_OWNER', 'GROOMER', 'VETERINARIAN', 'RECEPTIONIST'] },
  { title: 'การรักษาลูกค้า (Retention)', href: '/retention', icon: UserCheck, badge: 'RFM', allowedRoles: ['TENANT_OWNER', 'VETERINARIAN'] },
  { title: 'บริการ & พนักงาน', href: '/services', icon: Briefcase, allowedRoles: ['TENANT_OWNER', 'RECEPTIONIST'] },
  { title: 'จุดขายหน้าร้าน (POS)', href: '/pos', icon: CreditCard, allowedRoles: ['TENANT_OWNER', 'RECEPTIONIST'] },
  { title: 'คลังสินค้า (Stock)', href: '/inventory', icon: Package, allowedRoles: ['TENANT_OWNER', 'VETERINARIAN', 'RECEPTIONIST'] },
  { title: 'แจ้งเตือน & LINE', href: '/notifications', icon: BellRing, allowedRoles: ['TENANT_OWNER', 'RECEPTIONIST'] },
  { title: 'รายงาน & วิเคราะห์', href: '/reports', icon: BarChart3, allowedRoles: ['TENANT_OWNER', 'VETERINARIAN'] },
  { title: 'แพ็กเกจ & บิล (SaaS)', href: '/settings/subscription', icon: Zap, badge: 'Pro', allowedRoles: ['TENANT_OWNER', 'SAAS_ADMIN'] },
  { title: 'SaaS Admin Hub', href: '/admin', icon: Shield, badge: 'HQ', allowedRoles: ['SAAS_ADMIN'] },
  { title: 'ตั้งค่าระบบ', href: '/settings', icon: Settings, allowedRoles: ['TENANT_OWNER', 'SAAS_ADMIN'] },
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

  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user.role)
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white font-bold shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              🐾
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
            เมนูหลัก ({user.roleTitle.split(' ')[0]})
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

        {/* Tenant/Branch Badge Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="rounded-2xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 transition-all hover:bg-slate-100/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]"></span>
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {user.branchName}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#0071e3] dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/70 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5" />
                {user.role === 'SAAS_ADMIN' ? 'SaaS HQ' : 'SaaS Pro'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {user.name} ({user.roleTitle.split(' ')[0]})
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

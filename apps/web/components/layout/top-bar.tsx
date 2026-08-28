'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Badge } from '@petflow/ui';
import {
  Menu,
  Bell,
  Search,
  Plus,
  Building2,
  ChevronDown,
  User,
  Command,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useBooking } from '../../contexts/booking-context';
import { NotificationPopover } from './notification-popover';

export function TopBar({
  onOpenMobile,
  onOpenSearch,
}: {
  onOpenMobile?: () => void;
  onOpenSearch?: () => void;
}) {
  const { user } = useAuth();
  const { openBookingModal } = useBooking();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 sm:px-6 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors gap-2">
      {/* Left section: Hamburger (mobile/iPad) + Branch Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/80 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branch Selector Dropdown Trigger */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-2.5 sm:px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/80 shadow-apple cursor-pointer hover:border-blue-200 hover:shadow-apple-md transition-all">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#0071e3] dark:bg-blue-950 dark:text-blue-400 shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px] md:max-w-[200px]">
              {user.branchName}
            </p>
          </div>
          <div className="text-left sm:hidden">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user.branchName.split(' ')[0]}
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Center Search Bar Trigger (Apple Spotlight Style) */}
      <div className="flex flex-1 max-w-xs md:max-w-md mx-1 sm:mx-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="relative w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-100/70 pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 text-xs text-slate-500 hover:bg-white hover:border-blue-300 hover:shadow-apple-md dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-blue-700 transition-all group text-left cursor-pointer"
        >
          <Search className="absolute left-2.5 sm:left-3 top-2.5 h-4 w-4 text-slate-400 group-hover:text-[#0071e3] transition-colors" />
          <span className="truncate text-[11px] sm:text-xs">ค้นหาลูกค้า, สัตว์เลี้ยง...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-200/90 dark:border-slate-700 shadow-sm shrink-0 ml-1">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Section: Quick Actions + Notifications + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Add Button for Store Staff */}
        {user.role !== 'SAAS_ADMIN' && (
          <Button
            size="sm"
            onClick={() => openBookingModal()}
            className="gap-1 sm:gap-1.5 shadow-sm shadow-blue-500/25 px-2.5 sm:px-3 text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white active:scale-95 transition"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">เพิ่มนัดหมาย / คิว</span>
            <span className="md:hidden">เพิ่ม</span>
          </Button>
        )}

        {/* Notifications Popover Dropdown */}
        <NotificationPopover />

        {/* User Profile Pill & Role Switcher */}
        <Link
          href="/login"
          title="คลิกเพื่อสลับบทบาทหรือออกจากระบบ"
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200/80 dark:border-slate-800 shrink-0 hover:opacity-80 transition group cursor-pointer"
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${
              user.avatarGradient || 'from-blue-500 to-[#0071e3]'
            } text-white font-bold text-xs shadow-sm shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform`}
          >
            {user.avatarText || user.name[0] || <User className="h-4 w-4" />}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100 group-hover:text-[#0071e3] transition-colors">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-400">{user.roleTitle}</p>
          </div>
          <Badge variant="default" className="hidden lg:inline-flex text-[10px]">
            🇹🇭 TH
          </Badge>
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors ml-1 hidden sm:inline" />
        </Link>
      </div>
    </header>
  );
}

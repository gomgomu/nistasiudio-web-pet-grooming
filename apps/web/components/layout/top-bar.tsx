'use client';

import React from 'react';
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
} from 'lucide-react';

export function TopBar({
  onOpenMobile,
  onOpenSearch,
}: {
  onOpenMobile?: () => void;
  onOpenSearch?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors">
      {/* Left section: Hamburger (mobile) + Branch Switcher */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/80 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branch Selector Dropdown Trigger */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/80 shadow-apple cursor-pointer hover:border-blue-200 hover:shadow-apple-md transition-all">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#0071e3] dark:bg-blue-950 dark:text-blue-400">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              สาขาทองหล่อ (Main)
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Center Search Bar Trigger (Apple Spotlight Style) */}
      <div className="flex flex-1 max-w-md mx-4 sm:mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="relative w-full flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-100/70 pl-9 pr-3 py-2 text-xs text-slate-500 hover:bg-white hover:border-blue-300 hover:shadow-apple-md dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-blue-700 transition-all group text-left cursor-pointer"
        >
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-hover:text-[#0071e3] transition-colors" />
          <span className="truncate">ค้นหาชื่อลูกค้า, เบอร์โทร, สัตว์เลี้ยง...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-200/90 dark:border-slate-700 shadow-sm">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Section: Quick Actions + Notifications + Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Add Button */}
        <Button size="sm" className="gap-1.5 shadow-sm shadow-blue-500/25">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">เพิ่มนัดหมาย / คิว</span>
          <span className="sm:hidden">เพิ่มคิว</span>
        </Button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 shadow-apple transition-all"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#0071e3] ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-[#0071e3] text-white font-semibold text-xs shadow-sm shadow-blue-500/20">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
              สมชาย รักสัตว์
            </p>
            <p className="text-[10px] text-slate-400">เจ้าของร้าน (Owner)</p>
          </div>
          <Badge variant="default" className="hidden sm:inline-flex text-[10px]">
            🇹🇭 TH
          </Badge>
        </div>
      </div>
    </header>
  );
}

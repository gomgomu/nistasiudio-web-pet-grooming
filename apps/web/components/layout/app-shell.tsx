'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { GlobalSearchModal } from '../search/global-search-modal';
import { NewAppointmentModal } from '../appointments/new-appointment-modal';
import { useAuth } from '../../contexts/auth-context';
import { Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect to /login if user is not authenticated and not on login page
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, user, pathname, router]);

  // For authentication pages (e.g. /login), render full screen without layout shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Loading state while checking authentication from localStorage
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-[#0071e3]" />
            <Sparkles className="h-7 w-7 text-[#0071e3] animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 font-semibold">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render nothing while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Global Quick Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Global New Booking / Appointment Modal */}
      <NewAppointmentModal />

      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        <TopBar
          onOpenMobile={() => setIsMobileOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

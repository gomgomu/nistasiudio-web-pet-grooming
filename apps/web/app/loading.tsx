import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-[#0071e3]" />
          <span className="text-2xl animate-pulse">🐾</span>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            กำลังโหลดข้อมูลระบบ PetFlow...
          </p>
          <p className="text-xs text-slate-400">
            กรุณารอสักครู่
          </p>
        </div>
      </div>
    </div>
  );
}

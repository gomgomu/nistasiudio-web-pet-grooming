'use client';

import React, { useEffect } from 'react';
import { Button } from '@petflow/ui';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('PetFlow Web Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f5f5f7] px-6 py-12 dark:bg-[#000000]">
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-900/10 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            เกิดข้อผิดพลาดในการโหลดหน้าเว็บ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ระบบพบปัญหาชั่วคราวในการประมวลผลข้อมูล กรุณาลองใหม่อีกครั้ง
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-slate-400">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shadow-blue-500/25"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่อีกครั้ง (Retry)
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              กลับหน้าแรก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

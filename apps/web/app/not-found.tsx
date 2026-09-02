import React from 'react';
import Link from 'next/link';
import { Button } from '@petflow/ui';
import { Home, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f5f5f7] px-6 py-12 dark:bg-[#000000]">
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] shadow-xl shadow-blue-900/10 border border-blue-100 dark:border-blue-900/40">
          <FileQuestion className="h-10 w-10 text-[#0071e3]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-wider uppercase text-[#0071e3] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
            404 Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight pt-2">
            ไม่พบหน้าที่คุณต้องการ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shadow-blue-500/25">
              <Home className="h-4 w-4" />
              กลับหน้าหลัก (Dashboard)
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2">
              <Search className="h-4 w-4" />
              ค้นหาข้อมูล
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

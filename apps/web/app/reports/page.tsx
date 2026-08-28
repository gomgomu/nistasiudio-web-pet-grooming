'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  UserX,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
  Clock,
  Scissors,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

const REPORT_MODULES = [
  {
    title: 'ศูนย์กู้คืนรายได้ & ป้องกันคิวว่าง (Revenue Recovery Hub)',
    description: 'รวบรวมโอกาสกู้เงินคืนจาก No-Show, ลูกค้า Inactive, รอบกรูมมิ่ง และวัคซีน พร้อมยิง LINE 1-Click',
    href: '/reports/revenue-recovery',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    borderColor: 'border-purple-200/80 dark:border-purple-800/80',
    badge: 'PF-057 Ready',
    stats: 'โอกาสกู้คืน ฿101,268 • กู้สำเร็จ 25.8%',
  },
  {
    title: 'รายงานการไม่มาตามนัด (No-Show Report)',
    description: 'วิเคราะห์อัตราการผิดนัดของลูกค้า มูลค่าความเสียหายสะสม และจัดการนโยบายเงินมัดจำ',
    href: '/reports/no-show',
    icon: UserX,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    borderColor: 'border-rose-200/80 dark:border-rose-800/80',
    badge: 'Active',
    stats: 'อัตรา No-Show 7.3% • สูญเสีย ฿11,700',
  },
  {
    title: 'รายงานการรักษาฐานลูกค้า (Retention & RFM)',
    description: 'จำแนกลูกค้า VIP, Active, At-Risk, Lost และตรวจจับรอบกรูมมิ่ง/วัคซีน',
    href: '/retention',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
    borderColor: 'border-blue-200/80 dark:border-blue-800/80',
    badge: 'Active',
    stats: '5 Segments • Due Detectors Active',
  },
  {
    title: 'แคมเปญดึงดูดลูกค้ากลับมา (Win-Back Campaigns)',
    description: 'สร้างโปรโมชั่นยิงอัตโนมัติผ่าน LINE OA เพื่อดึงลูกค้ากลุ่มเสี่ยงกลับมา',
    href: '/retention/campaigns',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    borderColor: 'border-purple-200/80 dark:border-purple-800/80',
    badge: 'LINE Ready',
    stats: 'Conversion Rate 26.7% • กู้คืน ฿14,400',
  },
  {
    title: 'รายงานสรุปทางการเงิน (Financial Summary)',
    description: 'สรุปยอดขาย รายได้แยกตามบริการ การชำระเงิน และภาษี',
    href: '/reports/no-show',
    icon: Receipt,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderColor: 'border-emerald-200/80 dark:border-emerald-800/80',
    badge: 'Phase 10',
    stats: 'ยอดขายสุทธิ • กำไรขั้นต้น',
  },
  {
    title: 'รายงานค่าคอมมิชชั่น & ค่ามือพนักงาน (Staff Commission Engine)',
    description: 'คำนวณส่วนแบ่งค่ามือช่างกรูมมิ่ง ค่าตรวจสัตวแพทย์ และยอดขายหน้าร้านรายบุคคลเพื่อจ่ายเงินเดือน',
    href: '/reports/staff-commission',
    icon: Scissors,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
    borderColor: 'border-amber-200/80 dark:border-amber-800/80',
    badge: 'Commission Ready',
    stats: 'จ่ายค่ามือ ฿48,650 • 4 พนักงาน',
  },
  {
    title: 'รายงานการใช้วัตถุดิบและสต็อก (Inventory Consumption)',
    description: 'อัตราการใช้แชมพู เวชภัณฑ์ และสินค้าหน้าร้าน',
    href: '/inventory',
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
    borderColor: 'border-indigo-200/80 dark:border-indigo-800/80',
    badge: 'Phase 10',
    stats: 'Stock Out Alerts • Reorder Points',
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          ศูนย์รายงานและวิเคราะห์ข้อมูล (Reports & Analytics Hub)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ระบบรายงานภาพรวมผลประกอบการ วิเคราะห์พฤติกรรมลูกค้า และการสูญเสียรายได้
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              href={mod.href}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${mod.bgColor} ${mod.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-3 group-hover:text-[#0071e3] transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {mod.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{mod.stats}</span>
                <span className="text-[#0071e3] font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  ดูรายงาน <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

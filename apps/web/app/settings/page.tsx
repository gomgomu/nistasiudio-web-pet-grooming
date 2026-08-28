'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  Users,
  Zap,
  Activity,
  Sliders,
  Shield,
  BellRing,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';

export default function SettingsHubPage() {
  const { user } = useAuth();

  const SETTINGS_SECTIONS = [
    {
      title: 'จัดการสาขา & เพิ่มสาขาใหม่ (Branches & Locations)',
      description: 'เปิดสาขาใหม่ตามโควต้าแพ็กเกจ, จัดการที่อยู่, เวลาทำการ, และเบอร์ติดต่อประจำสาขา',
      href: '/settings/branches',
      icon: Building2,
      badge: '3 สาขา (Pro)',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      title: 'ทีมงาน & เพิ่มผู้ใช้งานในร้าน (Staff & User Permissions)',
      description: 'เพิ่มบัญชีพนักงานใหม่ (ช่างกรูมมิ่ง, สัตวแพทย์, แคชเชียร์) และมอบหมายสาขาประจำ',
      href: '/settings/staff',
      icon: Users,
      badge: 'จัดการสิทธิ์',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      title: 'แพ็กเกจ & บิลค่าบริการ (SaaS Subscription)',
      description: 'จัดการแผนสมาชิกรายเดือน/รายปี, อัปเกรดแพ็กเกจ และดูประวัติใบเสร็จรับเงิน',
      href: '/settings/subscription',
      icon: Zap,
      badge: 'Pro Plan',
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      title: 'การใช้ทรัพยากร & โควต้า (Usage Metering)',
      description: 'ตรวจเช็กปริมาณการใช้ LINE OA, SMS, Storage, และเติมเครดิตเสริม',
      href: '/settings/usage',
      icon: Activity,
      badge: 'Live Quota',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      title: 'บริการ & อัตราค่าบริการ (Services & Pricing)',
      description: 'กำหนดรายการบริการอาบน้ำ-ตัดขน, แพ็กเกจตรวจสุขภาพ, และอัตราค่าบริการ',
      href: '/services',
      icon: Settings,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60',
    },
    {
      title: 'การแจ้งเตือน & ข้อความอัตโนมัติ (Notifications & LINE)',
      description: 'ตั้งค่าเทมเพลตข้อความเตือนนัดหมาย, คิวกรูมมิ่ง, และนัดฉีดวัคซีน',
      href: '/notifications',
      icon: BellRing,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60',
    },
  ];

  return (
    <div className="w-full space-y-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" /> การตั้งค่าระบบ (Settings)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          จัดการข้อมูลธุรกิจ, เพิ่มสาขา, เพิ่มพนักงาน, กำหนดสิทธิ์, และแพ็กเกจสมาชิก SaaS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple hover:border-[#0071e3]/40 dark:hover:border-blue-700 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${sec.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {sec.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0071e3] dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                      {sec.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#0071e3] transition">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 flex items-center justify-end text-xs font-bold text-[#0071e3] group-hover:translate-x-0.5 transition">
                เข้าสู่การตั้งค่า <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

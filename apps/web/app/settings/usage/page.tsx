'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  MessageSquare,
  Smartphone,
  HardDrive,
  Calendar,
  Zap,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  QrCode,
  Check,
  X,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { UsageMeterItem, TenantUsageDashboard } from '@petflow/types';

// Mock Initial Dashboard
const MOCK_USAGE_DASHBOARD: TenantUsageDashboard = {
  tenantId: 't-1',
  tenantName: 'คลินิกรักษาสัตว์ทองหล่อ (PetFlow Demo HQ)',
  planCode: 'PROFESSIONAL',
  billingPeriod: '2026-08',
  meters: [
    {
      metricType: 'LINE_MESSAGES',
      label: 'LINE Official Account Integration',
      unit: 'ข้อความ',
      used: 1420,
      quotaLimit: 2000,
      extraCredits: 0,
      totalAllowed: 2000,
      remaining: 580,
      percentage: 71,
      isOverLimit: false,
      warningLevel: 'NORMAL',
    },
    {
      metricType: 'SMS_CREDITS',
      label: 'SMS แจ้งเตือนด่วน & OTP',
      unit: 'เครดิต',
      used: 480,
      quotaLimit: 500,
      extraCredits: 0,
      totalAllowed: 500,
      remaining: 20,
      percentage: 96,
      isOverLimit: false,
      warningLevel: 'CRITICAL_95',
    },
    {
      metricType: 'STORAGE_BYTES',
      label: 'พื้นที่จัดเก็บรูปถ่าย ฟิล์ม X-Ray & เวชระเบียน',
      unit: 'GB',
      used: 2.4,
      quotaLimit: 10.0,
      extraCredits: 0,
      totalAllowed: 10.0,
      remaining: 7.6,
      percentage: 24,
      isOverLimit: false,
      warningLevel: 'NORMAL',
    },
    {
      metricType: 'MONTHLY_APPOINTMENTS',
      label: 'ยอดนัดหมายตรวจรักษาและกรูมมิ่งเดือนนี้',
      unit: 'เคส',
      used: 84,
      quotaLimit: 1000,
      extraCredits: 0,
      totalAllowed: 1000,
      remaining: 916,
      percentage: 8,
      isOverLimit: false,
      warningLevel: 'NORMAL',
    },
    {
      metricType: 'API_CALLS',
      label: 'API & Webhooks Requests',
      unit: 'ครั้ง',
      used: 12400,
      quotaLimit: 50000,
      extraCredits: 0,
      totalAllowed: 50000,
      remaining: 37600,
      percentage: 25,
      isOverLimit: false,
      warningLevel: 'NORMAL',
    },
  ],
};

const TOPUP_PACKAGES = [
  {
    id: 'pack-line-1000',
    metricType: 'LINE_MESSAGES',
    title: 'แพ็กเกจ LINE OA +1,000 ข้อความ',
    credits: 1000,
    priceThb: 350,
    desc: 'ส่งข้อความเตือนนัดหมายและใบเสร็จอัตโนมัติ',
    popular: true,
  },
  {
    id: 'pack-sms-500',
    metricType: 'SMS_CREDITS',
    title: 'แพ็กเกจ SMS +500 เครดิต',
    credits: 500,
    priceThb: 290,
    desc: 'SMS แจ้งเตือนฉุกเฉินสำหรับลูกค้าที่ไม่ได้แอด LINE',
    popular: false,
  },
  {
    id: 'pack-storage-50gb',
    metricType: 'STORAGE_BYTES',
    title: 'พื้นที่เก็บข้อมูลเพิ่ม +50 GB',
    credits: 50,
    priceThb: 490,
    desc: 'สำหรับคลินิกที่มีฟิล์ม X-Ray และประวัติภาพถ่ายจำนวนมาก',
    popular: false,
  },
];

export default function UsageMeteringPage() {
  const [dashboard, setDashboard] = useState<TenantUsageDashboard>(MOCK_USAGE_DASHBOARD);
  const [selectedPack, setSelectedPack] = useState<typeof TOPUP_PACKAGES[0] | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const criticalMeters = dashboard.meters.filter(
    (m) => m.warningLevel === 'CRITICAL_95' || m.warningLevel === 'EXCEEDED_100'
  );

  const handleConfirmTopUp = () => {
    if (!selectedPack) return;
    setDashboard((prev) => ({
      ...prev,
      meters: prev.meters.map((m) => {
        if (m.metricType === selectedPack.metricType) {
          const newExtra = m.extraCredits + selectedPack.credits;
          const newTotal = m.quotaLimit + newExtra;
          const newRemaining = Math.max(0, newTotal - m.used);
          const newPct = Math.round((m.used / newTotal) * 100);
          return {
            ...m,
            extraCredits: newExtra,
            totalAllowed: newTotal,
            remaining: newRemaining,
            percentage: newPct,
            warningLevel: newPct >= 95 ? 'CRITICAL_95' : newPct >= 80 ? 'WARNING_80' : 'NORMAL',
          };
        }
        return m;
      }),
    }));

    setSelectedPack(null);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/settings" className="hover:text-slate-900">
              การตั้งค่า (Settings)
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/settings/subscription" className="hover:text-slate-900">
              แพ็กเกจ & บิล
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-purple-600 font-bold">การใช้ทรัพยากร & โควต้า</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" /> การใช้ทรัพยากร & โควต้าระบบ (Usage Metering)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ติดตามปริมาณการใช้งาน LINE OA, SMS, พื้นที่จัดเก็บ และซื้อเครดิตเพิ่มตามต้องการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 text-purple-700 dark:text-purple-300 font-bold text-xs">
            รอบบิลปัจจุบัน: {dashboard.billingPeriod}
          </div>
        </div>
      </div>

      {/* Critical Quota Warning Banner */}
      {criticalMeters.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                แจ้งเตือนโควต้าใกล้หมด (Quota Alert)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {criticalMeters.map((m) => m.label).join(', ')} ถูกใช้งานไปแล้วมากกว่า 95%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPack(TOPUP_PACKAGES[1])}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap"
          >
            + ซื้อแพ็กเกจเสริมทันที
          </button>
        </div>
      )}

      {/* Meter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.meters.map((meter) => {
          const isCritical = meter.warningLevel === 'CRITICAL_95' || meter.warningLevel === 'EXCEEDED_100';
          const isWarning = meter.warningLevel === 'WARNING_80';

          return (
            <div
              key={meter.metricType}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    {meter.label}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {meter.metricType}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isCritical
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {meter.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                    }`}
                    style={{ width: `${meter.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ใช้ไป {meter.used.toLocaleString('th-TH')} {meter.unit}
                  </span>
                  <span className="text-slate-400">
                    เต็ม {meter.totalAllowed.toLocaleString('th-TH')} {meter.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  คงเหลือ:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {meter.remaining.toLocaleString('th-TH')}
                  </strong>{' '}
                  {meter.unit}
                </span>

                {(meter.metricType === 'LINE_MESSAGES' ||
                  meter.metricType === 'SMS_CREDITS' ||
                  meter.metricType === 'STORAGE_BYTES') && (
                  <button
                    type="button"
                    onClick={() => {
                      const pack = TOPUP_PACKAGES.find((p) => p.metricType === meter.metricType);
                      if (pack) setSelectedPack(pack);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-3 h-3" /> เติมเครดิต
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top-up Add-on Packages Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> แพ็กเกจเติมเครดิตเสริม (Add-on Packs)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ซื้อเครดิตเพิ่มได้ตลอดเวลา ไม่หมดอายุตามรอบบิล และใช้งานต่อเนื่องได้ทันที
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOPUP_PACKAGES.map((pack) => (
            <div
              key={pack.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                pack.popular
                  ? 'border-purple-400/80 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {pack.title}
                  </span>
                  {pack.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-600 text-white">
                      ยอดนิยม
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {pack.priceThb} <span className="text-xs font-normal text-slate-500">บาท</span>
                </div>
                <p className="text-[11px] text-slate-500">{pack.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPack(pack)}
                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition active:scale-95"
              >
                ซื้อเครดิตนี้
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top-up Payment Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-center">
            <div className="flex items-center justify-between border-b pb-3 text-left">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  ชำระเงินผ่าน PromptPay QR
                </h3>
              </div>
              <button
                onClick={() => setSelectedPack(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {selectedPack.title}
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {selectedPack.priceThb}{' '}
                <span className="text-sm font-normal text-slate-500">บาท</span>
              </div>
            </div>

            {/* Simulated PromptPay QR */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block mx-auto">
              <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner border border-slate-200">
                <div className="text-center space-y-1">
                  <QrCode className="w-24 h-24 mx-auto text-slate-800" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">
                    Thai PromptPay QR
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 block mt-2">
                สแกนจ่ายได้ทุกแอปธนาคาร เครดิตเข้าทันที
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmTopUp}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> ยืนยันการชำระเงินเรียบร้อย
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                เติมเครดิตสำเร็จ!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                เครดิตถูกเพิ่มเข้าสู่ระบบของคลินิกเรียบร้อยแล้ว และพร้อมใช้งานทันที
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl transition"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

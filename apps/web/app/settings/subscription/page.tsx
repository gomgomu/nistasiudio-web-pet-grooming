'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Building2,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  QrCode,
  FileText,
  Clock,
  Layers,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { SubscriptionPlanItem, TenantSubscriptionDetails, BillingCycle } from '@petflow/types';

// Mock Current Subscription
const MOCK_CURRENT_SUB: TenantSubscriptionDetails = {
  id: 'sub-01',
  tenantId: 't-1',
  tenantName: 'คลินิกรักษาสัตว์ทองหล่อ (PetFlow HQ)',
  planId: 'plan-starter-uuid',
  planCode: 'STARTER',
  planName: 'Starter Plan (เริ่มต้น)',
  status: 'ACTIVE',
  billingCycle: 'MONTHLY',
  priceMinor: 129000,
  currency: 'THB',
  trialEndsAt: null,
  currentPeriodStart: '2026-08-01T00:00:00Z',
  currentPeriodEnd: '2026-08-31T23:59:59Z',
  cancelAtPeriodEnd: false,
  canceledAt: null,
  customMaxBranches: null,
  customMaxStaffUsers: null,
  paymentMethod: 'PROMPTPAY',
  effectiveMaxBranches: 1,
  effectiveMaxStaffUsers: 3,
  effectiveMaxMonthlyAppointments: 300,
  currentBranchCount: 1,
  currentUserCount: 2,
  currentMonthlyAppointmentCount: 84,
  hasLineIntegration: false,
  hasAdvancedInventory: false,
  hasClinicalSoap: true,
  hasVaccinationRegistry: true,
  hasCommissionEngine: false,
  hasMultiBranchCentral: false,
  hasApiAccess: false,
};

// Available Plans
const MOCK_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'plan-1',
    code: 'STARTER',
    name: 'Starter Plan (เริ่มต้น)',
    description: 'เหมาะสำหรับร้านกรูมมิ่งหรือคลินิกเดี่ยว 1 สาขา ทีมงานไม่เกิน 3 คน',
    priceMonthlyMinor: 129000,
    priceYearlyMinor: 1290000,
    currency: 'THB',
    maxBranches: 1,
    maxStaffUsers: 3,
    maxMonthlyAppointments: 300,
    hasLineIntegration: false,
    hasAdvancedInventory: false,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: false,
    hasMultiBranchCentral: false,
    hasApiAccess: false,
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'plan-2',
    code: 'PROFESSIONAL',
    name: 'Professional Plan (ธุรกิจเติบโต & ไฮบริด)',
    description: 'ยอดนิยม! สำหรับคลินิกและร้านกรูมมิ่ง 1-3 สาขา เชื่อมต่อ LINE OA, คลังยาละเอียด, และคิดคอมมิชชั่น',
    priceMonthlyMinor: 299000,
    priceYearlyMinor: 2990000,
    currency: 'THB',
    maxBranches: 3,
    maxStaffUsers: 10,
    maxMonthlyAppointments: 1500,
    hasLineIntegration: true,
    hasAdvancedInventory: true,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: true,
    hasMultiBranchCentral: false,
    hasApiAccess: false,
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'plan-3',
    code: 'ENTERPRISE',
    name: 'Enterprise Plan (องค์กร & เชนสาขา)',
    description: 'สำหรับโรงพยาบาลสัตว์ขนาดใหญ่และเชนสาขา ไม่จำกัดสาขา ไม่จำกัดผู้ใช้ พร้อมศูนย์ควบคุมส่วนกลาง HQ',
    priceMonthlyMinor: 599000,
    priceYearlyMinor: 5990000,
    currency: 'THB',
    maxBranches: 99,
    maxStaffUsers: 999,
    maxMonthlyAppointments: 999999,
    hasLineIntegration: true,
    hasAdvancedInventory: true,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: true,
    hasMultiBranchCentral: true,
    hasApiAccess: true,
    isActive: true,
    sortOrder: 3,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

export default function SubscriptionSettingsPage() {
  const [currentSub, setCurrentSub] = useState<TenantSubscriptionDetails>(MOCK_CURRENT_SUB);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<SubscriptionPlanItem | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleUpgrade = (plan: SubscriptionPlanItem) => {
    setSelectedPlanToUpgrade(plan);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlanToUpgrade) return;
    setIsUpgrading(true);

    setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);
      setCurrentSub((prev) => ({
        ...prev,
        planCode: selectedPlanToUpgrade.code,
        planName: selectedPlanToUpgrade.name,
        priceMinor:
          billingCycle === 'YEARLY'
            ? selectedPlanToUpgrade.priceYearlyMinor
            : selectedPlanToUpgrade.priceMonthlyMinor,
        billingCycle,
        effectiveMaxBranches: selectedPlanToUpgrade.maxBranches,
        effectiveMaxStaffUsers: selectedPlanToUpgrade.maxStaffUsers,
        effectiveMaxMonthlyAppointments: selectedPlanToUpgrade.maxMonthlyAppointments,
        hasLineIntegration: selectedPlanToUpgrade.hasLineIntegration,
        hasAdvancedInventory: selectedPlanToUpgrade.hasAdvancedInventory,
        hasCommissionEngine: selectedPlanToUpgrade.hasCommissionEngine,
        hasMultiBranchCentral: selectedPlanToUpgrade.hasMultiBranchCentral,
        hasApiAccess: selectedPlanToUpgrade.hasApiAccess,
      }));

      setTimeout(() => {
        setUpgradeSuccess(false);
        setSelectedPlanToUpgrade(null);
      }, 1500);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Top Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
          <Link href="/settings" className="hover:text-slate-900">
            การตั้งค่า (Settings)
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0071e3] font-bold">แผนแพ็กเกจและการชำระเงิน (Subscription & Billing)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> แผนแพ็กเกจ SaaS & โควต้าการใช้งาน (Subscription Plan)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          จัดการแพ็กเกจขององค์กร, ตรวจสอบโควต้าสาขาและผู้ใช้งาน, และอัปเกรดเพื่อปลดล็อกฟีเจอร์ระดับสูง
        </p>
      </div>

      {/* Current Subscription & Live Quotas Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                แพ็กเกจปัจจุบันของคุณ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● ใช้งานอยู่ (Active)
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              {currentSub.planName}
            </h2>
            <p className="text-xs text-slate-400">
              รอบบิลถัดไป: {new Date(currentSub.currentPeriodEnd).toLocaleDateString('th-TH', { dateStyle: 'long' })} • ชำระผ่าน {currentSub.paymentMethod}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-white">
              {(currentSub.priceMinor / 100).toLocaleString('th-TH')}{' '}
              <span className="text-xs font-normal text-slate-400">
                บาท / {currentSub.billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Resource Usage Quotas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Branches */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" /> โควต้าสาขา (Branches)
              </span>
              <span>
                {currentSub.currentBranchCount} / {currentSub.effectiveMaxBranches} สาขา
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  currentSub.currentBranchCount >= currentSub.effectiveMaxBranches
                    ? 'bg-amber-400'
                    : 'bg-[#0071e3]'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentSub.currentBranchCount / currentSub.effectiveMaxBranches) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              {currentSub.currentBranchCount >= currentSub.effectiveMaxBranches
                ? '⚠️ ใช้โควต้าสาขาครบแล้ว'
                : `สร้างเพิ่มได้อีก ${currentSub.effectiveMaxBranches - currentSub.currentBranchCount} สาขา`}
            </span>
          </div>

          {/* Staff Users */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" /> ผู้ใช้งานระบบ (Staff Users)
              </span>
              <span>
                {currentSub.currentUserCount} / {currentSub.effectiveMaxStaffUsers} บัญชี
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (currentSub.currentUserCount / currentSub.effectiveMaxStaffUsers) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              รองรับ สัตวแพทย์, ช่างกรูมมิ่ง, และแคชเชียร์
            </span>
          </div>

          {/* Appointments */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> นัดหมายเดือนนี้ (Appointments)
              </span>
              <span>
                {currentSub.currentMonthlyAppointmentCount} / {currentSub.effectiveMaxMonthlyAppointments} เคส
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (currentSub.currentMonthlyAppointmentCount / currentSub.effectiveMaxMonthlyAppointments) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              รีเซ็ตโควต้าทุกวันที่ 1 ของเดือน
            </span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          เลือกแพ็กเกจที่เหมาะกับขนาดธุรกิจของคุณ
        </h2>
        <p className="text-xs text-slate-500">
          อัปเกรดหรือเปลี่ยนแพ็กเกจได้ตลอดเวลา พร้อมคิดค่าบริการตามสัดส่วนการใช้งานจริง
        </p>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
          <button
            type="button"
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              billingCycle === 'MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายเดือน (Monthly)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('YEARLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              billingCycle === 'YEARLY'
                ? 'bg-[#0071e3] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายปี (Yearly)
            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-md">
              ประหยัด 2 เดือน
            </span>
          </button>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_PLANS.map((plan) => {
          const isCurrent = currentSub.planCode === plan.code;
          const isPro = plan.code === 'PROFESSIONAL';
          const price =
            billingCycle === 'YEARLY'
              ? plan.priceYearlyMinor / 100
              : plan.priceMonthlyMinor / 100;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 transition-all flex flex-col justify-between border ${
                isPro
                  ? 'bg-white dark:bg-slate-900 border-[#0071e3] ring-2 ring-[#0071e3]/30 shadow-xl relative'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-apple'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> แนะนำสำหรับธุรกิจเติบโต (Most Popular)
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                <div className="border-b pb-4">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {price.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-medium text-slate-500">
                      บาท / {billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
                    </span>
                  </div>
                </div>

                {/* Quotas & Features checklist */}
                <div className="space-y-2.5 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    โควต้าทรัพยากร:
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      รองรับสูงสุด <strong>{plan.maxBranches === 99 ? 'ไม่จำกัด' : plan.maxBranches} สาขา</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      ทีมงาน <strong>{plan.maxStaffUsers === 999 ? 'ไม่จำกัด' : plan.maxStaffUsers} บัญชีผู้ใช้</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      นัดหมาย <strong>{plan.maxMonthlyAppointments >= 99999 ? 'ไม่จำกัด' : `${plan.maxMonthlyAppointments.toLocaleString()} เคส/เดือน`}</strong>
                    </span>
                  </div>

                  <div className="font-bold text-slate-700 dark:text-slate-300 pt-2">
                    ฟีเจอร์การทำงาน:
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ระบบคิวตรวจรักษา OPD & บันทึก SOAP</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ทะเบียนวัคซีน & สมุดวัคซีนดิจิทัล (Passport)</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.hasLineIntegration ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400'}`}>
                    {plan.hasLineIntegration ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span>แจ้งเตือนอัตโนมัติผ่าน LINE Official Account</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.hasAdvancedInventory ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400'}`}>
                    {plan.hasAdvancedInventory ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span>คลังสินค้าขั้นสูง (Lot & Expire Alert, FIFO Cost)</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.hasCommissionEngine ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400'}`}>
                    {plan.hasCommissionEngine ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span>ระบบคำนวณคอมมิชชั่นช่างกรูมมิ่ง & สัตวแพทย์</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.hasMultiBranchCentral ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400'}`}>
                    {plan.hasMultiBranchCentral ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span>ศูนย์รวมข้อมูลส่วนกลาง HQ & โอนย้ายสต็อกข้ามสาขา</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold cursor-default"
                  >
                    ✓ แพ็กเกจปัจจุบันของคุณ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-md ${
                      isPro
                        ? 'bg-[#0071e3] hover:bg-[#005bb5] text-white shadow-blue-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
                    }`}
                  >
                    อัปเกรดเป็น {plan.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {selectedPlanToUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0071e3]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  ยืนยันการอัปเกรดแพ็กเกจ (Upgrade Plan)
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanToUpgrade(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {upgradeSuccess ? (
              <div className="p-8 text-center space-y-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  อัปเกรดแพ็กเกจสำเร็จ!
                </h4>
                <p className="text-xs text-slate-500">
                  ระบบได้ปรับปรุงโควต้าและปลดล็อกฟีเจอร์ใหม่ให้กับองค์กรของคุณแล้ว
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 space-y-1">
                    <span className="font-extrabold text-blue-900 dark:text-blue-200 block text-sm">
                      {selectedPlanToUpgrade.name}
                    </span>
                    <p className="text-blue-700 dark:text-blue-300">
                      รอบการชำระ:{' '}
                      <strong>{billingCycle === 'YEARLY' ? 'รายปี (Yearly)' : 'รายเดือน (Monthly)'}</strong>
                    </p>
                    <p className="text-base font-black text-[#0071e3] mt-1">
                      ยอดชำระ:{' '}
                      {(
                        (billingCycle === 'YEARLY'
                          ? selectedPlanToUpgrade.priceYearlyMinor
                          : selectedPlanToUpgrade.priceMonthlyMinor) / 100
                      ).toLocaleString('th-TH')}{' '}
                      บาท
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      วิธีการชำระเงิน (Payment Method):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl border-2 border-[#0071e3] bg-blue-50/50 dark:bg-blue-950/40 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <QrCode className="w-4 h-4 text-[#0071e3]" /> PromptPay QR
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500">
                        <CreditCard className="w-4 h-4" /> บัตรเครดิต
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanToUpgrade(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUpgrade}
                    disabled={isUpgrading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md transition active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isUpgrading ? 'กำลังดำเนินการ...' : 'ชำระเงินและอัปเกรดทันที'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

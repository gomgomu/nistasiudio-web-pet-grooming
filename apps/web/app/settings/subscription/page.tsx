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
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { Badge, Button } from '@petflow/ui';
import { SubscriptionPlanItem, TenantSubscriptionDetails, BillingCycle } from '@petflow/types';

// Mock Current Subscription
const MOCK_CURRENT_SUB: TenantSubscriptionDetails = {
  id: 'sub-01',
  tenantId: 't-1',
  tenantName: 'Demo Pet Care Clinic & Grooming',
  planId: 'plan-pro-uuid',
  planCode: 'PROFESSIONAL',
  planName: 'Professional Plan (ธุรกิจเติบโต & ไฮบริด)',
  status: 'ACTIVE',
  billingCycle: 'MONTHLY',
  priceMinor: 299000,
  currency: 'THB',
  trialEndsAt: null,
  currentPeriodStart: '2026-08-28T00:00:00Z',
  currentPeriodEnd: '2026-09-28T23:59:59Z',
  cancelAtPeriodEnd: false,
  canceledAt: null,
  customMaxBranches: null,
  customMaxStaffUsers: null,
  paymentMethod: 'PROMPTPAY',
  effectiveMaxBranches: 3,
  effectiveMaxStaffUsers: 10,
  effectiveMaxMonthlyAppointments: 1500,
  currentBranchCount: 1,
  currentUserCount: 4,
  currentMonthlyAppointmentCount: 128,
  hasLineIntegration: true,
  hasAdvancedInventory: true,
  hasClinicalSoap: true,
  hasVaccinationRegistry: true,
  hasCommissionEngine: true,
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

  // Renewal Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  // Calculate days remaining
  const expiryDate = new Date(currentSub.currentPeriodEnd);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

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

  const handleConfirmRenewal = () => {
    setIsRenewing(true);
    setTimeout(() => {
      setIsRenewing(false);
      setRenewSuccess(true);
      // Extend current period by 30 days
      const currentEnd = new Date(currentSub.currentPeriodEnd);
      currentEnd.setDate(currentEnd.getDate() + 30);
      setCurrentSub((prev) => ({
        ...prev,
        currentPeriodEnd: currentEnd.toISOString(),
      }));

      setTimeout(() => {
        setRenewSuccess(false);
        setIsRenewModalOpen(false);
      }, 1800);
    }, 1000);
  };

  return (
    <div className="w-full space-y-8 pb-24">
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
          <Zap className="w-6 h-6 text-amber-500" /> แผนแพ็กเกจ SaaS & วันหมดอายุ (Subscription Plan)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ตรวจสอบวันหมดอายุรอบปัจจุบัน, จัดการโควต้าสาขาและผู้ใช้งาน, และต่ออายุการใช้งานล่วงหน้า
        </p>
      </div>

      {/* Current Subscription & Expiry Countdown Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-700/80 pb-6">
          {/* Left info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                แพ็กเกจปัจจุบันของคุณ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● ใช้งานปกติ (Active)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              {currentSub.planName}
            </h2>
            <p className="text-xs text-slate-400">
              ชื่อองค์กร: {currentSub.tenantName} • ชำระผ่าน {currentSub.paymentMethod}
            </p>
          </div>

          {/* Right Expiry & Action Box */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 lg:min-w-[420px]">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📅 เริ่มต้นรอบบิล:</span>
                <span className="font-bold text-slate-200">
                  {new Date(currentSub.currentPeriodStart).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">⏳ ครบกำหนดรอบบิล:</span>
                <span className="font-extrabold text-white">
                  {new Date(currentSub.currentPeriodEnd).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  เหลือเวลาใช้งานอีก {daysRemaining} วัน (รอบบิล 1 เดือน)
                </span>
              </div>
            </div>

            <Button
              onClick={() => setIsRenewModalOpen(true)}
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/30 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ต่ออายุล่วงหน้า</span>
            </Button>
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
                    (currentSub.currentMonthlyAppointmentCount /
                      currentSub.effectiveMaxMonthlyAppointments) *
                      100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              โควต้าจะรีเซ็ตอัตโนมัติทุกสิ้นเดือน
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Expiry & Grace Period Policy Breakdown */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              นโยบายเมื่อแพ็กเกจหมดอายุ & ช่วงผ่อนปรน (Grace Period Policy)
            </h3>
            <p className="text-xs text-slate-500">
              เข้าใจขั้นตอนการดูแลรักษาข้อมูลและสิทธิ์การใช้งานเมื่อครบกำหนดรอบบิล
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0071e3] text-xs font-black flex items-center justify-center">
                1
              </span>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                เตือนล่วงหน้า 7 วัน
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ระบบจะส่งแจ้งเตือนผ่าน LINE OA และอีเมลของเจ้าของร้าน พร้อมลิงก์สำหรับกดชำระเงินต่ออายุได้ทันที
            </p>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
              ● ใช้งานได้ครบทุกฟังก์ชัน 100%
            </span>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center justify-center">
                2
              </span>
              <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                ช่วงผ่อนปรน (5 วัน)
              </h4>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              หากถึงวันหมดอายุแล้วยังไม่ได้ชำระเงิน ระบบจะให้เวลาผ่อนปรน 5 วัน ยังคงเปิดดูข้อมูลลูกค้าและคิดเงิน POS หน้าร้านได้ตามปกติ
            </p>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block">
              ● มีแถบเตือนสีส้มด้านบนจอ
            </span>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center justify-center">
                3
              </span>
              <h4 className="font-extrabold text-xs text-rose-900 dark:text-rose-200">
                ล็อกหน้าจอ (Paywall)
              </h4>
            </div>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
              เมื่อพ้นช่วงผ่อนปรน ระบบจะล็อกหน้าจอชั่วคราว มี QR Code แสดงยอดชำระ สแกนจ่ายแล้วระบบจะปลดล็อกให้ใช้งานได้ทันที
            </p>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block">
              ● ปลดล็อกอัตโนมัติหลังชำระ
            </span>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center">
                4
              </span>
              <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                เก็บข้อมูลไว้ตลอดไป (Lifetime)
              </h4>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              ประวัติการรักษา สัตว์เลี้ยง และยอดขายทั้งหมดจะถูกบันทึกไว้อย่างปลอดภัยถาวร ไม่มีวันถูกลบ เมื่อกลับมาต่ออายุ ข้อมูลจะพร้อมใช้งานทันที 100%
            </p>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
              ● การันตีข้อมูลไม่สูญหาย ปลอดภัย 100%
            </span>
          </div>
        </div>
      </div>

      {/* Available Plans Selector Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-4">
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#0071e3] dark:bg-blue-950/60 dark:text-blue-400">
          PLANS & PRICING
        </span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
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
            billingCycle === 'YEARLY' ? plan.priceYearlyMinor / 100 : plan.priceMonthlyMinor / 100;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isPro
                  ? 'bg-white dark:bg-slate-900 border-2 border-[#0071e3] shadow-xl ring-4 ring-blue-500/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> แนะนำสำหรับธุรกิจเติบโต
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {price.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      บาท / {billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
                    </span>
                  </div>
                  {billingCycle === 'YEARLY' && (
                    <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 block">
                      (เฉลี่ยเพียง {Math.round(price / 12).toLocaleString('th-TH')} บาท/เดือน)
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-4 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider block">
                    ขีดความสามารถที่ได้รับ:
                  </span>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      รองรับสูงสุด <strong>{plan.maxBranches} สาขา</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      ผู้ใช้งาน <strong>{plan.maxStaffUsers} บัญชีพนักงาน</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      นัดหมาย <strong>{plan.maxMonthlyAppointments.toLocaleString()} เคส/เดือน</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    {plan.hasLineIntegration ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={plan.hasLineIntegration ? '' : 'text-slate-400 line-through'}>
                      เชื่อมต่อ LINE Official Account เตือนนัด
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    {plan.hasAdvancedInventory ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={plan.hasAdvancedInventory ? '' : 'text-slate-400 line-through'}>
                      คลังยาและสินค้าละเอียด พร้อมแจ้งเตือนสต็อก
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    {plan.hasCommissionEngine ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={plan.hasCommissionEngine ? '' : 'text-slate-400 line-through'}>
                      ระบบคิดค่ามือ/คอมมิชชั่นช่างและหมอ
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                  >
                    ● แพ็กเกจปัจจุบันของคุณ
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                      isPro
                        ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-blue-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-slate-500/15'
                    }`}
                  >
                    {plan.sortOrder > (currentSub.planCode === 'STARTER' ? 1 : 2)
                      ? 'อัปเกรดเป็นแพ็กเกจนี้'
                      : 'เปลี่ยนมาใช้แพ็กเกจนี้'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Confirmation Modal */}
      {selectedPlanToUpgrade && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                ยืนยันการเปลี่ยนแพ็กเกจ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPlanToUpgrade(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md transition active:scale-95 cursor-pointer"
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

      {/* Renewal Confirmation Modal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                💳 ต่ออายุแพ็กเกจล่วงหน้า
              </h3>
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renewSuccess ? (
              <div className="p-8 text-center space-y-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ต่ออายุแพ็กเกจสำเร็จ!
                </h4>
                <p className="text-xs text-slate-500">
                  ระบบได้ขยายเวลาการใช้งานเพิ่มอีก 30 วันเรียบร้อยแล้ว
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block text-sm">
                      {currentSub.planName} (+30 วัน)
                    </span>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      วันหมดอายุใหม่:{' '}
                      <strong>
                        {new Date(
                          new Date(currentSub.currentPeriodEnd).getTime() + 30 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                      </strong>
                    </p>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      ยอดชำระ: {(currentSub.priceMinor / 100).toLocaleString('th-TH')} บาท
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      วิธีการชำระเงิน (Payment Method):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <QrCode className="w-4 h-4 text-emerald-600" /> PromptPay QR
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
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRenewal}
                    disabled={isRenewing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
                    {isRenewing ? 'กำลังประมวลผล...' : 'ยืนยันการชำระและต่ออายุ'}
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

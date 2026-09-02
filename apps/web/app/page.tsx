'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@petflow/ui';
import { useAuth } from '../contexts/auth-context';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Scissors,
  CreditCard,
  Sparkles,
  AlertTriangle,
  UserX,
  Repeat,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Download,
  Building2,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  Send,
  Zap,
  Phone,
  Plus,
  Activity,
} from 'lucide-react';
import {
  OwnerDashboardMetrics,
  DashboardPeriod,
} from '@petflow/types';

// Mock comprehensive executive metrics (PF-055 / PF-056)
const MOCK_OWNER_METRICS: OwnerDashboardMetrics = {
  tenantId: 'tenant-1',
  branchId: 'b1',
  branchName: 'สาขาทองหล่อ (Thonglor HQ)',
  period: 'THIS_MONTH',
  periodStart: '2026-08-01T00:00:00Z',
  periodEnd: '2026-08-27T23:59:59Z',
  revenue: {
    totalRevenueMinor: 24850000, // 248,500 THB
    grossProfitMinor: 18637500, // 186,375 THB (~75%)
    previousPeriodRevenueMinor: 21750000, // 217,500 THB
    growthRate: 14.3, // +14.3% MoM
    revenueByPaymentMethod: [
      { method: 'PROMPT_PAY', methodLabel: 'พร้อมเพย์ (PromptPay QR)', amountMinor: 14910000, count: 186, percentage: 60.0 },
      { method: 'CREDIT_CARD', methodLabel: 'บัตรเครดิต/เดบิต', amountMinor: 5964000, count: 54, percentage: 24.0 },
      { method: 'TRANSFER', methodLabel: 'โอนเงินธนาคาร', amountMinor: 2485000, count: 28, percentage: 10.0 },
      { method: 'CASH', methodLabel: 'เงินสด (Cash)', amountMinor: 1491000, count: 20, percentage: 6.0 },
    ],
    revenueByCategory: [
      { category: 'GROOMING', categoryLabel: 'อาบน้ำตัดขน (Grooming)', amountMinor: 14910000, percentage: 60.0 },
      { category: 'SPA', categoryLabel: 'สปา & ทรีตเมนต์ (Spa)', amountMinor: 4473000, percentage: 18.0 },
      { category: 'VET_CLINIC', categoryLabel: 'คลินิก & วัคซีน (Veterinary)', amountMinor: 2982000, percentage: 12.0 },
      { category: 'RETAIL', categoryLabel: 'สินค้าสัตว์เลี้ยง (Pet Shop)', amountMinor: 2485000, percentage: 10.0 },
    ],
  },
  appointments: {
    totalAppointments: 320,
    completedAppointments: 278,
    pendingOrConfirmedAppointments: 18,
    inProgressAppointments: 6,
    noShowCount: 18,
    noShowRate: 5.6,
    noShowLostRevenueMinor: 1170000, // 11,700 THB
    cancelledCount: 8,
    cancellationRate: 2.5,
  },
  customerAndLtv: {
    averageTicketMinor: 86284, // ~863 THB
    totalActiveCustomers: 214,
    newCustomersCount: 38,
    repeatCustomersCount: 176,
    newCustomerRevenueMinor: 4970000,
    repeatCustomerRevenueMinor: 19880000,
    repeatRevenueShare: 80.0, // 80% repeat revenue
    inactiveCustomersCount: 52, // 38 At Risk + 14 Lost
    recoverableRevenueOpportunityMinor: 4486800, // ~44,868 THB
  },
  retentionSummary: {
    vipCount: 32,
    activeCount: 182,
    atRiskCount: 38,
    lostCount: 14,
    newCount: 38,
    totalCustomers: 304,
  },
  dailyRevenueTrend: [
    { date: '2026-08-21', label: '21 ส.ค.', revenueMinor: 850000, appointmentsCount: 11, newCustomersCount: 1 },
    { date: '2026-08-22', label: '22 ส.ค.', revenueMinor: 1420000, appointmentsCount: 18, newCustomersCount: 3 },
    { date: '2026-08-23', label: '23 ส.ค.', revenueMinor: 1650000, appointmentsCount: 22, newCustomersCount: 4 },
    { date: '2026-08-24', label: '24 ส.ค.', revenueMinor: 720000, appointmentsCount: 9, newCustomersCount: 1 },
    { date: '2026-08-25', label: '25 ส.ค.', revenueMinor: 940000, appointmentsCount: 12, newCustomersCount: 2 },
    { date: '2026-08-26', label: '26 ส.ค.', revenueMinor: 1180000, appointmentsCount: 15, newCustomersCount: 2 },
    { date: '2026-08-27', label: 'วันนี้ (27)', revenueMinor: 1350000, appointmentsCount: 17, newCustomersCount: 3 },
  ],
  recentActivities: [
    {
      id: 'act-1',
      type: 'INVOICE_PAID',
      title: 'ชำระเงินบิล #INV-2026-0824',
      description: 'คุณกนกวรรณ ชำระเงินค่า Full Grooming น้องโมจิ (฿850) ผ่านพร้อมเพย์',
      amountMinor: 85000,
      timestamp: '2026-08-27T11:45:00Z',
    },
    {
      id: 'act-2',
      type: 'CAMPAIGN_CONVERSION',
      title: 'ลูกค้ากลับมาจองจาก LINE Win-Back!',
      description: 'คุณธนินท์ ใช้คูปองส่วนลด 15% จองสปากรูมมิ่งน้องส้มจี๊ด',
      amountMinor: 65000,
      timestamp: '2026-08-27T10:30:00Z',
    },
    {
      id: 'act-3',
      type: 'APPOINTMENT_COMPLETED',
      title: 'ให้บริการเสร็จสิ้น: อาบน้ำโอโซนสปา',
      description: 'น้องชาโคล รับบริการเสร็จเรียบร้อย ช่างเอกส่งแจ้งเตือน LINE ให้เจ้าของแล้ว',
      amountMinor: 45000,
      timestamp: '2026-08-27T09:50:00Z',
    },
    {
      id: 'act-4',
      type: 'NO_SHOW',
      title: 'ลูกค้าไม่มาตามนัด (No-Show)',
      description: 'คุณกิตติศักดิ์ ผิดนัดหมายบริการตัดขนสุนัขใหญ่ (ระบบเปิดบังคับมัดจำ)',
      amountMinor: 65000,
      timestamp: '2026-08-27T09:00:00Z',
    },
  ],
  generatedAt: '2026-08-27T12:00:00Z',
};

// Mock live grooming queue items
interface QueueItem {
  id: string;
  petName: string;
  species: 'DOG' | 'CAT';
  breed: string;
  ownerName: string;
  phone: string;
  service: string;
  groomer: string;
  status: 'WAITING' | 'BATHING' | 'DRYING' | 'GROOMING' | 'FINISHING' | 'READY';
  specialCare?: string;
  timeRemainingMinutes: number;
}

const initialQueue: QueueItem[] = [
  {
    id: 'Q-101',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    ownerName: 'คุณกนกวรรณ',
    phone: '089-111-2233',
    service: 'อาบน้ำ + ตัดขนสไตล์หมี',
    groomer: 'ช่างแนน',
    status: 'GROOMING',
    specialCare: 'ระวังผิวแพ้ง่าย ใช้แชมพูสูตร Organic',
    timeRemainingMinutes: 25,
  },
  {
    id: 'Q-102',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    ownerName: 'คุณธนภัทร',
    phone: '081-999-8877',
    service: 'อาบน้ำ + สปาโอโซน',
    groomer: 'ช่างเอก',
    status: 'DRYING',
    timeRemainingMinutes: 15,
  },
  {
    id: 'Q-103',
    petName: 'น้องถ้วยฟู',
    species: 'DOG',
    breed: 'Poodle Toy',
    ownerName: 'คุณศิริพร',
    phone: '084-555-6677',
    service: 'ตัดแต่งขนเต็มรูปแบบ + ทำเล็บ',
    groomer: 'ช่างแนน',
    status: 'WAITING',
    specialCare: 'กลัวเสียงไดร์เป่าขน ให้เบาพัดลม',
    timeRemainingMinutes: 60,
  },
  {
    id: 'Q-104',
    petName: 'น้องบ๊อบบี้',
    species: 'DOG',
    breed: 'Golden Retriever',
    ownerName: 'คุณวรวิทย์',
    phone: '086-333-4455',
    service: 'อาบน้ำ + กำจัดขนผลัด',
    groomer: 'ช่างเอก',
    status: 'READY',
    timeRemainingMinutes: 0,
  },
];

const statusColors: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  WAITING: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'รอรับบริการ', dot: 'bg-slate-400' },
  BATHING: { bg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', label: 'กำลังอาบน้ำ', dot: 'bg-sky-500' },
  DRYING: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', label: 'กำลังไดร์ขน', dot: 'bg-amber-500' },
  GROOMING: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-[#0071e3] dark:text-blue-300', label: 'กำลังตัดแต่งขน', dot: 'bg-[#0071e3]' },
  FINISHING: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', label: 'เก็บรายละเอียด', dot: 'bg-indigo-500' },
  READY: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', label: 'พร้อมรับกลับ 🐾', dot: 'bg-emerald-500' },
};

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUEUE' | 'TIMELINE'>('OVERVIEW');
  const [period, setPeriod] = useState<DashboardPeriod>('THIS_MONTH');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [queue] = useState<QueueItem[]>(initialQueue);
  const metrics = MOCK_OWNER_METRICS;

  const maxDailyRevenue = useMemo(() => {
    return Math.max(...metrics.dailyRevenueTrend.map((d) => d.revenueMinor), 1);
  }, [metrics.dailyRevenueTrend]);

  return (
    <div className="space-y-6">
        {/* Executive Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Dashboard Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#0071e3]" /> ภาพรวมผู้บริหาร ({user?.roleTitle ? user.roleTitle.split(' ')[0] : 'ผู้บริหาร'})
            </button>
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'QUEUE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-purple-600" /> คิวกรูมมิ่งสด (Live Queue)
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'TIMELINE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> ตารางนัดหมายวันนี้
            </button>
          </div>

          {/* Branch & Period Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/80 shadow-apple text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="ALL">🏢 รวมทุกสาขา</option>
                <option value="b-01">สาขาทองหล่อ (Main)</option>
                <option value="b-02">สาขาอารีย์</option>
                <option value="b-03">สาขาเอกมัย</option>
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
              {[
                { id: 'TODAY', label: 'วันนี้' },
                { id: 'THIS_WEEK', label: 'สัปดาห์นี้' },
                { id: 'THIS_MONTH', label: 'เดือนนี้' },
                { id: 'LAST_30_DAYS', label: '30 วัน' },
                { id: 'YEAR_TO_DATE', label: 'ปีนี้' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as DashboardPeriod)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    period === p.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Welcome Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0071e3] via-[#005bb7] to-[#03448e] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/15">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                  <Sparkles className="w-3 h-3 text-amber-300" /> PetFlow Thai-First Architecture
                </span>
                <span className="text-xs text-blue-100">
                  อัปเดตเรียลไทม์ • {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                สวัสดีคุณ{user?.name || 'ผู้ใช้งาน'}! ยอดขายเดือนนี้ ฿{(metrics.revenue.totalRevenueMinor / 100).toLocaleString('th-TH')} (+{metrics.revenue.growthRate}%)
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {user?.roleTitle || 'เจ้าของร้าน'} ประจำ{user?.branchName || 'สาขาทองหล่อ'} • คิวกรูมมิ่งในระบบวันนี้ {queue.length} คิว • สัดส่วนรายได้ลูกค้าประจำ {metrics.customerAndLtv.repeatRevenueShare}%
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/retention/campaigns"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#0071e3] hover:bg-blue-50 font-bold text-xs shadow-md transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> ยิง LINE Win-Back
              </Link>
              <Link
                href="/pos"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" /> เปิดระบบ POS
              </Link>
            </div>
          </div>
        </div>

        {/* 5 Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">ยอดขายรวม (Revenue)</span>
                <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                ฿{(metrics.revenue.totalRevenueMinor / 100).toLocaleString('th-TH')}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{metrics.revenue.growthRate}% MoM
              </span>
              <span className="text-slate-400 text-[11px]">กำไรขั้นต้น 75%</span>
            </div>
          </div>

          {/* 2. Total Appointments */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">นัดหมาย & คิว (Bookings)</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {metrics.appointments.totalAppointments}{' '}
                <span className="text-sm font-normal text-slate-400">คิว</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>เสร็จ {metrics.appointments.completedAppointments}</span>
              <span className="text-purple-600 font-semibold">รอทำ {metrics.appointments.pendingOrConfirmedAppointments}</span>
            </div>
          </div>

          {/* 3. Average Ticket */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">ยอดเฉลี่ยต่อบิล (Avg Ticket)</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                ฿{(metrics.customerAndLtv.averageTicketMinor / 100).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>จาก {metrics.revenue.revenueByPaymentMethod.reduce((acc, c) => acc + c.count, 0)} บิล</span>
              <span className="text-emerald-600 font-semibold">+6.2%</span>
            </div>
          </div>

          {/* 4. Repeat Revenue Share */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">สัดส่วนลูกค้าประจำ (Repeat)</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60">
                  <Repeat className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                {metrics.customerAndLtv.repeatRevenueShare}%
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>ประจำ {metrics.customerAndLtv.repeatCustomersCount} ราย</span>
              <span className="text-blue-600">ใหม่ {metrics.customerAndLtv.newCustomersCount} ราย</span>
            </div>
          </div>

          {/* 5. No-Show Lost Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">สูญเสีย No-Show</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                  <UserX className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
                ฿{(metrics.appointments.noShowLostRevenueMinor / 100).toLocaleString('th-TH')}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-rose-600 font-semibold">{metrics.appointments.noShowRate}% No-Show</span>
              <Link href="/reports/no-show" className="text-[#0071e3] hover:underline font-semibold">
                ดูรายงาน &gt;
              </Link>
            </div>
          </div>
        </div>

        {/* Tab 1: Executive Overview Content */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Revenue Trend Bar Chart (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                      <BarChart3 className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        แนวโน้มรายได้และจำนวนคิว 7 วันล่าสุด (Daily Revenue Trend)
                      </h3>
                      <p className="text-xs text-slate-500">
                        รายได้เฉลี่ย ฿{(maxDailyRevenue / 100).toLocaleString('th-TH')} / วัน
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    หน่วย: บาท (THB)
                  </span>
                </div>

                {/* Bar Chart */}
                <div className="pt-6 pb-2">
                  <div className="grid grid-cols-7 gap-3 items-end h-48">
                    {metrics.dailyRevenueTrend.map((day) => {
                      const heightPercent = Math.max(15, Math.round((day.revenueMinor / maxDailyRevenue) * 100));
                      const isToday = day.label.includes('วันนี้');

                      return (
                        <div key={day.date} className="flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-slate-900 dark:text-white text-center">
                            ฿{(day.revenueMinor / 100).toLocaleString('th-TH')}
                          </div>
                          <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 flex flex-col justify-end h-36">
                            <div
                              className={`w-full rounded-xl transition-all duration-300 ${
                                isToday
                                  ? 'bg-gradient-to-t from-[#0071e3] to-blue-400 shadow-md shadow-blue-500/25'
                                  : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-[#0071e3]'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <div className="text-center">
                            <div className={`text-xs font-bold ${isToday ? 'text-[#0071e3]' : 'text-slate-700 dark:text-slate-300'}`}>
                              {day.label}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{day.appointmentsCount} คิว</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Revenue by Service Category (1 Col) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                      <Scissors className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        สัดส่วนรายได้ตามบริการ (By Category)
                      </h3>
                      <p className="text-xs text-slate-500">บริการอาบน้ำตัดขนคิดเป็น 60% ของรายได้</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {metrics.revenue.revenueByCategory.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{cat.categoryLabel}</span>
                          <span className="text-slate-900 dark:text-white">
                            ฿{(cat.amountMinor / 100).toLocaleString('th-TH')} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              cat.category === 'GROOMING'
                                ? 'bg-[#0071e3]'
                                : cat.category === 'SPA'
                                ? 'bg-purple-500'
                                : cat.category === 'VET_CLINIC'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Mini Badges */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    ช่องทางการชำระเงิน (Payment Methods)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.revenue.revenueByPaymentMethod.map((pm) => (
                      <div key={pm.method} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                        <div className="text-[11px] text-slate-500 truncate">{pm.methodLabel}</div>
                        <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {pm.percentage}% ({pm.count} บิล)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Retention RFM & Live Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer RFM Segmentation Card (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60">
                      <Users className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        สุขภาพฐานลูกค้า & มูลค่าตลอดชีพ (Customer RFM Health)
                      </h3>
                      <p className="text-xs text-slate-500">
                        ฐานลูกค้าทั้งหมด {metrics.retentionSummary.totalCustomers} ราย แบ่งตามความถี่และมูลค่าการใช้จ่าย
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/retention"
                    className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
                  >
                    ดู RFM Matrix <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {/* VIP */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
                    <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">👑 VIP Platinum</span>
                    <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                      {metrics.retentionSummary.vipCount}
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">ใช้จ่าย &gt; ฿5,000</span>
                  </div>

                  {/* Active */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">✨ Active Loyal</span>
                    <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                      {metrics.retentionSummary.activeCount}
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">มาใช้บริการ &lt; 45 วัน</span>
                  </div>

                  {/* New */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300">🌱 New Customer</span>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">
                      {metrics.retentionSummary.newCount}
                    </div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400">ลูกค้าใหม่รอบนี้</span>
                  </div>

                  {/* At Risk */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-center">
                    <span className="text-xs font-extrabold text-rose-800 dark:text-rose-300">⚠️ At-Risk</span>
                    <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">
                      {metrics.retentionSummary.atRiskCount}
                    </div>
                    <span className="text-[10px] text-rose-700 dark:text-rose-400">ขาดการติดต่อ 60-90 วัน</span>
                  </div>

                  {/* Lost */}
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">💤 Inactive Lost</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {metrics.retentionSummary.lostCount}
                    </div>
                    <span className="text-[10px] text-slate-500">&gt; 90 วันไม่กลับมา</span>
                  </div>
                </div>

                {/* Revenue Opportunity Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-purple-50 to-blue-50 dark:from-rose-950/30 dark:via-purple-950/30 dark:to-blue-950/30 border border-rose-200/60 dark:border-rose-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        โอกาสกู้คืนรายได้จากลูกค้า Inactive ({metrics.customerAndLtv.inactiveCustomersCount} ราย)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        มูลค่าประมาณการ ฿{(metrics.customerAndLtv.recoverableRevenueOpportunityMinor / 100).toLocaleString('th-TH')} ที่สามารถดึงกลับมาได้ด้วยแคมเปญ LINE
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/retention/campaigns"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
                  >
                    เปิดแคมเปญดึงลูกค้ากลับ &gt;
                  </Link>
                </div>
              </div>

              {/* Live Activities Feed (1 Col) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      กิจกรรมสำคัญล่าสุด (Live Activity)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.recentActivities.map((act) => (
                    <div key={act.id} className="py-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {act.title}
                        </span>
                        {act.amountMinor && (
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                            +฿{(act.amountMinor / 100).toLocaleString('th-TH')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{act.description}</p>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(act.timestamp).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        น.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Grooming Queue Board */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>✂️ บอร์ดคิวกรูมมิ่งสด (Live Grooming Queue)</span>
                  <Badge variant="blue" className="animate-pulse text-[10px]">LIVE</Badge>
                </h2>
                <p className="text-xs text-slate-500">
                  สถานะการให้บริการตัดขนและอาบน้ำของสาขาทองหล่อ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/grooming/queue" className="text-xs font-bold text-[#0071e3] hover:underline">
                  เปิดคิวกรูมมิ่งเต็มรูปแบบ &gt;
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {queue.map((item) => {
                const statusConfig = statusColors[item.status];
                return (
                  <Card
                    key={item.id}
                    className="relative overflow-hidden flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-apple hover:shadow-apple-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-lg shadow-xs">
                            {item.species === 'DOG' ? '🐕' : '🐈'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0071e3] transition-colors">
                              {item.petName}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {item.breed}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">บริการ:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                            {item.service}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ช่างผู้ดูแล:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.groomer}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">เจ้าของ:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.ownerName}
                          </span>
                        </div>
                      </div>

                      {item.specialCare && (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                          <span className="leading-tight">{item.specialCare}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {item.timeRemainingMinutes > 0
                          ? `อีก ~${item.timeRemainingMinutes} นาที`
                          : 'เสร็จเรียบร้อย'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/80 text-slate-600 dark:border-slate-700 dark:text-slate-300 transition-colors"
                          title="โทรหาลูกค้า"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                        {item.status === 'READY' ? (
                          <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1 bg-[#0071e3] text-white">
                            <Send className="h-3 w-3" /> แจ้ง LINE
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                            อัปเดตสถานะ
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Today's Timeline Content */}
        {activeTab === 'TIMELINE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold">
                  📅 ตารางนัดหมายช่วงบ่ายวันนี้
                </CardTitle>
                <Link href="/appointments" className="text-xs font-semibold text-[#0071e3] hover:underline">
                  ดูปฏิทินทั้งหมด
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[#0071e3] shadow-xs">
                      14:00 - 15:00
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        น้องมอมแมม (ไซบีเรียน ฮัสกี้) • คุณณัฐวุฒิ
                      </p>
                      <p className="text-[11px] text-slate-500">
                        บริการ: อาบน้ำใหญ่ + สางขนผลัด • นัดกับ ช่างเอก
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">รอเช็คอิน</Badge>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[#0071e3] shadow-xs">
                      15:30 - 16:30
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        น้องมีตังค์ (เฟรนช์ บูลด็อก) • คุณพิมลดา
                      </p>
                      <p className="text-[11px] text-slate-500">
                        บริการ: ตรวจสุขภาพทั่วไป + ฉีดวัคซีนรวม • สัตวแพทย์หมอพลอย
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">จองแล้ว</Badge>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[#0071e3] shadow-xs">
                      16:30 - 17:30
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        น้องกาฟิลด์ (เปอร์เซีย) • คุณชวลิต
                      </p>
                      <p className="text-[11px] text-slate-500">
                        บริการ: กรูมมิ่งขนแมวยาว + ตัดเล็บ • ช่างแนน
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">จองแล้ว</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>🚀 สรุประบบและฟีเจอร์หลัก</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#0071e3] font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Executive Owner Dashboard (PF-055 / PF-056)</span>
                </div>
                <div className="flex items-center gap-2 text-[#0071e3] font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Retention Engine & RFM Analysis (PF-050)</span>
                </div>
                <div className="flex items-center gap-2 text-[#0071e3] font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Grooming Due & Vaccine Due Detectors</span>
                </div>
                <div className="flex items-center gap-2 text-[#0071e3] font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>LINE Automated Win-Back Campaigns</span>
                </div>
                <div className="flex items-center gap-2 text-[#0071e3] font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>No-Show Analytics & Lost Revenue Engine</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
}

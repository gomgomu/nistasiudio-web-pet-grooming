'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Zap,
  Sliders,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Activity,
  UserCheck,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  DollarSign,
  Layers,
  X,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { SaaSTenantListItem, SaaSMetricsOverview, SystemAuditLogItem } from '@petflow/types';

// Mock SaaS Platform Overview Metrics
const MOCK_METRICS: SaaSMetricsOverview = {
  totalTenants: 10,
  activeTenants: 9,
  trialingTenants: 2,
  pastDueTenants: 0,
  suspendedTenants: 1,
  mrrMinor: 2490000, // 24,900 THB
  arrMinor: 29880000, // 298,800 THB
  totalPetsCount: 1250,
  totalAppointmentsThisMonth: 320,
  totalRevenueThisMonthMinor: 8500000, // 85,000 THB
  planDistribution: [
    { planCode: 'PROFESSIONAL', count: 6 },
    { planCode: 'STARTER', count: 3 },
    { planCode: 'ENTERPRISE', count: 1 },
  ],
  businessTypeDistribution: [
    { businessType: 'HYBRID_CLINIC_GROOMING', count: 5 },
    { businessType: 'VETERINARY_CLINIC', count: 3 },
    { businessType: 'GROOMING_SALON', count: 2 },
  ],
};

// Mock Tenants List
const MOCK_TENANTS: SaaSTenantListItem[] = [
  {
    id: 't-1',
    name: 'คลินิกรักษาสัตว์ทองหล่อ (PetFlow Demo HQ)',
    slug: 'thonglor-vet',
    businessType: 'HYBRID_CLINIC_GROOMING',
    phone: '02-123-4567',
    email: 'admin@thonglorvet.com',
    isActive: true,
    planCode: 'PROFESSIONAL',
    planName: 'Professional Plan',
    subscriptionStatus: 'ACTIVE',
    billingCycle: 'MONTHLY',
    priceMinor: 299000,
    branchCount: 2,
    userCount: 5,
    customerCount: 120,
    petCount: 150,
    monthlyAppointmentCount: 84,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 't-2',
    name: 'สุขุมวิท เพ็ท แคร์ แอนด์ กรูมมิ่ง',
    slug: 'sukhumvit-petcare',
    businessType: 'HYBRID_CLINIC_GROOMING',
    phone: '02-999-8888',
    email: 'contact@sukhumvitpetcare.com',
    isActive: true,
    planCode: 'PROFESSIONAL',
    planName: 'Professional Plan',
    subscriptionStatus: 'ACTIVE',
    billingCycle: 'YEARLY',
    priceMinor: 2990000,
    branchCount: 1,
    userCount: 4,
    customerCount: 85,
    petCount: 110,
    monthlyAppointmentCount: 62,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 't-3',
    name: 'โรงพยาบาลสัตว์กรุงเทพพรีเมียม (Bangkok Pet Hospital Chain)',
    slug: 'bkk-pethospital',
    businessType: 'PET_HOSPITAL',
    phone: '02-555-4321',
    email: 'ceo@bkkpethospital.co.th',
    isActive: true,
    planCode: 'ENTERPRISE',
    planName: 'Enterprise Plan',
    subscriptionStatus: 'ACTIVE',
    billingCycle: 'YEARLY',
    priceMinor: 5990000,
    branchCount: 6,
    userCount: 28,
    customerCount: 540,
    petCount: 680,
    monthlyAppointmentCount: 140,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 't-4',
    name: 'กรูมมิ่งพาวคลับ อารีย์ (Paw Club Aree)',
    slug: 'pawclub-aree',
    businessType: 'GROOMING_SALON',
    phone: '089-777-6655',
    email: 'owner@pawclub.com',
    isActive: true,
    planCode: 'STARTER',
    planName: 'Starter Plan',
    subscriptionStatus: 'ACTIVE',
    billingCycle: 'MONTHLY',
    priceMinor: 129000,
    branchCount: 1,
    userCount: 2,
    customerCount: 45,
    petCount: 52,
    monthlyAppointmentCount: 28,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 't-5',
    name: 'เพ็ทเฮเว่น พระราม 9 (Pet Haven Clinic)',
    slug: 'pethaven-rama9',
    businessType: 'VETERINARY_CLINIC',
    phone: '02-333-2211',
    email: 'info@pethaven.com',
    isActive: false,
    planCode: 'STARTER',
    planName: 'Starter Plan',
    subscriptionStatus: 'SUSPENDED',
    billingCycle: 'MONTHLY',
    priceMinor: 129000,
    branchCount: 1,
    userCount: 2,
    customerCount: 30,
    petCount: 35,
    monthlyAppointmentCount: 6,
    createdAt: '2026-01-20T00:00:00Z',
  },
];

// Mock Audit Logs
const MOCK_AUDIT_LOGS: SystemAuditLogItem[] = [
  {
    id: 'log-101',
    tenantId: 't-5',
    tenantName: 'เพ็ทเฮเว่น พระราม 9',
    userId: 'admin-01',
    userName: 'Platform Super Admin',
    action: 'SUSPEND_TENANT',
    entity: 'TENANT',
    entityId: 't-5',
    ip: '183.88.22.10',
    createdAt: '2026-08-27T10:15:00Z',
  },
  {
    id: 'log-102',
    tenantId: 't-3',
    tenantName: 'โรงพยาบาลสัตว์กรุงเทพพรีเมียม',
    userId: 'admin-01',
    userName: 'Platform Super Admin',
    action: 'UPGRADE_PLAN_ENTERPRISE',
    entity: 'SUBSCRIPTION',
    entityId: 'sub-3',
    ip: '183.88.22.10',
    createdAt: '2026-08-25T14:30:00Z',
  },
  {
    id: 'log-103',
    tenantId: 't-1',
    tenantName: 'คลินิกรักษาสัตว์ทองหล่อ',
    userId: 'admin-01',
    userName: 'Platform Super Admin',
    action: 'SET_FEATURE_OVERRIDE',
    entity: 'FEATURE_FLAG',
    entityId: 'LINE_MESSAGING',
    ip: '183.88.22.10',
    createdAt: '2026-08-20T09:00:00Z',
  },
];

export default function SaaSAdminPage() {
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'AUDIT'>('TENANTS');
  const [tenants, setTenants] = useState<SaaSTenantListItem[]>(MOCK_TENANTS);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Status Action Modal
  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState<SaaSTenantListItem | null>(null);
  const [statusReason, setStatusReason] = useState<string>('ค้างชำระค่าบริการเกินกำหนด');

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (filterStatus === 'ACTIVE' && !t.isActive) return false;
      if (filterStatus === 'SUSPENDED' && t.isActive) return false;
      if (filterPlan !== 'ALL' && t.planCode !== filterPlan) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        t.name.toLowerCase().includes(s) ||
        t.slug.toLowerCase().includes(s) ||
        (t.email && t.email.toLowerCase().includes(s)) ||
        (t.phone && t.phone.includes(s))
      );
    });
  }, [tenants, filterStatus, filterPlan, searchTerm]);

  const handleToggleTenantStatus = () => {
    if (!selectedTenantForStatus) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === selectedTenantForStatus.id ? { ...t, isActive: !t.isActive } : t
      )
    );
    setSelectedTenantForStatus(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>SaaS Platform Control</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-purple-600 font-bold">Super Admin Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" /> ศูนย์ควบคุมระบบส่วนกลาง (SaaS Admin Console)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บริหารจัดการองค์กร (Tenants), ติดตามรายได้ MRR/ARR, จัดสรรสิทธิ์ และตรวจสอบ System Audit Logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/feature-flags"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Sliders className="w-4 h-4" /> จัดการ Feature Flags
          </Link>
          <Link
            href="/settings/subscription"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-400" /> แผนแพ็กเกจ SaaS
          </Link>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* MRR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">รายรับสม่ำเสมอ / ด. (MRR)</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {(MOCK_METRICS.mrrMinor / 100).toLocaleString('th-TH')}{' '}
            <span className="text-xs font-normal text-slate-500">บาท</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            ARR: {(MOCK_METRICS.arrMinor / 100).toLocaleString('th-TH')} บาท/ปี
          </span>
        </div>

        {/* Active Tenants */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">องค์กรที่ใช้งานอยู่</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {MOCK_METRICS.activeTenants} / {MOCK_METRICS.totalTenants}{' '}
            <span className="text-xs font-normal text-slate-500">Tenants</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {MOCK_METRICS.suspendedTenants} องค์กรถูกระงับ
          </span>
        </div>

        {/* Total Pets */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">สัตว์เลี้ยงในระบบรวม</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {MOCK_METRICS.totalPetsCount.toLocaleString('th-TH')}{' '}
            <span className="text-xs font-normal text-slate-500">ตัว</span>
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
            ฐานข้อมูลผู้ป่วย & ทะเบียน
          </span>
        </div>

        {/* Monthly Appointments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">นัดหมายเดือนนี้รวม</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {MOCK_METRICS.totalAppointmentsThisMonth.toLocaleString('th-TH')}{' '}
            <span className="text-xs font-normal text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            OPD & Grooming Bookings
          </span>
        </div>

        {/* Gross Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">ยอดขายผ่านระบบ (GMV)</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {(MOCK_METRICS.totalRevenueThisMonthMinor / 100).toLocaleString('th-TH')}{' '}
            <span className="text-xs font-normal text-slate-500">บาท</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ยอดบิลหน้าร้าน POS รวม
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('TENANTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'TENANTS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          🏢 ทะเบียนองค์กรทั้งหมด (Tenants Directory)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'AUDIT'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          📜 ประวัติการทำงานระบบ (System Audit Logs)
        </button>
      </div>

      {activeTab === 'TENANTS' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="ACTIVE">🟢 ปกติ (Active)</option>
                <option value="SUSPENDED">🔴 ถูกระงับ (Suspended)</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">ทุกแพ็กเกจ (All Plans)</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อคลินิก, slug, อีเมล, เบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ชื่อองค์กร / Slug</th>
                    <th className="py-3 px-4">ประเภทธุรกิจ</th>
                    <th className="py-3 px-4">แพ็กเกจ & ยอดบิล</th>
                    <th className="py-3 px-4">การใช้งานทรัพยากร</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                          {t.name}
                        </span>
                        <span className="text-[11px] font-mono text-purple-600 font-bold">
                          /{t.slug}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {t.email || '-'} • {t.phone || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t.businessType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-black block ${
                            t.planCode === 'ENTERPRISE'
                              ? 'text-purple-600'
                              : t.planCode === 'PROFESSIONAL'
                              ? 'text-blue-600'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t.planName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(t.priceMinor / 100).toLocaleString('th-TH')} บาท / {t.billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
                        </span>
                      </td>

                      <td className="py-3 px-4 space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <span>🏢 {t.branchCount} สาขา</span>
                          <span>•</span>
                          <span>👥 {t.userCount} ผู้ใช้</span>
                          <span>•</span>
                          <span>🐾 {t.petCount} ตัว</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          นัดหมายเดือนนี้: {t.monthlyAppointmentCount} เคส
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                            ● เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                            ✕ ถูกระงับ
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTenantForStatus(t)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                            t.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                          }`}
                        >
                          {t.isActive ? 'ระงับบริการ' : 'ปลดระงับ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* System Audit Trail Tab */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              ประวัติการดำเนินการระบบส่วนกลาง (Platform Audit Trail)
            </h3>
            <span className="text-xs text-slate-400">บันทึกอัตโนมัติแบบไม่สามารถแก้ไขได้</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">วันและเวลา</th>
                  <th className="py-3 px-4">องค์กร (Tenant)</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ (Admin User)</th>
                  <th className="py-3 px-4">Action & Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.tenantName}
                    </td>
                    <td className="py-3 px-4 text-purple-600 font-semibold">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspend / Activate Modal */}
      {selectedTenantForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {selectedTenantForStatus.isActive ? (
                  <Lock className="w-5 h-5 text-rose-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedTenantForStatus.isActive ? 'ระงับการให้บริการ (Suspend Tenant)' : 'ปลดระงับการให้บริการ (Reactivate Tenant)'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTenantForStatus(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                คุณกำลังจะ{selectedTenantForStatus.isActive ? 'ระงับการเข้าถึงระบบของ' : 'เปิดใช้งานระบบให้'}{' '}
                <strong>{selectedTenantForStatus.name}</strong>
              </p>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ระบุเหตุผล (บันทึกลงใน System Audit Trail):
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="เช่น ค้างชำระค่าบริการ / คำขอจากเจ้าของธุรกิจ"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedTenantForStatus(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleToggleTenantStatus}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition active:scale-95 text-white ${
                  selectedTenantForStatus.isActive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedTenantForStatus.isActive ? 'ยืนยันการระงับ' : 'ยืนยันการเปิดใช้งาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

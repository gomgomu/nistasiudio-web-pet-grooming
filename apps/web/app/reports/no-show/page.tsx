'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserX,
  AlertTriangle,
  Calendar,
  Clock,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Send,
  Phone,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Download,
  Building2,
  Scissors,
  CheckCircle2,
  X,
  Sparkles,
  Users,
  Eye,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import {
  NoShowReportSummary,
  NoShowByCustomerItem,
  NoShowByServiceItem,
  NoShowByDayOfWeekItem,
  NoShowAppointmentItem,
} from '@petflow/types';

// Mock summary
const MOCK_SUMMARY: NoShowReportSummary = {
  totalAppointments: 248,
  completedAppointments: 218,
  noShowCount: 18,
  cancelledCount: 12,
  noShowRate: 7.3,
  cancellationRate: 4.8,
  totalLostRevenueMinor: 1170000, // 11,700 THB
  lostCapacityMinutes: 1440, // 24 hours
  averageLostPerNoShowMinor: 65000,
  repeatOffendersCount: 4,
  periodStart: '2026-07-28T00:00:00Z',
  periodEnd: '2026-08-27T23:59:59Z',
};

// Mock repeat offenders
const MOCK_OFFENDERS: NoShowByCustomerItem[] = [
  {
    customerId: 'cust-1',
    customerName: 'กิตติศักดิ์ มีชัย',
    customerPhone: '081-111-2222',
    lineUserId: 'U111222',
    marketingStatus: 'OPTED_IN',
    totalBookings: 6,
    noShowCount: 3,
    noShowRate: 50.0,
    totalLostRevenueMinor: 210000,
    lastNoShowAt: '2026-08-22T14:00:00Z',
    riskBadge: 'HIGH_RISK',
    requireDeposit: true,
  },
  {
    customerId: 'cust-2',
    customerName: 'วราภรณ์ แสงทอง',
    customerPhone: '089-333-4455',
    lineUserId: 'U333444',
    marketingStatus: 'OPTED_IN',
    totalBookings: 5,
    noShowCount: 2,
    noShowRate: 40.0,
    totalLostRevenueMinor: 130000,
    lastNoShowAt: '2026-08-20T10:00:00Z',
    riskBadge: 'HIGH_RISK',
    requireDeposit: true,
  },
  {
    customerId: 'cust-3',
    customerName: 'ธนินท์ รัตนกุล',
    customerPhone: '084-555-6677',
    lineUserId: 'U555666',
    marketingStatus: 'OPTED_IN',
    totalBookings: 8,
    noShowCount: 2,
    noShowRate: 25.0,
    totalLostRevenueMinor: 140000,
    lastNoShowAt: '2026-08-15T15:30:00Z',
    riskBadge: 'MODERATE_RISK',
    requireDeposit: true,
  },
  {
    customerId: 'cust-4',
    customerName: 'ชลิตา วงศ์สวรรค์',
    customerPhone: '086-777-9900',
    lineUserId: null,
    marketingStatus: 'OPTED_IN',
    totalBookings: 4,
    noShowCount: 2,
    noShowRate: 50.0,
    totalLostRevenueMinor: 110000,
    lastNoShowAt: '2026-08-10T11:00:00Z',
    riskBadge: 'HIGH_RISK',
    requireDeposit: true,
  },
];

// Mock day of week distribution
const MOCK_DAYS: NoShowByDayOfWeekItem[] = [
  { dayOfWeek: 0, dayName: 'วันอาทิตย์', noShowCount: 5, totalBookings: 52, noShowRate: 9.6, lostRevenueMinor: 325000 },
  { dayOfWeek: 1, dayName: 'วันจันทร์', noShowCount: 1, totalBookings: 24, noShowRate: 4.2, lostRevenueMinor: 65000 },
  { dayOfWeek: 2, dayName: 'วันอังคาร', noShowCount: 2, totalBookings: 28, noShowRate: 7.1, lostRevenueMinor: 130000 },
  { dayOfWeek: 3, dayName: 'วันพุธ', noShowCount: 1, totalBookings: 26, noShowRate: 3.8, lostRevenueMinor: 65000 },
  { dayOfWeek: 4, dayName: 'วันพฤหัสบดี', noShowCount: 2, totalBookings: 30, noShowRate: 6.7, lostRevenueMinor: 130000 },
  { dayOfWeek: 5, dayName: 'วันศุกร์', noShowCount: 3, totalBookings: 38, noShowRate: 7.9, lostRevenueMinor: 195000 },
  { dayOfWeek: 6, dayName: 'วันเสาร์', noShowCount: 4, totalBookings: 50, noShowRate: 8.0, lostRevenueMinor: 260000 },
];

// Mock services breakdown
const MOCK_SERVICES: NoShowByServiceItem[] = [
  { serviceId: 'srv-1', serviceName: 'อาบน้ำตัดขนสุนัขพันธุ์ใหญ่ (Full Grooming Large)', totalBookings: 35, noShowCount: 6, noShowRate: 17.1, lostRevenueMinor: 510000, lostMinutes: 720 },
  { serviceId: 'srv-2', serviceName: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming Small)', totalBookings: 90, noShowCount: 5, noShowRate: 5.6, lostRevenueMinor: 325000, lostMinutes: 450 },
  { serviceId: 'srv-3', serviceName: 'อาบน้ำเป่าขนแมว (Cat Bath & Dry)', totalBookings: 65, noShowCount: 4, noShowRate: 6.2, lostRevenueMinor: 180000, lostMinutes: 240 },
  { serviceId: 'srv-4', serviceName: 'สปาแช่น้ำอุ่นไมโครบับเบิ้ล (Microbubble Spa)', totalBookings: 30, noShowCount: 2, noShowRate: 6.7, lostRevenueMinor: 100000, lostMinutes: 120 },
  { serviceId: 'srv-5', serviceName: 'ตัดเล็บ เช็ดหู ไถเท้า (Basic Hygiene Care)', totalBookings: 28, noShowCount: 1, noShowRate: 3.6, lostRevenueMinor: 55000, lostMinutes: 30 },
];

// Mock no-show appointments log
const MOCK_APPOINTMENTS: NoShowAppointmentItem[] = [
  {
    id: 'apt-1',
    branchId: 'b1',
    branchName: 'สาขาทองหล่อ (Thonglor)',
    startAt: '2026-08-26T14:00:00Z',
    endAt: '2026-08-26T15:30:00Z',
    customerId: 'cust-1',
    customerName: 'กิตติศักดิ์ มีชัย',
    customerPhone: '081-111-2222',
    lineUserId: 'U111222',
    petId: 'p1',
    petName: 'ชาโคล (Charcoal)',
    species: 'DOG',
    breed: 'Poodle Toy',
    serviceId: 'srv-2',
    serviceName: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming Small)',
    servicePriceMinor: 65000,
    durationMinutes: 90,
    staffId: 'st-1',
    staffName: 'สมชาย ช่างทอง',
    noShowReason: 'โทรติดต่อ 3 ครั้งไม่มีผู้รับสาย ช่างรอจนเกิน 30 นาที',
    notes: 'ลูกค้าเคยผิดนัดมาแล้ว 2 ครั้ง',
    hasSubsequentBooking: false,
  },
  {
    id: 'apt-2',
    branchId: 'b1',
    branchName: 'สาขาทองหล่อ (Thonglor)',
    startAt: '2026-08-24T10:00:00Z',
    endAt: '2026-08-24T12:00:00Z',
    customerId: 'cust-2',
    customerName: 'วราภรณ์ แสงทอง',
    customerPhone: '089-333-4455',
    lineUserId: 'U333444',
    petId: 'p2',
    petName: 'บิ๊กเบิ้ม (Big)',
    species: 'DOG',
    breed: 'Golden Retriever',
    serviceId: 'srv-1',
    serviceName: 'อาบน้ำตัดขนสุนัขพันธุ์ใหญ่ (Full Grooming Large)',
    servicePriceMinor: 85000,
    durationMinutes: 120,
    staffId: 'st-2',
    staffName: 'อนุชา กรูมมิ่ง',
    noShowReason: 'ส่ง LINE แจ้งเตือนแล้วแต่ไม่มาตามนัด',
    notes: null,
    hasSubsequentBooking: false,
  },
  {
    id: 'apt-3',
    branchId: 'b1',
    branchName: 'สาขาทองหล่อ (Thonglor)',
    startAt: '2026-08-22T16:00:00Z',
    endAt: '2026-08-22T17:00:00Z',
    customerId: 'cust-3',
    customerName: 'ธนินท์ รัตนกุล',
    customerPhone: '084-555-6677',
    lineUserId: 'U555666',
    petId: 'p3',
    petName: 'ส้มจี๊ด (Somjeed)',
    species: 'CAT',
    breed: 'Scottish Fold',
    serviceId: 'srv-3',
    serviceName: 'อาบน้ำเป่าขนแมว (Cat Bath & Dry)',
    servicePriceMinor: 45000,
    durationMinutes: 60,
    staffId: 'st-1',
    staffName: 'สมชาย ช่างทอง',
    noShowReason: 'ติดธุระด่วนแต่ไม่ได้โทรแจ้งล่วงหน้า',
    notes: null,
    hasSubsequentBooking: true,
  },
];

export default function NoShowReportPage() {
  const [dateRange, setDateRange] = useState<'30D' | '7D' | '90D' | 'YTD'>('30D');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOffender, setActiveOffender] = useState<NoShowByCustomerItem | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositSaved, setDepositSaved] = useState(false);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return MOCK_APPOINTMENTS.filter((apt) => {
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        apt.customerName.toLowerCase().includes(s) ||
        apt.customerPhone.includes(s) ||
        apt.petName.toLowerCase().includes(s) ||
        apt.serviceName.toLowerCase().includes(s)
      );
    });
  }, [searchTerm]);

  const handleToggleDeposit = (offender: NoShowByCustomerItem) => {
    setActiveOffender(offender);
    setIsDepositModalOpen(true);
    setDepositSaved(false);
  };

  const handleConfirmDeposit = () => {
    setDepositSaved(true);
    setTimeout(() => {
      setIsDepositModalOpen(false);
      setDepositSaved(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/retention" className="hover:text-slate-900 dark:hover:text-white">
          รายงาน & วิเคราะห์ (Reports & Analytics)
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-rose-600 dark:text-rose-400 font-bold">
          รายงานการไม่มาตามนัด (No-Show Analytics)
        </span>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              รายงานการไม่มาตามนัดและสูญเสียรายได้ (No-Show Report)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              <UserX className="w-3 h-3 text-rose-600" /> Revenue Loss Tracker
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            วิเคราะห์อัตราการผิดนัดของลูกค้า มูลค่ารายได้ที่เสียโอกาส และตั้งค่านโยบายมัดจำล่วงหน้าเพื่อป้องกันคิวว่าง
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setDateRange('7D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '7D'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7 วัน
            </button>
            <button
              onClick={() => setDateRange('30D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '30D'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              30 วันล่าสุด
            </button>
            <button
              onClick={() => setDateRange('90D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '90D'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              90 วัน
            </button>
            <button
              onClick={() => setDateRange('YTD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === 'YTD'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ปีนี้ (YTD)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* No-show rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              อัตราการไม่มาตามนัด (No-Show Rate)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {MOCK_SUMMARY.noShowRate}%
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({MOCK_SUMMARY.noShowCount}/{MOCK_SUMMARY.totalAppointments} นัด)
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              เกณฑ์มาตรฐานอุตสาหกรรม &lt; 5.0%
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Lost revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              มูลค่ารายได้ที่สูญเสีย (Lost Revenue)
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              ฿{(MOCK_SUMMARY.totalLostRevenueMinor / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              เฉลี่ย ฿{(MOCK_SUMMARY.averageLostPerNoShowMinor / 100).toLocaleString('th-TH')} / นัด
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Lost capacity hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              เวลาช่างที่สูญเปล่า (Lost Capacity)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {(MOCK_SUMMARY.lostCapacityMinutes / 60).toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-500">ชั่วโมง</span>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 inline-block">
              คิวช่างว่างโดยไม่ได้รายได้
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Repeat offenders */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ลูกค้าผิดนัดซ้ำซ้อน (Repeat Offenders)
            </span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {MOCK_SUMMARY.repeatOffendersCount}{' '}
              <span className="text-sm font-normal text-slate-500">ราย (&ge; 2 ครั้ง)</span>
            </div>
            <span className="text-xs text-purple-600 font-medium mt-1 inline-block">
              แนะนำให้เก็บเงินมัดจำล่วงหน้า
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Breakdown Cards: Day of Week & Service Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Day of Week Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  อัตรา No-Show แยกตามวันในสัปดาห์ (By Day of Week)
                </h3>
                <p className="text-xs text-slate-500">วันหยุดสุดสัปดาห์มีแนวโน้มผิดนัดสูงสุด</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {MOCK_DAYS.map((d) => (
              <div key={d.dayOfWeek} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{d.dayName}</span>
                  <span className="text-slate-500">
                    <span className="font-bold text-rose-600">{d.noShowCount} ครั้ง</span> ({d.noShowRate}%) • ฿{(d.lostRevenueMinor / 100).toLocaleString('th-TH')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      d.noShowRate >= 8 ? 'bg-rose-500' : d.noShowRate >= 5 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, d.noShowRate * 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                <Scissors className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  บริการที่ถูกผิดนัดสูงสุด (No-Show by Service)
                </h3>
                <p className="text-xs text-slate-500">บริการที่กินเวลาช่างมากและมีความเสียหายสูง</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_SERVICES.map((srv) => (
              <div key={srv.serviceId} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {srv.serviceName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ผิดนัด {srv.noShowCount} จาก {srv.totalBookings} นัด ({srv.noShowRate}%) • สูญเสีย {srv.lostMinutes / 60} ชม.
                  </div>
                </div>
                <div className="text-right font-extrabold text-rose-600 dark:text-rose-400">
                  ฿{(srv.lostRevenueMinor / 100).toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Repeat Offenders & Deposit Protection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                ลูกค้าที่ผิดนัดซ้ำซ้อนและการจัดการเงินมัดจำ (Frequent Offenders & Deposit Policy)
              </h3>
              <p className="text-xs text-slate-500">
                ตั้งค่านโยบายเก็บมัดจำล่วงหน้า 50% หรือตัดสิทธิ์จองออนไลน์เพื่อลดความเสี่ยง
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">ชื่อลูกค้า & เบอร์โทร</th>
                <th className="py-3 px-4 text-center">จำนวนที่จอง</th>
                <th className="py-3 px-4 text-center">จำนวนที่ No-Show</th>
                <th className="py-3 px-4 text-center">อัตรา % No-Show</th>
                <th className="py-3 px-4 text-right">มูลค่าที่ทำให้สูญเสีย</th>
                <th className="py-3 px-4 text-center">ระดับความเสี่ยง</th>
                <th className="py-3 px-4 text-center">เงื่อนไขมัดจำ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {MOCK_OFFENDERS.map((offender) => (
                <tr key={offender.customerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{offender.customerName}</div>
                    <div className="text-[11px] font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {offender.customerPhone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                    {offender.totalBookings} ครั้ง
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                    {offender.noShowCount} ครั้ง
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                      {offender.noShowRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                    ฿{(offender.totalLostRevenueMinor / 100).toLocaleString('th-TH')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${
                        offender.riskBadge === 'HIGH_RISK'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}
                    >
                      {offender.riskBadge === 'HIGH_RISK' ? 'เสี่ยงสูง (High Risk)' : 'ปานกลาง'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {offender.requireDeposit ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> บังคับมัดจำ 50%
                      </span>
                    ) : (
                      <span className="text-slate-400">ปกติ</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleDeposit(offender)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
                    >
                      ตั้งค่านโยบาย
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed No-Show Appointments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              ประวัติการผิดนัดรายครั้ง (No-Show Appointment Log)
            </h3>
            <p className="text-xs text-slate-500">บันทึกเหตุผล ช่างผู้รับผิดชอบ และประวัติการติดต่อ</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, สัตว์เลี้ยง, บริการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">วัน & เวลานัด</th>
                <th className="py-3 px-4">ลูกค้า & สัตว์เลี้ยง</th>
                <th className="py-3 px-4">บริการที่นัด & ช่าง</th>
                <th className="py-3 px-4 text-right">มูลค่าสูญเสีย</th>
                <th className="py-3 px-4">สาเหตุการผิดนัด / หมายเหตุ</th>
                <th className="py-3 px-4 text-center">นัดหมายใหม่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <div>
                      {new Date(apt.startAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {new Date(apt.startAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      น.
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {apt.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>{apt.species === 'DOG' ? '🐶' : '🐱'}</span>
                      <span>{apt.petName}</span>
                      <span>({apt.customerPhone})</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {apt.serviceName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ช่าง: {apt.staffName || 'ไม่ระบุ'} ({apt.durationMinutes} นาที)
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                    ฿{(apt.servicePriceMinor / 100).toLocaleString('th-TH')}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-slate-700 dark:text-slate-300">
                      {apt.noShowReason}
                    </div>
                    {apt.notes && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        หมายเหตุ: {apt.notes}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {apt.hasSubsequentBooking ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> จองใหม่แล้ว
                      </span>
                    ) : (
                      <span className="text-slate-400">ยังไม่กลับมา</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Policy Modal */}
      {isDepositModalOpen && activeOffender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ตั้งค่านโยบายเงินมัดจำ (Deposit Policy)
                  </h3>
                  <p className="text-xs text-slate-500">ลูกค้า: {activeOffender.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs space-y-1 text-rose-800 dark:text-rose-300">
              <div className="font-bold">⚠️ ประวัติการผิดนัด:</div>
              <div>• ผิดนัดทั้งหมด {activeOffender.noShowCount} ครั้ง จากการจอง {activeOffender.totalBookings} ครั้ง ({activeOffender.noShowRate}%)</div>
              <div>• สร้างความเสียหายสะสม ฿{(activeOffender.totalLostRevenueMinor / 100).toLocaleString('th-TH')}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  นโยบายการจองล่วงหน้าสำหรับลูกค้ารายนี้:
                </label>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                  <option value="50">🔒 บังคับชำระเงินมัดจำ 50% ก่อนยืนยันคิว</option>
                  <option value="100">🔒 บังคับชำระค่าบริการล่วงหน้าเต็มจำนวน 100%</option>
                  <option value="BLOCK">🚫 ปิดสิทธิ์การจองคิวออนไลน์ (ต้องโทรจองเท่านั้น)</option>
                  <option value="NONE">🔓 ไม่บังคับมัดจำ (ปลดล็อก)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ข้อความแจ้งเตือนอัตโนมัติเมื่อลูกค้าจองคิว:
                </label>
                <textarea
                  rows={2}
                  defaultValue="เพื่อรักษาสิทธิ์คิวบริการกรูมมิ่ง กรุณาชำระเงินมัดจำล่วงหน้า 50% ภายใน 2 ชั่วโมงหลังทำการจอง ขอบคุณครับ"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {depositSaved ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> บันทึกนโยบายเงินมัดจำเรียบร้อยแล้ว!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeposit}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition active:scale-95"
                >
                  บันทึกเงื่อนไข
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

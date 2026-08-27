'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  UserCheck,
  AlertTriangle,
  UserX,
  Users,
  Search,
  ArrowUpDown,
  Filter,
  Phone,
  MessageSquare,
  Calendar,
  ChevronRight,
  TrendingUp,
  Receipt,
  Clock,
  Send,
  Eye,
  SlidersHorizontal,
  X,
  CheckCircle2,
  DollarSign,
  Scissors,
  Syringe,
  Megaphone,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { CustomerSegment, SegmentedCustomerItem, CustomerSegmentSummary } from '@petflow/types';

// Mock segmented customer data for web UI showcase
const MOCK_CUSTOMERS: SegmentedCustomerItem[] = [
  {
    id: 'c-vip-1',
    tenantId: 't1',
    firstName: 'กนกวรรณ',
    lastName: 'รักดี',
    fullName: 'กนกวรรณ รักดี',
    phone: '089-111-2233',
    email: 'kanokwan@gmail.com',
    lineUserId: 'U123456789',
    marketingStatus: 'OPTED_IN',
    segment: 'VIP',
    segmentReason: 'ยอดใช้จ่ายสะสม 18,500 บาท (เข้าใช้บริการ 8 ครั้ง)',
    registeredAt: '2026-01-10T10:00:00Z',
    daysSinceRegistration: 229,
    lastVisitAt: '2026-08-20T14:00:00Z',
    daysSinceLastVisit: 7,
    totalVisits: 8,
    totalSpentMinor: 1850000,
    averageTicketMinor: 231250,
    petCount: 2,
    pets: [
      { id: 'p1', name: 'โมจิ (Mochi)', species: 'DOG', breed: 'Pomeranian' },
      { id: 'p2', name: 'ชาโคล (Charcoal)', species: 'CAT', breed: 'British Shorthair' },
    ],
  },
  {
    id: 'c-vip-2',
    tenantId: 't1',
    firstName: 'ธนากร',
    lastName: 'สุขสวัสดิ์',
    fullName: 'ธนากร สุขสวัสดิ์',
    phone: '081-444-5566',
    email: 'thanakorn@hotmail.com',
    lineUserId: 'U987654321',
    marketingStatus: 'OPTED_IN',
    segment: 'VIP',
    segmentReason: 'ยอดใช้จ่ายสะสม 12,200 บาท (เข้าใช้บริการ 6 ครั้ง)',
    registeredAt: '2026-02-15T09:00:00Z',
    daysSinceRegistration: 193,
    lastVisitAt: '2026-08-15T11:30:00Z',
    daysSinceLastVisit: 12,
    totalVisits: 6,
    totalSpentMinor: 1220000,
    averageTicketMinor: 203333,
    petCount: 1,
    pets: [{ id: 'p3', name: 'ลัคกี้ (Lucky)', species: 'DOG', breed: 'Golden Retriever' }],
  },
  {
    id: 'c-new-1',
    tenantId: 't1',
    firstName: 'ณัฐชา',
    lastName: 'พงษ์พาณิชย์',
    fullName: 'ณัฐชา พงษ์พาณิชย์',
    phone: '082-999-8877',
    email: 'natcha.p@gmail.com',
    lineUserId: 'U33445566',
    marketingStatus: 'OPTED_IN',
    segment: 'NEW',
    segmentReason: 'ลงทะเบียนใหม่ 12 วันที่แล้ว (มาใช้บริการครั้งแรก)',
    registeredAt: '2026-08-15T10:30:00Z',
    daysSinceRegistration: 12,
    lastVisitAt: '2026-08-18T16:00:00Z',
    daysSinceLastVisit: 9,
    totalVisits: 1,
    totalSpentMinor: 65000,
    averageTicketMinor: 65000,
    petCount: 1,
    pets: [{ id: 'p4', name: 'ชิโร่ (Shiro)', species: 'DOG', breed: 'Samoyed' }],
  },
  {
    id: 'c-new-2',
    tenantId: 't1',
    firstName: 'พงศกร',
    lastName: 'ตันติวิจิตร',
    fullName: 'พงศกร ตันติวิจิตร',
    phone: '083-222-1100',
    email: null,
    lineUserId: null,
    marketingStatus: 'OPTED_IN',
    segment: 'NEW',
    segmentReason: 'ลงทะเบียนใหม่ 5 วันที่แล้ว (ยังไม่เคยเข้ารับบริการ)',
    registeredAt: '2026-08-22T08:00:00Z',
    daysSinceRegistration: 5,
    lastVisitAt: null,
    daysSinceLastVisit: null,
    totalVisits: 0,
    totalSpentMinor: 0,
    averageTicketMinor: 0,
    petCount: 1,
    pets: [{ id: 'p5', name: 'นมสด (Nomsod)', species: 'CAT', breed: 'Munchkin' }],
  },
  {
    id: 'c-active-1',
    tenantId: 't1',
    firstName: 'พิมพิศา',
    lastName: 'ว่องวิทย์',
    fullName: 'พิมพิศา ว่องวิทย์',
    phone: '086-777-8899',
    email: 'pimpisa@yahoo.com',
    lineUserId: 'U77889900',
    marketingStatus: 'OPTED_IN',
    segment: 'ACTIVE',
    segmentReason: 'มาใช้บริการล่าสุดเมื่อ 21 วันที่แล้ว (รวม 4 ครั้ง)',
    registeredAt: '2026-03-20T14:00:00Z',
    daysSinceRegistration: 160,
    lastVisitAt: '2026-08-06T15:00:00Z',
    daysSinceLastVisit: 21,
    totalVisits: 4,
    totalSpentMinor: 380000,
    averageTicketMinor: 95000,
    petCount: 2,
    pets: [
      { id: 'p6', name: 'ส้มตำ (Somtam)', species: 'CAT', breed: 'Thai Domestic' },
      { id: 'p7', name: 'ข้าวเหนียว (Khao Niew)', species: 'CAT', breed: 'Scottish Fold' },
    ],
  },
  {
    id: 'c-risk-1',
    tenantId: 't1',
    firstName: 'วิชัย',
    lastName: 'เมธากุล',
    fullName: 'วิชัย เมธากุล',
    phone: '085-333-2211',
    email: 'wichai.m@gmail.com',
    lineUserId: 'U555666777',
    marketingStatus: 'OPTED_IN',
    segment: 'AT_RISK',
    segmentReason: 'ไม่ได้มาใช้บริการ 74 วัน (เกินเกณฑ์ปกติ 60 วัน)',
    registeredAt: '2026-02-01T11:00:00Z',
    daysSinceRegistration: 207,
    lastVisitAt: '2026-06-14T10:00:00Z',
    daysSinceLastVisit: 74,
    totalVisits: 3,
    totalSpentMinor: 240000,
    averageTicketMinor: 80000,
    petCount: 1,
    pets: [{ id: 'p8', name: 'บัดดี้ (Buddy)', species: 'DOG', breed: 'French Bulldog' }],
  },
  {
    id: 'c-risk-2',
    tenantId: 't1',
    firstName: 'อรอนงค์',
    lastName: 'แซ่ลิ้ม',
    fullName: 'อรอนงค์ แซ่ลิ้ม',
    phone: '087-654-3210',
    email: 'oranong@hotmail.com',
    lineUserId: null,
    marketingStatus: 'OPTED_IN',
    segment: 'AT_RISK',
    segmentReason: 'ไม่ได้มาใช้บริการ 95 วัน (เกินเกณฑ์ปกติ 60 วัน)',
    registeredAt: '2026-01-20T09:30:00Z',
    daysSinceRegistration: 219,
    lastVisitAt: '2026-05-24T13:00:00Z',
    daysSinceLastVisit: 95,
    totalVisits: 2,
    totalSpentMinor: 180000,
    averageTicketMinor: 90000,
    petCount: 1,
    pets: [{ id: 'p9', name: 'คุ๊กกี้ (Cookie)', species: 'DOG', breed: 'Shih Tzu' }],
  },
  {
    id: 'c-lost-1',
    tenantId: 't1',
    firstName: 'ชูเกียรติ',
    lastName: 'ศิริผล',
    fullName: 'ชูเกียรติ ศิริผล',
    phone: '089-888-7766',
    email: null,
    lineUserId: null,
    marketingStatus: 'OPTED_OUT',
    segment: 'LOST',
    segmentReason: 'ไม่กลับมาใช้บริการนานกว่า 165 วัน (เกินเกณฑ์ 120 วัน)',
    registeredAt: '2025-11-10T10:00:00Z',
    daysSinceRegistration: 290,
    lastVisitAt: '2026-03-15T11:00:00Z',
    daysSinceLastVisit: 165,
    totalVisits: 2,
    totalSpentMinor: 150000,
    averageTicketMinor: 75000,
    petCount: 1,
    pets: [{ id: 'p10', name: 'ด่าง (Dang)', species: 'DOG', breed: 'Thai Ridgeback' }],
  },
];

const SEGMENT_CONFIG: Record<
  CustomerSegment,
  {
    title: string;
    badgeColor: string;
    borderActive: string;
    bgHover: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    actionLabel: string;
  }
> = {
  VIP: {
    title: 'ลูกค้า VIP',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    bgHover: 'hover:border-amber-300',
    icon: Crown,
    accentColor: '#f59e0b',
    actionLabel: 'มอบสิทธิพิเศษ VIP',
  },
  NEW: {
    title: 'ลูกค้าใหม่ (New)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    bgHover: 'hover:border-emerald-300',
    icon: Sparkles,
    accentColor: '#10b981',
    actionLabel: 'ส่งคูปองต้อนรับ',
  },
  ACTIVE: {
    title: 'ลูกค้าปกติ (Active)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    bgHover: 'hover:border-blue-300',
    icon: UserCheck,
    accentColor: '#0071e3',
    actionLabel: 'ส่งข้อความทักทาย',
  },
  AT_RISK: {
    title: 'กลุ่มเสี่ยงหาย (At-Risk)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    bgHover: 'hover:border-rose-300',
    icon: AlertTriangle,
    accentColor: '#f43f5e',
    actionLabel: 'ส่งโปรโมชั่นดึงดูดกลับ',
  },
  LOST: {
    title: 'ลูกค้าที่หายไป (Lost)',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    borderActive: 'border-slate-500 ring-2 ring-slate-500/20',
    bgHover: 'hover:border-slate-400',
    icon: UserX,
    accentColor: '#64748b',
    actionLabel: 'แคมเปญ Win-Back',
  },
};

export default function RetentionPage() {
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<SegmentedCustomerItem | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Calculate Segment Summaries
  const summaries = useMemo(() => {
    const total = MOCK_CUSTOMERS.length;
    const totalRev = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.totalSpentMinor, 0);

    const counts: Record<CustomerSegment, { count: number; revMinor: number }> = {
      VIP: { count: 0, revMinor: 0 },
      NEW: { count: 0, revMinor: 0 },
      ACTIVE: { count: 0, revMinor: 0 },
      AT_RISK: { count: 0, revMinor: 0 },
      LOST: { count: 0, revMinor: 0 },
    };

    for (const c of MOCK_CUSTOMERS) {
      counts[c.segment].count += 1;
      counts[c.segment].revMinor += c.totalSpentMinor;
    }

    return { total, totalRev, counts };
  }, []);

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter((customer) => {
      const matchSegment = selectedSegment === 'ALL' || customer.segment === selectedSegment;
      const s = searchTerm.toLowerCase().trim();
      const matchSearch =
        !s ||
        customer.fullName.toLowerCase().includes(s) ||
        customer.phone.includes(s) ||
        (customer.email && customer.email.toLowerCase().includes(s)) ||
        customer.pets.some((p: { name: string; breed?: string | null }) => p.name.toLowerCase().includes(s) || (p.breed && p.breed.toLowerCase().includes(s)));

      return matchSegment && matchSearch;
    });
  }, [selectedSegment, searchTerm]);

  const handleSendCampaign = (customer: SegmentedCustomerItem) => {
    setActiveCustomer(customer);
    setIsActionModalOpen(true);
    setActionSuccess(false);
  };

  const executeSend = () => {
    setActionSuccess(true);
    setTimeout(() => {
      setIsActionModalOpen(false);
      setActionSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              การรักษาฐานลูกค้าและการแบ่งกลุ่ม (Retention & CRM)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3] border border-blue-200/60 dark:border-blue-800/60">
              <Sparkles className="w-3 h-3" /> RFM Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            วิเคราะห์พฤติกรรมการใช้บริการ ความถี่ และยอดใช้จ่าย (Recency, Frequency, Monetary) เพื่อดึงดูดลูกค้ากลับมาใช้ซ้ำ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/retention/grooming-due"
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 hover:bg-blue-100/70 text-[#0071e3] dark:text-blue-400 font-medium text-xs px-3.5 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <Scissors className="w-4 h-4 text-[#0071e3]" />
            รอบกรูมมิ่ง (Due)
          </Link>

          <Link
            href="/retention/vaccine-due"
            className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100/70 text-emerald-700 dark:text-emerald-400 font-medium text-xs px-3.5 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <Syringe className="w-4 h-4 text-emerald-600" />
            รอบวัคซีน (Vaccine)
          </Link>

          <Link
            href="/retention/campaigns"
            className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100/70 text-purple-700 dark:text-purple-400 font-medium text-xs px-3.5 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <Megaphone className="w-4 h-4 text-purple-600" />
            แคมเปญ Win-Back
          </Link>

          <Link
            href="/customers"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium text-xs px-3.5 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <Users className="w-4 h-4 text-slate-500" />
            ลูกค้าทั้งหมด
          </Link>
        </div>
      </div>

      {/* 5 Segment KPI Cards (Interactive Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(SEGMENT_CONFIG) as CustomerSegment[]).map((seg) => {
          const config = SEGMENT_CONFIG[seg];
          const Icon = config.icon;
          const stat = summaries.counts[seg];
          const isSelected = selectedSegment === seg;
          const pct = summaries.total > 0 ? Math.round((stat.count / summaries.total) * 100) : 0;

          return (
            <button
              key={seg}
              onClick={() => setSelectedSegment(isSelected ? 'ALL' : seg)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-apple flex flex-col justify-between ${
                isSelected
                  ? config.borderActive + ' shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 ' + config.bgHover
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: config.accentColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {pct}% ของลูกค้า
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {config.title}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.count}
                  </span>
                  <span className="text-xs text-slate-500">ท่าน</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>ยอดรวม:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ฿{(stat.revMinor / 100).toLocaleString('th-TH')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Segment Pill Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedSegment('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedSegment === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({summaries.total})
          </button>
          {(Object.keys(SEGMENT_CONFIG) as CustomerSegment[]).map((seg) => {
            const count = summaries.counts[seg].count;
            return (
              <button
                key={seg}
                onClick={() => setSelectedSegment(seg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedSegment === seg
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {SEGMENT_CONFIG[seg].title} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์โทร, สัตว์เลี้ยง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">ลูกค้า & สัตว์เลี้ยง</th>
                <th className="py-3.5 px-4">กลุ่มลูกค้า (Segment)</th>
                <th className="py-3.5 px-4 text-center">เข้าใช้บริการล่าสุด (Recency)</th>
                <th className="py-3.5 px-4 text-center">จำนวนครั้ง (Frequency)</th>
                <th className="py-3.5 px-4 text-right">ยอดใช้จ่ายสะสม (Monetary)</th>
                <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลลูกค้าในกลุ่มนี้</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองกลุ่มลูกค้า</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const segConfig = SEGMENT_CONFIG[customer.segment];
                  const Icon = segConfig.icon;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer & Pets */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {customer.fullName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                          </span>
                          {customer.lineUserId && (
                            <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-medium">
                              LINE Connected
                            </span>
                          )}
                        </div>
                        {/* Pet Badges */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {customer.pets.map((pet: { id: string; name: string; species: string; breed?: string | null }) => (
                            <span
                              key={pet.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              🐾 {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Segment & Reason */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${segConfig.badgeColor}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {segConfig.title}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                          {customer.segmentReason}
                        </p>
                      </td>

                      {/* Recency */}
                      <td className="py-3.5 px-4 text-center">
                        {customer.lastVisitAt ? (
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {customer.daysSinceLastVisit === 0
                                ? 'วันนี้'
                                : `${customer.daysSinceLastVisit} วันที่แล้ว`}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {new Date(customer.lastVisitAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ยังไม่เคยมา</span>
                        )}
                      </td>

                      {/* Frequency */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {customer.totalVisits} ครั้ง
                        </span>
                      </td>

                      {/* Monetary */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ฿{(customer.totalSpentMinor / 100).toLocaleString('th-TH')}
                        </div>
                        {customer.totalVisits > 0 && (
                          <div className="text-[10px] text-slate-400">
                            เฉลี่ย ฿{(customer.averageTicketMinor / 100).toLocaleString('th-TH')}/ครั้ง
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendCampaign(customer)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] transition active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {segConfig.actionLabel}
                          </button>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                            title="ดูโปรไฟล์ลูกค้า"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign / Action Trigger Modal */}
      {isActionModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ส่งข้อความ / สิทธิพิเศษ (Retention Action)
                  </h3>
                  <p className="text-xs text-slate-500">สำหรับคุณ {activeCustomer.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">กลุ่มลูกค้า:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {SEGMENT_CONFIG[activeCustomer.segment].title}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ช่องทางการส่ง:</span>
                <span className="font-semibold text-emerald-600">
                  {activeCustomer.lineUserId ? 'LINE Push Message' : 'SMS / เบอร์โทรศัพท์'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">เหตุผลในการส่ง:</span>
                <span className="text-slate-700 dark:text-slate-300">{activeCustomer.segmentReason}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ข้อความ / โปรโมชั่นแนะนำ:
              </label>
              <textarea
                rows={3}
                defaultValue={
                  activeCustomer.segment === 'VIP'
                    ? `สวัสดีครับคุณ ${activeCustomer.firstName} ทาง PetFlow มอบส่วนลดพิเศษ 15% สำหรับบริการกรูมมิ่งสัตว์เลี้ยงในสัปดาห์นี้เพื่อขอบคุณที่เป็นลูกค้าคนสำคัญของเราครับ`
                    : activeCustomer.segment === 'AT_RISK'
                    ? `สวัสดีครับคุณ ${activeCustomer.firstName} ทาง PetFlow คิดถึงน้อง ${activeCustomer.pets[0]?.name || ''} มากเลยครับ รับส่วนลด 100 บาทเมื่อนัดหมายอาบน้ำตัดขนภายในเดือนนี้ครับ`
                    : `สวัสดีครับคุณ ${activeCustomer.firstName} ทาง PetFlow ยินดีให้บริการครับ นัดหมายหรือสอบถามข้อมูลเพิ่มเติมได้เลยนะครับ`
                }
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            {actionSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ส่งข้อความ Retention เรียบร้อยแล้ว!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={executeSend}
                  className="px-4 py-2 text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl shadow-sm shadow-blue-500/25 transition active:scale-95"
                >
                  ยืนยันการส่งข้อความ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

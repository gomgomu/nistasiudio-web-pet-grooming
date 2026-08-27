'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  SlidersHorizontal,
  X,
  Send,
  UserCheck,
  TrendingUp,
  Flame,
  CalendarCheck,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { GroomingDueStatus, GroomingDuePetItem, GroomingDueRules } from '@petflow/types';

// Mock grooming due pet items for web UI showcase
const MOCK_GROOMING_DUE_PETS: GroomingDuePetItem[] = [
  {
    petId: 'pet-1',
    petName: 'โมจิ (Mochi)',
    species: 'DOG',
    breed: 'Pomeranian',
    photoUrl: null,
    specialRequirements: 'ผิวแพ้ง่าย ใช้แชมพูสูตรอ่อนโยน',
    customerId: 'c-1',
    customerName: 'กนกวรรณ รักดี',
    customerPhone: '089-111-2233',
    lineUserId: 'U123456789',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-08-04T14:00:00Z',
    lastServiceName: 'กรูมมิ่งตัดแต่งขนสุนัขพันธุ์เล็ก',
    daysSinceLastGrooming: 23,
    cycleDays: 28,
    isPersonalizedCycle: false,
    totalGroomingVisits: 8,
    nextGroomingDueAt: '2026-09-01T14:00:00Z',
    daysDifference: -5, // 5 days left until due
    dueStatus: 'UPCOMING',
    dueStatusText: 'ใกล้ถึงกำหนด (ใน 5 วัน)',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 55000,
    recommendedMessage: 'สวัสดีครับคุณ กนกวรรณ อีก 5 วันจะครบกำหนดกรูมมิ่งน้อง โมจิ แล้วนะครับ จองคิวล่วงหน้าเพื่อเลือกเวลากับช่างประจำได้เลยครับ ✨',
  },
  {
    petId: 'pet-2',
    petName: 'คุกกี้ (Cookie)',
    species: 'DOG',
    breed: 'Bichon Frise',
    photoUrl: null,
    specialRequirements: 'ตัดทรงกลมเกาหลี',
    customerId: 'c-2',
    customerName: 'อรอนงค์ แซ่ลิ้ม',
    customerPhone: '087-654-3210',
    lineUserId: 'U987654321',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-08-06T11:00:00Z',
    lastServiceName: 'สปาและตัดแต่งขน Bichon',
    daysSinceLastGrooming: 21,
    cycleDays: 21, // Personalized cycle
    isPersonalizedCycle: true,
    totalGroomingVisits: 5,
    nextGroomingDueAt: '2026-08-27T11:00:00Z',
    daysDifference: 0, // Due today
    dueStatus: 'DUE_NOW',
    dueStatusText: 'ถึงกำหนดกรูมมิ่งแล้ว (วันนี้)',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 85000,
    recommendedMessage: 'สวัสดีครับคุณ อรอนงค์ น้อง คุกกี้ ถึงรอบกรูมมิ่งทรงกลมประจำรอบ 21 วันแล้วนะครับ สะดวกพามาวันไหนสามารถนัดหมายเวลาได้เลยครับ 🐶🛁',
  },
  {
    petId: 'pet-3',
    petName: 'ลัคกี้ (Lucky)',
    species: 'DOG',
    breed: 'Golden Retriever',
    photoUrl: null,
    specialRequirements: 'ระวังข้อสะโพก',
    customerId: 'c-3',
    customerName: 'ธนากร สุขสวัสดิ์',
    customerPhone: '081-444-5566',
    lineUserId: 'U33445566',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-07-28T10:30:00Z',
    lastServiceName: 'อาบน้ำและสางขนสุนัขพันธุ์ใหญ่',
    daysSinceLastGrooming: 30,
    cycleDays: 28,
    isPersonalizedCycle: false,
    totalGroomingVisits: 6,
    nextGroomingDueAt: '2026-08-25T10:30:00Z',
    daysDifference: 2, // 2 days overdue -> DUE_NOW
    dueStatus: 'DUE_NOW',
    dueStatusText: 'ถึงกำหนดแล้ว (เลยมา 2 วัน)',
    hasFutureBooking: true,
    futureBookingAt: '2026-08-29T13:00:00Z',
    estimatedPriceMinor: 95000,
    recommendedMessage: 'สวัสดีครับคุณ ธนากร น้อง ลัคกี้ มีนัดหมายกรูมมิ่งล่วงหน้าในวันที่ 29 ส.ค. เรียบร้อยแล้ว แล้วพบกันนะครับ 🐾',
  },
  {
    petId: 'pet-4',
    petName: 'บัดดี้ (Buddy)',
    species: 'DOG',
    breed: 'French Bulldog',
    photoUrl: null,
    specialRequirements: 'เช็ดรอยพับหน้า เช็ดหูละเอียด',
    customerId: 'c-4',
    customerName: 'วิชัย เมธากุล',
    customerPhone: '085-333-2211',
    lineUserId: 'U555666777',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-07-14T15:00:00Z',
    lastServiceName: 'อาบน้ำสุนัขพันธุ์เล็ก + ขูดหินปูน',
    daysSinceLastGrooming: 44,
    cycleDays: 28,
    isPersonalizedCycle: false,
    totalGroomingVisits: 3,
    nextGroomingDueAt: '2026-08-11T15:00:00Z',
    daysDifference: 16, // 16 days overdue
    dueStatus: 'OVERDUE',
    dueStatusText: 'เกินกำหนด 16 วัน',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 45000,
    recommendedMessage: 'สวัสดีครับคุณ วิชัย น้อง บัดดี้ เลยรอบกรูมมิ่งมา 16 วันแล้วครับ เพื่อสุขภาพผิวหนังและรอยพับที่ดี จองคิวสัปดาห์นี้รับบริการตัดเล็บเช็ดหูฟรีครับ ✂️',
  },
  {
    petId: 'pet-5',
    petName: 'ส้มส้ม (Somsom)',
    species: 'CAT',
    breed: 'Persian',
    photoUrl: null,
    specialRequirements: 'ขนพันกันง่าย กลัวเสียงไดร์แรง',
    customerId: 'c-5',
    customerName: 'พิมพิศา ว่องวิทย์',
    customerPhone: '086-777-8899',
    lineUserId: 'U77889900',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-05-20T11:00:00Z',
    lastServiceName: 'สปากรูมมิ่งแมวขนยาว',
    daysSinceLastGrooming: 99,
    cycleDays: 45, // Cat cycle = 45 days
    isPersonalizedCycle: false,
    totalGroomingVisits: 4,
    nextGroomingDueAt: '2026-07-04T11:00:00Z',
    daysDifference: 54, // 54 days overdue (> 30 days -> CRITICAL_OVERDUE)
    dueStatus: 'CRITICAL_OVERDUE',
    dueStatusText: 'เกินกำหนดมาก 54 วัน',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 65000,
    recommendedMessage: 'สวัสดีครับคุณ พิมพิศา ทาง PetFlow คิดถึงน้อง ส้มส้ม มากเลยครับ ขนน้องอาจจะเริ่มสังกะตัง มอบส่วนลดพิเศษ 100 บาทสำหรับการนัดหมายกรูมมิ่งรอบนี้ครับ 💖',
  },
  {
    petId: 'pet-6',
    petName: 'ชาโคล (Charcoal)',
    species: 'CAT',
    breed: 'British Shorthair',
    photoUrl: null,
    specialRequirements: null,
    customerId: 'c-1',
    customerName: 'กนกวรรณ รักดี',
    customerPhone: '089-111-2233',
    lineUserId: 'U123456789',
    marketingStatus: 'OPTED_IN',
    lastGroomedAt: '2026-08-15T14:00:00Z',
    lastServiceName: 'อาบน้ำแปรงขนแมวสั้น',
    daysSinceLastGrooming: 12,
    cycleDays: 45,
    isPersonalizedCycle: false,
    totalGroomingVisits: 4,
    nextGroomingDueAt: '2026-09-29T14:00:00Z',
    daysDifference: -33, // 33 days left
    dueStatus: 'ON_TRACK',
    dueStatusText: 'ยังไม่ถึงกำหนด (เหลือ 33 วัน)',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 50000,
    recommendedMessage: 'สวัสดีครับคุณ กนกวรรณ ทางร้านยินดีให้บริการดูแลน้อง ชาโคล เสมอนะครับ 🐾',
  },
];

const STATUS_CONFIG: Record<
  GroomingDueStatus,
  {
    title: string;
    badgeColor: string;
    borderActive: string;
    accentColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  UPCOMING: {
    title: 'ใกล้ถึงกำหนด (ใน 7 วัน)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    accentColor: '#f59e0b',
    icon: Clock,
  },
  DUE_NOW: {
    title: 'ถึงกำหนดแล้ว (รอบสัปดาห์นี้)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    accentColor: '#0071e3',
    icon: Scissors,
  },
  OVERDUE: {
    title: 'เกินกำหนด (8-30 วัน)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    accentColor: '#f43f5e',
    icon: AlertTriangle,
  },
  CRITICAL_OVERDUE: {
    title: 'เกินกำหนดมาก (>30 วัน)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    accentColor: '#8b5cf6',
    icon: Flame,
  },
  ON_TRACK: {
    title: 'ยังไม่ถึงกำหนด (On Track)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    accentColor: '#10b981',
    icon: CheckCircle2,
  },
};

export default function GroomingDuePage() {
  const [selectedStatus, setSelectedStatus] = useState<GroomingDueStatus | 'ALL'>('ALL');
  const [speciesFilter, setSpeciesFilter] = useState<'ALL' | 'DOG' | 'CAT'>('ALL');
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'HAS_BOOKING' | 'NO_BOOKING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePet, setActivePet] = useState<GroomingDuePetItem | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Default editable rules
  const [rules, setRules] = useState<Required<GroomingDueRules>>({
    defaultIntervalDays: 30,
    dogIntervalDays: 28,
    catIntervalDays: 45,
    otherIntervalDays: 35,
    upcomingDaysThreshold: 7,
    overdueDaysThreshold: 7,
    criticalOverdueDaysThreshold: 30,
    usePersonalizedInterval: true,
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const total = MOCK_GROOMING_DUE_PETS.length;
    let potentialRev = 0;
    const counts: Record<GroomingDueStatus, number> = {
      UPCOMING: 0,
      DUE_NOW: 0,
      OVERDUE: 0,
      CRITICAL_OVERDUE: 0,
      ON_TRACK: 0,
    };

    for (const p of MOCK_GROOMING_DUE_PETS) {
      counts[p.dueStatus] += 1;
      if (p.dueStatus !== 'ON_TRACK' && !p.hasFutureBooking) {
        potentialRev += p.estimatedPriceMinor;
      }
    }

    const totalDueOrOverdue = counts.UPCOMING + counts.DUE_NOW + counts.OVERDUE + counts.CRITICAL_OVERDUE;

    return { total, potentialRev, counts, totalDueOrOverdue };
  }, []);

  // Filter Pets
  const filteredPets = useMemo(() => {
    return MOCK_GROOMING_DUE_PETS.filter((pet) => {
      const matchStatus = selectedStatus === 'ALL' || pet.dueStatus === selectedStatus;
      const matchSpecies = speciesFilter === 'ALL' || pet.species === speciesFilter;
      const matchBooking =
        bookingFilter === 'ALL' ||
        (bookingFilter === 'HAS_BOOKING' && pet.hasFutureBooking) ||
        (bookingFilter === 'NO_BOOKING' && !pet.hasFutureBooking);

      const s = searchTerm.toLowerCase().trim();
      const matchSearch =
        !s ||
        pet.petName.toLowerCase().includes(s) ||
        (pet.breed && pet.breed.toLowerCase().includes(s)) ||
        pet.customerName.toLowerCase().includes(s) ||
        pet.customerPhone.includes(s);

      return matchStatus && matchSpecies && matchBooking && matchSearch;
    });
  }, [selectedStatus, speciesFilter, bookingFilter, searchTerm]);

  const handleOpenSendMessage = (pet: GroomingDuePetItem) => {
    setActivePet(pet);
    setIsMessageModalOpen(true);
    setMessageSent(false);
  };

  const handleConfirmSend = () => {
    setMessageSent(true);
    setTimeout(() => {
      setIsMessageModalOpen(false);
      setMessageSent(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/retention" className="hover:text-slate-900 dark:hover:text-white">
          การรักษาลูกค้า (Retention)
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0071e3] dark:text-blue-400 font-bold">
          ตรวจจับรอบกรูมมิ่ง (Grooming Due Detector)
        </span>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ระบบตรวจจับรอบกรูมมิ่ง & แจ้งเตือน (Grooming Due Detector)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3] border border-blue-200/60 dark:border-blue-800/60">
              <Sparkles className="w-3 h-3" /> AI Cycle Detector
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ตรวจจับสัตว์เลี้ยงที่ถึงกำหนดอาบน้ำตัดขนอัตโนมัติตามสายพันธุ์ หรือรอบเฉพาะตัว (Personalized Cycle) พร้อมส่ง LINE เตือนก่อนลูกค้าลืม
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium text-sm px-4 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            ตั้งค่ารอบเวลา (Due Rules)
          </button>
        </div>
      </div>

      {/* 5 Status Cards (Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(STATUS_CONFIG) as GroomingDueStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const count = metrics.counts[status];
          const isSelected = selectedStatus === status;
          const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;

          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(isSelected ? 'ALL' : status)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-apple flex flex-col justify-between ${
                isSelected
                  ? config.borderActive + ' shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
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
                  {pct}%
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {config.title}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {count}
                  </span>
                  <span className="text-xs text-slate-500">ตัว</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>สถานะ:</span>
                <span className="font-semibold" style={{ color: config.accentColor }}>
                  {status === 'ON_TRACK' ? 'เรียบร้อย' : 'ควรติดตาม'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Revenue Opportunity Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              โอกาสสร้างรายได้จากการเรียกกลับ (Revenue Recovery Opportunity)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              มีสัตว์เลี้ยงที่ถึงกำหนดหรือเกินกำหนดแต่ยังไม่มีนัดหมาย {metrics.totalDueOrOverdue} ตัว คิดเป็นมูลค่าบริการประมาณ
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-[#0071e3] dark:text-blue-400">
            ฿{(metrics.potentialRev / 100).toLocaleString('th-TH')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">มูลค่าบริการที่พร้อมดึงดูดกลับ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Status filter button */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({metrics.total})
            </button>
            <button
              onClick={() => setSelectedStatus('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === 'UPCOMING'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ใกล้ถึงกำหนด ({metrics.counts.UPCOMING})
            </button>
            <button
              onClick={() => setSelectedStatus('DUE_NOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === 'DUE_NOW'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ถึงกำหนดแล้ว ({metrics.counts.DUE_NOW})
            </button>
            <button
              onClick={() => setSelectedStatus('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === 'OVERDUE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              เกินกำหนด ({metrics.counts.OVERDUE})
            </button>
            <button
              onClick={() => setSelectedStatus('CRITICAL_OVERDUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === 'CRITICAL_OVERDUE'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              เกินกำหนดมาก ({metrics.counts.CRITICAL_OVERDUE})
            </button>
          </div>

          {/* Species Switcher */}
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value as any)}
            className="text-xs font-medium px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#0071e3]"
          >
            <option value="ALL">สัตว์เลี้ยงทุกประเภท</option>
            <option value="DOG">🐶 สุนัข (Dog)</option>
            <option value="CAT">🐱 แมว (Cat)</option>
          </select>

          {/* Booking Switcher */}
          <select
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value as any)}
            className="text-xs font-medium px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#0071e3]"
          >
            <option value="ALL">สถานะนัดหมายทั้งหมด</option>
            <option value="NO_BOOKING">ยังไม่มีนัดหมายล่วงหน้า</option>
            <option value="HAS_BOOKING">มีนัดหมายล่วงหน้าแล้ว</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ, เบอร์..."
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

      {/* Due Pets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">สัตว์เลี้ยง & สายพันธุ์</th>
                <th className="py-3.5 px-4">เจ้าของ & ช่องทางติดต่อ</th>
                <th className="py-3.5 px-4">กรูมมิ่งล่าสุด</th>
                <th className="py-3.5 px-4 text-center">รอบกรูมมิ่ง</th>
                <th className="py-3.5 px-4 text-center">สถานะรอบกำหนด</th>
                <th className="py-3.5 px-4 text-center">นัดหมายล่วงหน้า</th>
                <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Scissors className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบสัตว์เลี้ยงในเงื่อนไขที่เลือก</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredPets.map((pet) => {
                  const statusConfig = STATUS_CONFIG[pet.dueStatus];
                  const Icon = statusConfig.icon;

                  return (
                    <tr
                      key={pet.petId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Pet info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{pet.species === 'DOG' ? '🐶' : '🐱'}</span>
                          <span>{pet.petName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {pet.breed || 'ไม่ระบุสายพันธุ์'}
                        </div>
                        {pet.specialRequirements && (
                          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded inline-block max-w-xs truncate">
                            ⚠️ {pet.specialRequirements}
                          </div>
                        )}
                      </td>

                      {/* Customer info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {pet.customerName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {pet.customerPhone}
                          </span>
                          {pet.lineUserId && (
                            <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-medium">
                              LINE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Last groomed */}
                      <td className="py-3.5 px-4">
                        {pet.lastGroomedAt ? (
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {pet.daysSinceLastGrooming} วันที่แล้ว
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(pet.lastGroomedAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {pet.lastServiceName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ยังไม่เคยบันทึก</span>
                        )}
                      </td>

                      {/* Cycle */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {pet.cycleDays} วัน
                          {pet.isPersonalizedCycle && (
                            <span title="รอบคำนวณเฉพาะตัว (Personalized)">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {pet.isPersonalizedCycle ? 'รอบเฉพาะตัว' : `ตามพันธุ์ (${pet.species})`}
                        </div>
                      </td>

                      {/* Due Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeColor}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {pet.dueStatusText}
                        </span>
                        {pet.nextGroomingDueAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            กำหนด: {new Date(pet.nextGroomingDueAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </td>

                      {/* Future Booking Status */}
                      <td className="py-3.5 px-4 text-center">
                        {pet.hasFutureBooking ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            มีนัดแล้ว ({new Date(pet.futureBookingAt!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">ยังไม่มีนัด</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenSendMessage(pet)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] transition active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {pet.hasFutureBooking ? 'แจ้งข้อมูล' : 'ส่ง LINE เตือน'}
                          </button>
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

      {/* Rules Configuration Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ตั้งค่าเกณฑ์รอบกรูมมิ่ง (Grooming Due Rules)
                  </h3>
                  <p className="text-xs text-slate-500">ปรับแต่งรอบเวลาตามประเภทและพฤติกรรมสัตว์เลี้ยง</p>
                </div>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  รอบกรูมมิ่งมาตรฐานสุนัข (วัน):
                </label>
                <input
                  type="number"
                  value={rules.dogIntervalDays}
                  onChange={(e) => setRules({ ...rules, dogIntervalDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  รอบกรูมมิ่งมาตรฐานแมว (วัน):
                </label>
                <input
                  type="number"
                  value={rules.catIntervalDays}
                  onChange={(e) => setRules({ ...rules, catIntervalDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  เตือนล่วงหน้าก่อนถึงกำหนด (วัน):
                </label>
                <input
                  type="number"
                  value={rules.upcomingDaysThreshold}
                  onChange={(e) => setRules({ ...rules, upcomingDaysThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    คำนวณรอบเฉพาะตัว (Personalized Cycle)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    คำนวณจากค่าเฉลี่ยจริงเมื่อสัตว์เลี้ยงมารับบริการ $\ge 2$ ครั้ง
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rules.usePersonalizedInterval}
                  onChange={(e) => setRules({ ...rules, usePersonalizedInterval: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl shadow-sm"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Trigger Modal */}
      {isMessageModalOpen && activePet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ส่งข้อความเตือนกรูมมิ่ง (Grooming Reminder)
                  </h3>
                  <p className="text-xs text-slate-500">ส่งถึงคุณ {activePet.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">สัตว์เลี้ยง:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activePet.species === 'DOG' ? '🐶' : '🐱'} {activePet.petName} ({activePet.breed})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สถานะรอบ:</span>
                <span className="font-semibold text-[#0071e3]">{activePet.dueStatusText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ช่องทางการส่ง:</span>
                <span className="font-semibold text-emerald-600">
                  {activePet.lineUserId ? 'LINE Push Message' : 'SMS / ข้อความมือถือ'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ข้อความแนะนำ (ปรับแต่งได้):
              </label>
              <textarea
                rows={3}
                defaultValue={activePet.recommendedMessage}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            {messageSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ส่งข้อความแจ้งเตือนเรียบร้อยแล้ว!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
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

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Syringe,
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
  Plus,
  ShieldAlert,
  ShieldCheck,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { VaccineDueStatus, VaccineDuePetItem, PetSpecies } from '@petflow/types';

// Mock vaccine due pet data for web UI showcase
const MOCK_VACCINE_DUE_PETS: VaccineDuePetItem[] = [
  {
    vaccinationId: 'vax-1',
    petId: 'pet-1',
    petName: 'โมจิ (Mochi)',
    species: 'DOG',
    breed: 'Pomeranian',
    birthDate: '2024-05-10T00:00:00Z',
    photoUrl: null,
    customerId: 'c-1',
    customerName: 'กนกวรรณ รักดี',
    customerPhone: '089-111-2233',
    lineUserId: 'U123456789',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'วัคซีนรวมสุนัข 5 โรค (DHPPi)',
    lotNumber: 'LOT-2025-08A',
    administeredAt: '2025-09-15T10:00:00Z',
    nextDueAt: '2026-09-15T10:00:00Z',
    daysDifference: -19, // 19 days remaining
    dueStatus: 'UPCOMING',
    dueStatusText: 'ใกล้ถึงกำหนด (ใน 19 วัน)',
    riskLevel: 'LOW',
    riskDescription: 'ใกล้ถึงรอบฉีดวัคซีนกระตุ้นประจำปีในอีก 19 วัน',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 50000,
    recommendedMessage: 'สวัสดีครับคุณ กนกวรรณ อีก 19 วันจะถึงกำหนดฉีดกระตุ้น วัคซีนรวมสุนัข 5 โรค (DHPPi) ของน้อง โมจิ แล้วนะครับ นัดหมายเวลาล่วงหน้าได้เลยครับ 💉',
  },
  {
    vaccinationId: 'vax-2',
    petId: 'pet-2',
    petName: 'ลัคกี้ (Lucky)',
    species: 'DOG',
    breed: 'Golden Retriever',
    birthDate: '2023-11-20T00:00:00Z',
    photoUrl: null,
    customerId: 'c-3',
    customerName: 'ธนากร สุขสวัสดิ์',
    customerPhone: '081-444-5566',
    lineUserId: 'U33445566',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'วัคซีนพิษสุนัขบ้า (Rabies)',
    lotNumber: 'LOT-RAB-2025',
    administeredAt: '2025-08-20T11:00:00Z',
    nextDueAt: '2026-08-20T11:00:00Z',
    daysDifference: 7, // 7 days overdue -> DUE_NOW
    dueStatus: 'DUE_NOW',
    dueStatusText: 'ถึงกำหนดแล้ว (เลยมา 7 วัน)',
    riskLevel: 'MEDIUM',
    riskDescription: 'ถึงรอบฉีดวัคซีนกระตุ้นประจำปี (เลยมา 7 วัน)',
    hasFutureBooking: true,
    futureBookingAt: '2026-08-30T14:00:00Z',
    estimatedPriceMinor: 35000,
    recommendedMessage: 'สวัสดีครับคุณ ธนากร น้อง ลัคกี้ มีนัดหมายตรวจสุขภาพและรับวัคซีนล่วงหน้าในวันที่ 30 ส.ค. เรียบร้อยแล้ว แล้วพบกันที่คลินิกนะครับ 🏥🐾',
  },
  {
    vaccinationId: 'vax-3',
    petId: 'pet-3',
    petName: 'ส้มส้ม (Somsom)',
    species: 'CAT',
    breed: 'Persian',
    birthDate: '2024-02-14T00:00:00Z',
    photoUrl: null,
    customerId: 'c-5',
    customerName: 'พิมพิศา ว่องวิทย์',
    customerPhone: '086-777-8899',
    lineUserId: 'U77889900',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'วัคซีนรวมไข้หัด-หวัดแมว (FVRCP)',
    lotNumber: 'LOT-CAT-FVR',
    administeredAt: '2025-07-10T14:30:00Z',
    nextDueAt: '2026-07-10T14:30:00Z',
    daysDifference: 48, // 48 days overdue
    dueStatus: 'OVERDUE',
    dueStatusText: 'เกินกำหนดฉีด 48 วัน',
    riskLevel: 'HIGH',
    riskDescription: 'เลยกำหนดฉีดกระตุ้นมา 48 วัน ภูมิคุ้มกันอาจลดระดับลง ควรพามารับวัคซีนโดยเร็ว',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 45000,
    recommendedMessage: 'สวัสดีครับคุณ พิมพิศา น้อง ส้มส้ม เลยกำหนดฉีด วัคซีนรวมไข้หัด-หวัดแมว (FVRCP) มา 48 วันแล้วครับ เพื่อความปลอดภัยจากโรคติดต่อ แนะนำพาน้องมาพบสัตวแพทย์เพื่อฉีดกระตุ้นภูมิคุ้มกันนะครับ 💖',
  },
  {
    vaccinationId: 'vax-4',
    petId: 'pet-4',
    petName: 'บัดดี้ (Buddy)',
    species: 'DOG',
    breed: 'French Bulldog',
    birthDate: '2023-08-01T00:00:00Z',
    photoUrl: null,
    customerId: 'c-4',
    customerName: 'วิชัย เมธากุล',
    customerPhone: '085-333-2211',
    lineUserId: 'U555666777',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'วัคซีนรวมสุนัข 6 โรค + เลปโตสไปโรซิส (DHPPL)',
    lotNumber: 'LOT-DOG-LEP',
    administeredAt: '2025-05-15T15:00:00Z',
    nextDueAt: '2026-05-15T15:00:00Z',
    daysDifference: 104, // 104 days overdue (> 60 days -> CRITICAL_OVERDUE)
    dueStatus: 'CRITICAL_OVERDUE',
    dueStatusText: 'เกินกำหนดมาก 104 วัน',
    riskLevel: 'CRITICAL',
    riskDescription: 'ขาดวัคซีนเกิน 104 วัน ระดับภูมิคุ้มกันป้องกันโรคตับ/เลปโตฯ อาจหมดลง ควรปรึกษาสัตวแพทย์',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 60000,
    recommendedMessage: 'สวัสดีครับคุณ วิชัย น้อง บัดดี้ ขาดวัคซีนรวมประจำปีมาเกิน 3 เดือนแล้วครับ เพื่อป้องกันโรคไข้หัดและเลปโตสไปโรซิส แนะนำพาน้องมารับการตรวจและฉีดวัคซีนกระตุ้นโดยเร็วนะครับ 🩺🐶',
  },
  {
    vaccinationId: 'vax-5',
    petId: 'pet-5',
    petName: 'ชาโคล (Charcoal)',
    species: 'CAT',
    breed: 'British Shorthair',
    birthDate: '2025-01-10T00:00:00Z',
    photoUrl: null,
    customerId: 'c-1',
    customerName: 'กนกวรรณ รักดี',
    customerPhone: '089-111-2233',
    lineUserId: 'U123456789',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'วัคซีนลิวคีเมียแมว (FeLV) & พิษสุนัขบ้า',
    lotNumber: 'LOT-FELV-99',
    administeredAt: '2026-06-20T10:00:00Z',
    nextDueAt: '2027-06-20T10:00:00Z',
    daysDifference: -297, // 297 days left
    dueStatus: 'UP_TO_DATE',
    dueStatusText: 'ได้รับวัคซีนครบถ้วน',
    riskLevel: 'LOW',
    riskDescription: 'ได้รับวัคซีนครบถ้วนตามกำหนด (เหลืออีก 297 วัน)',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 55000,
    recommendedMessage: 'สวัสดีครับคุณ กนกวรรณ วัคซีนของน้อง ชาโคล อยู่ในเกณฑ์ครบถ้วนสมบูรณ์ครับ 🐾',
  },
  {
    vaccinationId: null,
    petId: 'pet-6',
    petName: 'ชิโร่ (Shiro)',
    species: 'DOG',
    breed: 'Samoyed',
    birthDate: '2026-06-01T00:00:00Z',
    photoUrl: null,
    customerId: 'c-6',
    customerName: 'ณัฐชา พงษ์พาณิชย์',
    customerPhone: '082-999-8877',
    lineUserId: 'U33445566',
    marketingStatus: 'OPTED_IN',
    vaccineName: 'โปรแกรมวัคซีนลูกสุนัข (Puppy Primary Series)',
    lotNumber: null,
    administeredAt: null,
    nextDueAt: '2026-08-30T00:00:00Z',
    daysDifference: 3,
    dueStatus: 'DUE_NOW',
    dueStatusText: 'ถึงรอบวัคซีนลูกสุนัข',
    riskLevel: 'MEDIUM',
    riskDescription: 'ลูกสุนัขอายุประมาณ 3 เดือน ถึงรอบฉีดวัคซีนรวมเข็มที่ 2',
    hasFutureBooking: false,
    futureBookingAt: null,
    estimatedPriceMinor: 50000,
    recommendedMessage: 'สวัสดีครับคุณ ณัฐชา น้อง ชิโร่ ถึงรอบรับวัคซีนลูกสุนัขเข็มต่อไปแล้วนะครับ เพื่อเสริมสร้างภูมิคุ้มกันให้แข็งแรง นัดคิวพาน้องมาพบคุณหมอได้เลยครับ 🐶💉',
  },
];

const STATUS_CONFIG: Record<
  VaccineDueStatus,
  {
    title: string;
    badgeColor: string;
    borderActive: string;
    accentColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  UPCOMING: {
    title: 'ใกล้ถึงกำหนด (ใน 30 วัน)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    accentColor: '#f59e0b',
    icon: Clock,
  },
  DUE_NOW: {
    title: 'ถึงกำหนดฉีดแล้ว (DUE)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    accentColor: '#0071e3',
    icon: Syringe,
  },
  OVERDUE: {
    title: 'เกินกำหนดฉีด (15-60 วัน)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    accentColor: '#f43f5e',
    icon: AlertTriangle,
  },
  CRITICAL_OVERDUE: {
    title: 'เกินกำหนดมาก (>60 วัน)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    accentColor: '#8b5cf6',
    icon: ShieldAlert,
  },
  UP_TO_DATE: {
    title: 'วัคซีนครบถ้วน (Up to Date)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    accentColor: '#10b981',
    icon: ShieldCheck,
  },
};

const RISK_BADGES: Record<
  'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  { title: string; color: string }
> = {
  LOW: { title: 'ความเสี่ยงต่ำ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400' },
  MEDIUM: { title: 'ควรได้รับวัคซีน', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400' },
  HIGH: { title: 'ภูมิคุ้มกันตก', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400' },
  CRITICAL: { title: 'เสี่ยงติดเชื้อสูง', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400' },
};

export default function VaccineDuePage() {
  const [selectedStatus, setSelectedStatus] = useState<VaccineDueStatus | 'ALL'>('ALL');
  const [speciesFilter, setSpeciesFilter] = useState<'ALL' | 'DOG' | 'CAT'>('ALL');
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'HAS_BOOKING' | 'NO_BOOKING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePet, setActivePet] = useState<VaccineDuePetItem | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [recordSaved, setRecordSaved] = useState(false);

  // Form states for new vaccine record
  const [vaxFormPetId, setVaxFormPetId] = useState('');
  const [vaxFormName, setVaxFormName] = useState('วัคซีนรวมสุนัข 5 โรค (DHPPi)');
  const [vaxFormLot, setVaxFormLot] = useState('LOT-' + new Date().getFullYear() + '-01');
  const [vaxFormAdministeredAt, setVaxFormAdministeredAt] = useState(new Date().toISOString().split('T')[0]);

  // Metrics
  const metrics = useMemo(() => {
    const total = MOCK_VACCINE_DUE_PETS.length;
    let potentialRev = 0;
    const counts: Record<VaccineDueStatus, number> = {
      UPCOMING: 0,
      DUE_NOW: 0,
      OVERDUE: 0,
      CRITICAL_OVERDUE: 0,
      UP_TO_DATE: 0,
    };

    for (const p of MOCK_VACCINE_DUE_PETS) {
      counts[p.dueStatus] += 1;
      if (p.dueStatus !== 'UP_TO_DATE' && !p.hasFutureBooking) {
        potentialRev += p.estimatedPriceMinor;
      }
    }

    const totalDueOrOverdue = counts.UPCOMING + counts.DUE_NOW + counts.OVERDUE + counts.CRITICAL_OVERDUE;

    return { total, potentialRev, counts, totalDueOrOverdue };
  }, []);

  // Filter Pets
  const filteredPets = useMemo(() => {
    return MOCK_VACCINE_DUE_PETS.filter((pet) => {
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
        pet.customerPhone.includes(s) ||
        pet.vaccineName.toLowerCase().includes(s);

      return matchStatus && matchSpecies && matchBooking && matchSearch;
    });
  }, [selectedStatus, speciesFilter, bookingFilter, searchTerm]);

  const handleOpenSendMessage = (pet: VaccineDuePetItem) => {
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

  const handleSaveVaccineRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordSaved(true);
    setTimeout(() => {
      setIsRecordModalOpen(false);
      setRecordSaved(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/retention" className="hover:text-slate-900 dark:hover:text-white">
          การรักษาลูกค้า (Retention)
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0071e3] dark:text-blue-400 font-bold">
          ตรวจจับรอบวัคซีน (Vaccine Due Detector)
        </span>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ระบบตรวจจับรอบวัคซีนสัตว์เลี้ยง (Vaccine Due Detector)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-3 h-3" /> Vet Clinical Ready
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ตรวจจับรอบกำหนดการฉีดวัคซีนป้องกันโรคและกระตุ้นประจำปี (Rabies, DHPPi, FVRCP) พร้อมส่งแจ้งเตือนและประเมินระดับความเสี่ยงทางคลินิก
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            บันทึกการฉีดวัคซีน (+ Vaccine)
          </button>
        </div>
      </div>

      {/* 5 Status Cards (Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(STATUS_CONFIG) as VaccineDueStatus[]).map((status) => {
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
                <span>ความสำคัญ:</span>
                <span className="font-semibold" style={{ color: config.accentColor }}>
                  {status === 'UP_TO_DATE' ? 'ครบถ้วน' : status === 'CRITICAL_OVERDUE' ? 'เร่งด่วนสูงสุด' : 'ควรติดตาม'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Clinical Revenue & Prevention Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              การป้องกันโรค & โอกาสรายได้คลินิก (Clinical Healthcare Recovery)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              สัตว์เลี้ยงที่ถึงกำหนดหรือขาดวัคซีน {metrics.totalDueOrOverdue} ตัว มูลค่าแพ็กเกจวัคซีนและตรวจสุขภาพประมาณ
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ฿{(metrics.potentialRev / 100).toLocaleString('th-TH')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">มูลค่าวัคซีนที่พร้อมดึงดูดกลับ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
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

          {/* Species */}
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value as any)}
            className="text-xs font-medium px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#0071e3]"
          >
            <option value="ALL">สัตว์เลี้ยงทุกประเภท</option>
            <option value="DOG">🐶 สุนัข (Dog)</option>
            <option value="CAT">🐱 แมว (Cat)</option>
          </select>

          {/* Booking filter */}
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
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, วัคซีน, เจ้าของ..."
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
                <th className="py-3.5 px-4">สัตว์เลี้ยง & เจ้าของ</th>
                <th className="py-3.5 px-4">รายการวัคซีน & Lot</th>
                <th className="py-3.5 px-4">ฉีดล่าสุด</th>
                <th className="py-3.5 px-4 text-center">กำหนดรอบถัดไป</th>
                <th className="py-3.5 px-4 text-center">ระดับความเสี่ยงทางคลินิก</th>
                <th className="py-3.5 px-4 text-center">นัดหมายคลินิก</th>
                <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Syringe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบรายการวัคซีนในเงื่อนไขที่เลือก</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredPets.map((pet) => {
                  const statusConfig = STATUS_CONFIG[pet.dueStatus];
                  const riskConfig = RISK_BADGES[pet.riskLevel];
                  const Icon = statusConfig.icon;

                  return (
                    <tr
                      key={pet.petId + '-' + pet.vaccineName}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Pet & Owner */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{pet.species === 'DOG' ? '🐶' : '🐱'}</span>
                          <span>{pet.petName}</span>
                          <span className="text-xs font-normal text-slate-400">({pet.breed || 'ไม่ระบุ'})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{pet.customerName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {pet.customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Vaccine name & lot */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {pet.vaccineName}
                        </div>
                        {pet.lotNumber ? (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Lot: {pet.lotNumber}
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            ยังไม่มีบันทึก Lot
                          </div>
                        )}
                      </td>

                      {/* Administered at */}
                      <td className="py-3.5 px-4">
                        {pet.administeredAt ? (
                          <div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              {new Date(pet.administeredAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ยังไม่เคยฉีด</span>
                        )}
                      </td>

                      {/* Next due date & due status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeColor}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {pet.dueStatusText}
                        </span>
                        {pet.nextDueAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            กำหนด: {new Date(pet.nextDueAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>

                      {/* Clinical risk level */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${riskConfig.color}`}
                        >
                          {riskConfig.title}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={pet.riskDescription}>
                          {pet.riskDescription}
                        </div>
                      </td>

                      {/* Future Booking */}
                      <td className="py-3.5 px-4 text-center">
                        {pet.hasFutureBooking ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            มีนัด ({new Date(pet.futureBookingAt!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
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
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {pet.hasFutureBooking ? 'แจ้งข้อมูล' : 'ส่ง LINE เตือนวัคซีน'}
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

      {/* Record Vaccine Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                  <Syringe className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    บันทึกการฉีดวัคซีนสัตว์เลี้ยง (Vaccination Record)
                  </h3>
                  <p className="text-xs text-slate-500">บันทึกข้อมูลวัคซีนและคำนวณวันนัดหมายรอบถัดไป</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVaccineRecord} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  เลือกสัตว์เลี้ยง:
                </label>
                <select
                  value={vaxFormPetId}
                  onChange={(e) => setVaxFormPetId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- เลือกสัตว์เลี้ยง --</option>
                  {MOCK_VACCINE_DUE_PETS.map((p) => (
                    <option key={p.petId} value={p.petId}>
                      {p.petName} ({p.customerName} - {p.customerPhone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อวัคซีน (Vaccine Name):
                </label>
                <input
                  type="text"
                  value={vaxFormName}
                  onChange={(e) => setVaxFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="เช่น วัคซีนรวมสุนัข 5 โรค (DHPPi)"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Lot / Batch Number:
                </label>
                <input
                  type="text"
                  value={vaxFormLot}
                  onChange={(e) => setVaxFormLot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  placeholder="เช่น LOT-2026-08A"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    วันที่ฉีด (Administered Date):
                  </label>
                  <input
                    type="date"
                    value={vaxFormAdministeredAt}
                    onChange={(e) => setVaxFormAdministeredAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    รอบกระตุ้นถัดไป (อัตโนมัติ 1 ปี):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      new Date(
                        new Date(vaxFormAdministeredAt).getTime() + 365 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('th-TH')
                    }
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {recordSaved ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> บันทึกข้อมูลวัคซีนเรียบร้อยแล้ว!
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                  >
                    บันทึกวัคซีน
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {isMessageModalOpen && activePet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ส่งข้อความเตือนฉีดวัคซีน (Vaccine Reminder)
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
                <span className="text-slate-500">รายการวัคซีน:</span>
                <span className="font-semibold text-emerald-600">{activePet.vaccineName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สถานะความเสี่ยง:</span>
                <span className="font-semibold text-rose-600">{activePet.riskDescription}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ข้อความแนะนำ (ปรับแต่งได้):
              </label>
              <textarea
                rows={3}
                defaultValue={activePet.recommendedMessage}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {messageSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ส่งข้อความแจ้งเตือนวัคซีนเรียบร้อยแล้ว!
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
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition active:scale-95"
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

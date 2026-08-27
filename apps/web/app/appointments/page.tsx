'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  User,
  Dog,
  Cat,
  Scissors,
  Stethoscope,
  Syringe,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock4,
  X,
  Layers,
  ListFilter,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { AppointmentDetailDrawer } from '../../components/appointments/appointment-detail-drawer';

export type CalendarViewMode = 'day' | 'week' | 'list';

interface MockStaff {
  id: string;
  name: string;
  nickname: string;
  role: 'GROOMER' | 'VETERINARIAN';
  avatarBg: string;
  avatarText: string;
}

interface MockAppointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  petId: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed: string;
  petWeight: number;
  petAllergies?: string;
  petBehavior?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA';
  staffId: string;
  staffName: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priceMinor: number;
  notes?: string;
  source: 'LINE' | 'PHONE' | 'WALK_IN' | 'ONLINE_BOOKING';
}

const mockStaffList: MockStaff[] = [
  { id: 'u1', name: 'เอกชัย ช่างตัดขน', nickname: 'ช่างเอก', role: 'GROOMER', avatarBg: 'bg-blue-100 text-[#0071e3]', avatarText: 'เอก' },
  { id: 'u2', name: 'แนนซี่ กรูมเมอร์', nickname: 'ช่างแนน', role: 'GROOMER', avatarBg: 'bg-indigo-100 text-indigo-600', avatarText: 'แนน' },
  { id: 'u3', name: 'สพ.ญ. วิภา สัตวแพทย์', nickname: 'หมอวิภา', role: 'VETERINARIAN', avatarBg: 'bg-emerald-100 text-emerald-600', avatarText: 'วิภา' },
  { id: 'u4', name: 'น.สพ. ณัฐ ตรวจรักษา', nickname: 'หมอณัฐ', role: 'VETERINARIAN', avatarBg: 'bg-amber-100 text-amber-700', avatarText: 'ณัฐ' },
];

const initialAppointments: MockAppointment[] = [
  {
    id: 'apt-01',
    customerId: 'c1',
    customerName: 'คุณสมชาย รักสัตว์',
    customerPhone: '081-234-5678',
    customerLine: 'somchai_pets',
    petId: 'p1',
    petName: 'น้องโมจิ',
    petSpecies: 'DOG',
    petBreed: 'ปอมเมอเรเนียน (Pomeranian)',
    petWeight: 3.8,
    petAllergies: 'ไม่มี',
    petBehavior: 'กลัวเสียงไดร์เป่าขน ให้ใช้ลมเบา',
    serviceId: 's1',
    serviceName: 'อาบน้ำ + ตัดแต่งทรงกรูมมิ่ง สุนัขพันธุ์เล็ก',
    serviceCategory: 'GROOMING',
    staffId: 'u1',
    staffName: 'ช่างเอก',
    startAt: '2026-08-25T09:00:00.000Z',
    endAt: '2026-08-25T10:30:00.000Z',
    status: 'IN_PROGRESS',
    priceMinor: 55000,
    notes: 'ตัดทรงหน้าหมี ขนฟูสั้น',
    source: 'LINE',
  },
  {
    id: 'apt-02',
    customerId: 'c2',
    customerName: 'คุณกิตติศักดิ์ มหาโชค',
    customerPhone: '089-876-5432',
    petId: 'p2',
    petName: 'น้องลัคกี้',
    petSpecies: 'DOG',
    petBreed: 'โกลเด้น รีทรีฟเวอร์ (Golden Retriever)',
    petWeight: 28.5,
    petAllergies: 'แพ้แชมพูสูตรน้ำหอมเข้มข้น',
    serviceId: 's2',
    serviceName: 'อาบน้ำกำจัดขนผลัด + สปาโอโซน สุนัขใหญ่',
    serviceCategory: 'SPA',
    staffId: 'u2',
    staffName: 'ช่างแนน',
    startAt: '2026-08-25T09:30:00.000Z',
    endAt: '2026-08-25T11:30:00.000Z',
    status: 'CHECKED_IN',
    priceMinor: 95000,
    notes: 'ใช้แชมพู Hypoallergenic',
    source: 'PHONE',
  },
  {
    id: 'apt-03',
    customerId: 'c3',
    customerName: 'คุณอรทัย วัฒนา',
    customerPhone: '092-345-6789',
    customerLine: 'orathai_cat',
    petId: 'p3',
    petName: 'น้องมิลค์',
    petSpecies: 'CAT',
    petBreed: 'บริติช ชอร์ตแฮร์ (British Shorthair)',
    petWeight: 4.2,
    petAllergies: 'ไม่มี',
    serviceId: 's3',
    serviceName: 'ตรวจสุขภาพประจำปี + ฉีดวัคซีนรวมแมว',
    serviceCategory: 'VACCINE',
    staffId: 'u3',
    staffName: 'หมอวิภา',
    startAt: '2026-08-25T10:00:00.000Z',
    endAt: '2026-08-25T10:30:00.000Z',
    status: 'CONFIRMED',
    priceMinor: 45000,
    notes: 'ตรวจหูและฟันเพิ่มเติมน้องมีหินปูนเล็กน้อย',
    source: 'ONLINE_BOOKING',
  },
  {
    id: 'apt-04',
    customerId: 'c4',
    customerName: 'คุณพงศกร เจริญดี',
    customerPhone: '084-567-8901',
    petId: 'p4',
    petName: 'น้องถ้วยฟู',
    petSpecies: 'DOG',
    petBreed: 'พุดเดิ้ล ทอย (Poodle Toy)',
    petWeight: 3.2,
    petAllergies: 'ไม่มี',
    serviceId: 's1',
    serviceName: 'ตัดขนทรงเทดดี้แบร์ สุนัขเล็ก',
    serviceCategory: 'GROOMING',
    staffId: 'u1',
    staffName: 'ช่างเอก',
    startAt: '2026-08-25T11:00:00.000Z',
    endAt: '2026-08-25T12:00:00.000Z',
    status: 'CONFIRMED',
    priceMinor: 50000,
    notes: 'ขอช่างเอกประจำน้องคุ้นเคย',
    source: 'LINE',
  },
  {
    id: 'apt-05',
    customerId: 'c5',
    customerName: 'คุณปรียา สดใส',
    customerPhone: '086-789-0123',
    petId: 'p5',
    petName: 'น้องบะหมี่',
    petSpecies: 'CAT',
    petBreed: 'เปอร์เซีย (Persian)',
    petWeight: 4.8,
    petAllergies: 'ไม่มี',
    petBehavior: 'ดุนิดหน่อยเวลาตัดสังกะตัง',
    serviceId: 's4',
    serviceName: 'ตัดสังกะตัง + อาบน้ำตัดเล็บแมวขนยาว',
    serviceCategory: 'GROOMING',
    staffId: 'u2',
    staffName: 'ช่างแนน',
    startAt: '2026-08-25T13:30:00.000Z',
    endAt: '2026-08-25T15:00:00.000Z',
    status: 'PENDING',
    priceMinor: 65000,
    notes: 'มีสังกะตังแน่นบริเวณใต้คอและขาหลัง',
    source: 'PHONE',
  },
  {
    id: 'apt-06',
    customerId: 'c6',
    customerName: 'คุณธนพล มั่งมี',
    customerPhone: '095-678-1234',
    petId: 'p6',
    petName: 'น้องซีซาร์',
    petSpecies: 'DOG',
    petBreed: 'เฟรนช์ บูลด็อก (French Bulldog)',
    petWeight: 11.2,
    petAllergies: 'แพ้ไก่และไข่ไก่',
    serviceId: 's5',
    serviceName: 'ตรวจผิวหนัง ผื่นแดง + ป้ายยาเฉพาะจุด',
    serviceCategory: 'CLINIC',
    staffId: 'u4',
    staffName: 'หมอณัฐ',
    startAt: '2026-08-25T14:00:00.000Z',
    endAt: '2026-08-25T14:45:00.000Z',
    status: 'CONFIRMED',
    priceMinor: 55000,
    notes: 'น้องคันใต้คางและขาพับมา 3 วัน',
    source: 'WALK_IN',
  },
  {
    id: 'apt-07',
    customerId: 'c7',
    customerName: 'คุณวราภรณ์ สุขใจ',
    customerPhone: '082-123-9876',
    petId: 'p7',
    petName: 'น้องชานม',
    petSpecies: 'CAT',
    petBreed: 'สก็อตติช โฟลด์ (Scottish Fold)',
    petWeight: 3.5,
    petAllergies: 'ไม่มี',
    serviceId: 's3',
    serviceName: 'ฉีดวัคซีนพิษสุนัขบ้า + ถ่ายพยาธิ',
    serviceCategory: 'VACCINE',
    staffId: 'u3',
    staffName: 'หมอวิภา',
    startAt: '2026-08-25T15:30:00.000Z',
    endAt: '2026-08-25T16:00:00.000Z',
    status: 'COMPLETED',
    priceMinor: 35000,
    notes: 'ฉีดเรียบร้อย แข็งแรงดี',
    source: 'LINE',
  },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-25');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appointments, setAppointments] = useState<MockAppointment[]>(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<MockAppointment | null>(null);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Staff filter
      if (selectedStaffId !== 'ALL' && apt.staffId !== selectedStaffId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && apt.serviceCategory !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && apt.status !== selectedStatus) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCustomer = apt.customerName.toLowerCase().includes(query);
        const matchPhone = apt.customerPhone.includes(query);
        const matchPet = apt.petName.toLowerCase().includes(query);
        const matchService = apt.serviceName.toLowerCase().includes(query);
        if (!matchCustomer && !matchPhone && !matchPet && !matchService) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, selectedStaffId, selectedCategory, selectedStatus, searchQuery]);

  // Status Badge Component
  const renderStatusBadge = (status: MockAppointment['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock4 className="w-3 h-3 text-amber-500" />
            รอยืนยัน
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0071e3] border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-[#0071e3]" />
            ยืนยันแล้ว
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <User className="w-3 h-3 text-indigo-500" />
            เช็คอินแล้ว
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            <Scissors className="w-3 h-3 text-emerald-600" />
            กำลังบริการ
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Check className="w-3 h-3 text-slate-500" />
            เสร็จสิ้น
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            ยกเลิก
          </span>
        );
    }
  };

  // Category Icon & Color
  const getCategoryTheme = (category: MockAppointment['serviceCategory']) => {
    switch (category) {
      case 'GROOMING':
        return {
          icon: <Scissors className="w-3.5 h-3.5" />,
          color: 'border-l-[#0071e3] bg-blue-50/50 hover:bg-blue-50 text-blue-900',
          badge: 'bg-blue-100 text-[#0071e3]',
        };
      case 'CLINIC':
        return {
          icon: <Stethoscope className="w-3.5 h-3.5" />,
          color: 'border-l-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-900',
          badge: 'bg-teal-100 text-teal-700',
        };
      case 'VACCINE':
        return {
          icon: <Syringe className="w-3.5 h-3.5" />,
          color: 'border-l-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
          badge: 'bg-indigo-100 text-indigo-700',
        };
      case 'SPA':
        return {
          icon: <Sparkles className="w-3.5 h-3.5" />,
          color: 'border-l-amber-500 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
          badge: 'bg-amber-100 text-amber-800',
        };
    }
  };

  const updateAppointmentStatus = (aptId: string, newStatus: MockAppointment['status']) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a))
    );
    if (selectedAppointment && selectedAppointment.id === aptId) {
      setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-apple">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                นัดหมาย & ปฏิทิน (Appointments & Calendar)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการตารางเวลานัดหมายช่างกรูมมิ่ง สัตวแพทย์ และสถานะคิวบริการ
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator + View Switcher + New Booking CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Navigator */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <button
              onClick={() => setSelectedDate('2026-08-25')}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 transition"
            >
              วันนี้
            </button>
            <button className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded-full text-slate-600 dark:text-slate-400 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              {selectedDate === '2026-08-25' ? 'อังคาร 25 ส.ค. 2026' : selectedDate}
            </span>
            <button className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded-full text-slate-600 dark:text-slate-400 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented View Switcher */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'day'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              มุมมองวัน (Day)
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'week'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              สัปดาห์ (Week)
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'list'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              รายการ (List)
            </button>
          </div>

          {/* New Appointment CTA */}
          <button
            onClick={() => {
              alert('เปิดแบบฟอร์มการจองด่วน (Quick Booking Modal ใน PF-027)');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            จองนัดใหม่ (+ Book)
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
        {/* Search & Staff Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ชื่อน้อง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0071e3] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Staff Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              ผู้ให้บริการ:
            </span>
            <button
              onClick={() => setSelectedStaffId('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedStaffId === 'ALL'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ทุกคน ({appointments.length})
            </button>
            {mockStaffList.map((staff) => {
              const count = appointments.filter((a) => a.staffId === staff.id).length;
              return (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedStaffId === staff.id
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${staff.avatarBg}`}>
                    {staff.avatarText[0]}
                  </span>
                  <span>{staff.nickname}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category & Status Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              หมวดหมู่:
            </span>
            {[
              { id: 'ALL', label: 'ทุกหมวดหมู่' },
              { id: 'GROOMING', label: '✂️ กรูมมิ่ง' },
              { id: 'CLINIC', label: '🩺 ตรวจรักษา' },
              { id: 'VACCINE', label: '💉 วัคซีน' },
              { id: 'SPA', label: '✨ สปา' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-0.5 rounded-full font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" />
              สถานะ:
            </span>
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'PENDING', label: 'รอยืนยัน' },
              { id: 'CONFIRMED', label: 'ยืนยันแล้ว' },
              { id: 'CHECKED_IN', label: 'เช็คอินแล้ว' },
              { id: 'IN_PROGRESS', label: 'กำลังบริการ' },
              { id: 'COMPLETED', label: 'เสร็จสิ้น' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  selectedStatus === st.id
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#0071e3] font-bold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CALENDAR VIEWS */}

      {/* VIEW A: DAY VIEW (Multi-staff Timeline Grid) */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
          {/* Staff Column Headers */}
          <div className="grid grid-cols-12 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="col-span-2 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              เวลา (Time)
            </div>
            {mockStaffList.map((staff) => (
              <div
                key={staff.id}
                className="col-span-2.5 py-3 px-3 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${staff.avatarBg}`}>
                    {staff.avatarText[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {staff.nickname}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {staff.role === 'GROOMER' ? 'ช่างกรูมมิ่ง' : 'สัตวแพทย์'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-50 text-[#0071e3] font-mono px-1.5 py-0.5 rounded font-bold">
                  {appointments.filter((a) => a.staffId === staff.id).length} นัด
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Grid Body */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {timeSlots.map((timeStr) => {
              const hourNumber = parseInt(timeStr.split(':')[0], 10);
              const isBreakHour = hourNumber === 12;

              return (
                <div key={timeStr} className="grid grid-cols-12 min-h-[90px] relative group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  {/* Time Label */}
                  <div className="col-span-2 p-3 border-r border-slate-200/80 dark:border-slate-800 font-mono text-slate-400 font-bold flex flex-col justify-start">
                    <span>{timeStr}</span>
                    <span className="text-[10px] text-slate-300 font-normal">น.</span>
                  </div>

                  {/* Staff Slot Columns */}
                  {mockStaffList.map((staff) => {
                    const aptsInSlot = filteredAppointments.filter((apt) => {
                      if (apt.staffId !== staff.id) return false;
                      const startHour = new Date(apt.startAt).getUTCHours() + 7;
                      return startHour === hourNumber;
                    });

                    return (
                      <div
                        key={staff.id}
                        className={`col-span-2.5 p-2 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 relative ${
                          isBreakHour ? 'bg-slate-100/40 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        {isBreakHour && aptsInSlot.length === 0 && (
                          <div className="h-full flex items-center justify-center text-[11px] text-slate-400 font-medium italic">
                            ☕ พักเที่ยง (Break)
                          </div>
                        )}

                        {aptsInSlot.map((apt) => {
                          const theme = getCategoryTheme(apt.serviceCategory);
                          return (
                            <div
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm border-l-4 ${theme.color} cursor-pointer transition-all hover:scale-[1.02] hover:shadow-apple-md mb-2`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white truncate">
                                  {apt.petSpecies === 'DOG' ? (
                                    <Dog className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                  ) : (
                                    <Cat className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{apt.petName}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                                  09:00 - 10:30
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                                {apt.serviceName}
                              </p>

                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50">
                                <span className="text-[10px] text-slate-500 truncate">
                                  {apt.customerName}
                                </span>
                                {renderStatusBadge(apt.status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: WEEK VIEW (7-Day Calendar Grid) */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-slate-200/80 dark:divide-slate-800">
            {[
              { day: 'จันทร์', date: '24 ส.ค.', count: 5 },
              { day: 'อังคาร', date: '25 ส.ค.', count: 7, isToday: true },
              { day: 'พุธ', date: '26 ส.ค.', count: 4 },
              { day: 'พฤหัสฯ', date: '27 ส.ค.', count: 6 },
              { day: 'ศุกร์', date: '28 ส.ค.', count: 8 },
              { day: 'เสาร์', date: '29 ส.ค.', count: 12 },
              { day: 'อาทิตย์', date: '30 ส.ค.', count: 10 },
            ].map((d, index) => (
              <div key={index} className="min-h-[420px] flex flex-col">
                <div
                  className={`p-3 text-center border-b border-slate-200/80 dark:border-slate-800 ${
                    d.isToday
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#0071e3]'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{d.day}</p>
                  <span className="text-xs text-slate-500">{d.date}</span>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        d.isToday
                          ? 'bg-[#0071e3] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d.count} นัดหมาย
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {d.isToday ? (
                    filteredAppointments.slice(0, 4).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:shadow-apple transition cursor-pointer text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {apt.petName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">09:00</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{apt.serviceName}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                          <span>{apt.staffName}</span>
                          {renderStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">
                      มี {d.count} รายการนัดหมาย
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW C: LIST VIEW (Agenda Stream) */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              พบ {filteredAppointments.length} รายการนัดหมายในตาราง
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAppointments.map((apt) => {
              const theme = getCategoryTheme(apt.serviceCategory);

              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  {/* Left: Time & Pet Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center flex-shrink-0 font-mono">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">09:00</span>
                      <span className="text-[10px] text-slate-400">10:30 น.</span>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#0071e3]">
                      {apt.petSpecies === 'DOG' ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{apt.petName}</h4>
                        <span className="text-xs text-slate-500">({apt.petBreed})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                          {apt.serviceCategory}
                        </span>
                        {apt.petAllergies && apt.petAllergies !== 'ไม่มี' && (
                          <span className="px-2 py-0.2 rounded bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            {apt.petAllergies}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {apt.serviceName} • ช่าง/แพทย์: <strong className="text-slate-800 dark:text-slate-200">{apt.staffName}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right: Customer Phone, Price, Status */}
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        {apt.customerName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{apt.customerPhone}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-[#0071e3] block">
                        {(apt.priceMinor / 100).toLocaleString('th-TH')} ฿
                      </span>
                      {renderStatusBadge(apt.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. APPOINTMENT DETAIL DRAWER (Apple Slide-Over Panel) */}
      <AppointmentDetailDrawer
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onStatusChange={updateAppointmentStatus}
      />
    </div>
  );
}

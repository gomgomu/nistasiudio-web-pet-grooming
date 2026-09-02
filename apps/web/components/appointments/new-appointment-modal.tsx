'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Dog,
  Cat,
  Scissors,
  Stethoscope,
  Syringe,
  Sparkles,
  Phone,
  MessageSquare,
  Check,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button, Badge } from '@petflow/ui';
import { useBooking, CreatedAppointmentEventData } from '../../contexts/booking-context';

interface PresetCustomerPet {
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
}

const PRESET_CUSTOMERS: PresetCustomerPet[] = [
  {
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
  },
  {
    customerId: 'c2',
    customerName: 'คุณกิตติศักดิ์ มหาโชค',
    customerPhone: '089-876-5432',
    petId: 'p2',
    petName: 'น้องลัคกี้',
    petSpecies: 'DOG',
    petBreed: 'โกลเด้น รีทรีฟเวอร์ (Golden Retriever)',
    petWeight: 28.5,
    petAllergies: 'แพ้แชมพูสูตรน้ำหอมเข้มข้น',
  },
  {
    customerId: 'c3',
    customerName: 'คุณอรทัย วัฒนา',
    customerPhone: '092-345-6789',
    customerLine: 'orathai_cat',
    petId: 'p3',
    petName: 'น้องมิลค์',
    petSpecies: 'CAT',
    petBreed: 'บริติช ชอร์ตแฮร์ (British Shorthair)',
    petWeight: 4.2,
  },
  {
    customerId: 'c4',
    customerName: 'คุณพงศกร เจริญดี',
    customerPhone: '084-567-8901',
    petId: 'p4',
    petName: 'น้องถ้วยฟู',
    petSpecies: 'DOG',
    petBreed: 'พุดเดิ้ล ทอย (Poodle Toy)',
    petWeight: 3.2,
  },
  {
    customerId: 'c5',
    customerName: 'คุณปรียา สดใส',
    customerPhone: '086-789-0123',
    petId: 'p5',
    petName: 'น้องบะหมี่',
    petSpecies: 'CAT',
    petBreed: 'เปอร์เซีย (Persian)',
    petWeight: 4.8,
    petBehavior: 'ดุนิดหน่อยเวลาตัดสังกะตัง',
  },
  {
    customerId: 'c6',
    customerName: 'คุณธัญญ่า สุวรรณภูมิ',
    customerPhone: '081-999-1111',
    customerLine: 'thanya_k',
    petId: 'p6',
    petName: 'เจ้าชาบู',
    petSpecies: 'DOG',
    petBreed: 'โกลเด้น รีทรีฟเวอร์',
    petWeight: 29.0,
    petAllergies: 'แพ้แชมพูสมุนไพร',
  },
];

interface PresetService {
  id: string;
  name: string;
  category: 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA';
  durationMinutes: number;
  priceMinor: number;
  badge: string;
}

const PRESET_SERVICES: PresetService[] = [
  {
    id: 's1',
    name: 'อาบน้ำ + ตัดแต่งทรงกรูมมิ่ง สุนัขพันธุ์เล็ก',
    category: 'GROOMING',
    durationMinutes: 90,
    priceMinor: 55000,
    badge: 'ยอดนิยม',
  },
  {
    id: 's2',
    name: 'อาบน้ำกำจัดขนผลัด + สปาโอโซน สุนัขใหญ่',
    category: 'SPA',
    durationMinutes: 120,
    priceMinor: 95000,
    badge: 'พรีเมียม',
  },
  {
    id: 's3',
    name: 'อาบน้ำเป่าขน + ตัดเล็บเช็ดหู สุนัข/แมว',
    category: 'GROOMING',
    durationMinutes: 45,
    priceMinor: 35000,
    badge: 'พื้นฐาน',
  },
  {
    id: 's4',
    name: 'ตัดสังกะตัง + อาบน้ำตัดเล็บ แมวขนยาว',
    category: 'GROOMING',
    durationMinutes: 75,
    priceMinor: 65000,
    badge: 'แมว',
  },
  {
    id: 's5',
    name: 'ตรวจสุขภาพทั่วไป + ปรึกษาสัตวแพทย์',
    category: 'CLINIC',
    durationMinutes: 30,
    priceMinor: 40000,
    badge: 'คลินิก',
  },
  {
    id: 's6',
    name: 'ฉีดวัคซีนรวมสุนัข 6 โรค / วัคซีนแมว',
    category: 'VACCINE',
    durationMinutes: 20,
    priceMinor: 35000,
    badge: 'วัคซีน',
  },
  {
    id: 's7',
    name: 'สปาน้ำแร่ ออนเซ็นผ่อนคลายกล้ามเนื้อ',
    category: 'SPA',
    durationMinutes: 60,
    priceMinor: 60000,
    badge: 'สปา',
  },
];

interface PresetStaff {
  id: string;
  name: string;
  nickname: string;
  role: 'GROOMER' | 'VETERINARIAN';
  avatarBg: string;
  avatarText: string;
}

const PRESET_STAFF: PresetStaff[] = [
  { id: 'auto', name: 'ไม่ระบุ (ระบบจัดคิวว่างอัตโนมัติ)', nickname: 'คิวว่างอัตโนมัติ', role: 'GROOMER', avatarBg: 'bg-slate-100 text-slate-700', avatarText: 'Auto' },
  { id: 'u-groomer-01', name: 'เอกชัย สกิลทอง (ช่างกรูมมิ่ง)', nickname: 'ช่างเอก', role: 'GROOMER', avatarBg: 'bg-teal-100 text-teal-700', avatarText: 'เอก' },
  { id: 'u-vet-01', name: 'สพ.ญ. น้ำใส ใจดี (สัตวแพทย์)', nickname: 'หมอน้ำใส', role: 'VETERINARIAN', avatarBg: 'bg-purple-100 text-purple-700', avatarText: 'น้ำใส' },
];

const TIME_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export function NewAppointmentModal() {
  const { isOpen, closeBookingModal, prefill, notifyAppointmentCreated } = useBooking();

  // Mode
  const [bookingMode, setBookingMode] = useState<'APPOINTMENT' | 'GROOMING_QUEUE' | 'CLINIC'>('APPOINTMENT');

  // Customer & Pet state
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');

  // New Customer Form inputs
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerLine, setNewCustomerLine] = useState('');
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<'DOG' | 'CAT'>('DOG');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetWeight, setNewPetWeight] = useState('4.0');
  const [newPetAllergies, setNewPetAllergies] = useState('');

  // Service & Staff state
  const [serviceCategory, setServiceCategory] = useState<'ALL' | 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA'>('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState('s1');
  const [selectedStaffId, setSelectedStaffId] = useState('auto');

  // Date & Time state
  const [bookingDate, setBookingDate] = useState('2026-08-25');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [customDuration, setCustomDuration] = useState<number | null>(null);

  // Notes & Channel
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'LINE' | 'PHONE' | 'WALK_IN' | 'ONLINE_BOOKING'>('LINE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Apply Prefill when modal opens
  useEffect(() => {
    if (prefill) {
      if (prefill.date) setBookingDate(prefill.date);
      if (prefill.time) setBookingTime(prefill.time);
      if (prefill.staffId) setSelectedStaffId(prefill.staffId);
      if (prefill.serviceId) setSelectedServiceId(prefill.serviceId);
      if (prefill.mode) setBookingMode(prefill.mode);
    }
  }, [prefill]);

  // Selected Service
  const activeService = PRESET_SERVICES.find((s) => s.id === selectedServiceId) || PRESET_SERVICES[0];
  const duration = customDuration ?? activeService.durationMinutes;

  // Filtered Services
  const filteredServices = PRESET_SERVICES.filter((s) => {
    if (serviceCategory === 'ALL') return true;
    return s.category === serviceCategory;
  });

  // Filtered Customers
  const filteredCustomers = PRESET_CUSTOMERS.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.includes(q) ||
      c.petName.toLowerCase().includes(q) ||
      c.petBreed.toLowerCase().includes(q)
    );
  });

  const selectedPresetCustomer = PRESET_CUSTOMERS[selectedCustomerIndex] || PRESET_CUSTOMERS[0];

  // Calculate End Time with 15-min Buffer
  const calculateEndTime = (startTime: string, dur: number) => {
    const [hours, mins] = startTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + dur;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const calculatedEndTime = calculateEndTime(bookingTime, duration);

  // Conflict Detection Engine & 15-Minute Cleaning Buffer (Item 6)
  const isConflict = useMemo(() => {
    if (bookingDate === '2026-08-25') {
      if ((selectedStaffId === 'u-groomer-01' || selectedStaffId === 'u1') && (bookingTime === '09:00' || bookingTime === '09:30' || bookingTime === '14:00')) {
        return {
          staffName: 'ช่างเอก',
          occupiedTime: '09:00 - 10:30',
          bufferMinutes: 15,
          reason: 'มีคิวนัดกรูมมิ่ง [น้องโมจิ] อยู่แล้ว + บัฟเฟอร์ทำความสะอาดโต๊ะ 15 นาที',
          suggestedTimes: ['10:45', '11:00', '15:15'],
        };
      }
      if ((selectedStaffId === 'u-vet-01' || selectedStaffId === 'u2') && (bookingTime === '10:00' || bookingTime === '14:00')) {
        return {
          staffName: 'หมอน้ำใส',
          occupiedTime: '10:00 - 10:45',
          bufferMinutes: 15,
          reason: 'มีคิวตรวจรักษา [น้องชาโคล] อยู่แล้ว + บัฟเฟอร์เตรียมห้องตรวจ 15 นาที',
          suggestedTimes: ['11:00', '11:30', '15:00'],
        };
      }
    }
    return null;
  }, [bookingDate, selectedStaffId, bookingTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetStaff = PRESET_STAFF.find((s) => s.id === selectedStaffId) || PRESET_STAFF[1];

    const customerData = isNewCustomer
      ? {
          customerId: `c-new-${Date.now()}`,
          customerName: newCustomerName || 'ลูกค้าใหม่ (Walk-in)',
          customerPhone: newCustomerPhone || '081-000-0000',
          customerLine: newCustomerLine || undefined,
          petId: `p-new-${Date.now()}`,
          petName: newPetName || 'น้องสัตว์เลี้ยง',
          petSpecies: newPetSpecies,
          petBreed: newPetBreed || (newPetSpecies === 'DOG' ? 'สุนัขพันธุ์ผสม' : 'แมวไทย'),
          petWeight: parseFloat(newPetWeight) || 3.5,
          petAllergies: newPetAllergies || undefined,
        }
      : selectedPresetCustomer;

    const startIso = `${bookingDate}T${bookingTime}:00.000Z`;
    const endIso = `${bookingDate}T${calculatedEndTime}:00.000Z`;

    const newAppointment: CreatedAppointmentEventData = {
      id: `apt-${Date.now()}`,
      customerId: customerData.customerId,
      customerName: customerData.customerName,
      customerPhone: customerData.customerPhone,
      customerLine: customerData.customerLine,
      petId: customerData.petId,
      petName: customerData.petName,
      petSpecies: customerData.petSpecies,
      petBreed: customerData.petBreed,
      petWeight: customerData.petWeight,
      petAllergies: customerData.petAllergies,
      petBehavior: (customerData as any).petBehavior,
      serviceId: activeService.id,
      serviceName: activeService.name,
      serviceCategory: activeService.category,
      staffId: targetStaff.id === 'auto' ? 'u1' : targetStaff.id,
      staffName: targetStaff.id === 'auto' ? 'ช่างเอก (จัดคิวอัตโนมัติ)' : targetStaff.nickname,
      startAt: startIso,
      endAt: endIso,
      status: bookingMode === 'GROOMING_QUEUE' ? 'IN_PROGRESS' : 'CONFIRMED',
      priceMinor: activeService.priceMinor,
      notes: notes || undefined,
      source: source,
    };

    setTimeout(() => {
      notifyAppointmentCreated(newAppointment);
      setIsSubmitting(false);
      setSuccessMessage('🎉 บันทึกการจองนัดหมายสำเร็จ และเพิ่มลงในปฏิทินเรียบร้อยแล้ว!');
      setTimeout(() => {
        setSuccessMessage(null);
        closeBookingModal();
      }, 1200);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0071e3] dark:bg-blue-950 dark:text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                เพิ่มนัดหมาย / ลงทะเบียนคิวใหม่ (New Booking)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สร้างรายการนัดหมายล่วงหน้า หรือเปิดคิวด่วนหน้าร้าน
              </p>
            </div>
          </div>
          <button
            onClick={closeBookingModal}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="m-4 p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-900 dark:text-white">
          {/* Booking Type Pill Selector */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setBookingMode('APPOINTMENT')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                bookingMode === 'APPOINTMENT'
                  ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              นัดหมายล่วงหน้า
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('GROOMING_QUEUE')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                bookingMode === 'GROOMING_QUEUE'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              คิวกรูมมิ่งหน้าร้าน
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('CLINIC')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                bookingMode === 'CLINIC'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              ตรวจรักษา OPD
            </button>
          </div>

          {/* Section 1: Customer & Pet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0071e3]" />
                1. ข้อมูลลูกค้า & สัตว์เลี้ยง (Customer & Pet)
              </label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1"
              >
                {isNewCustomer ? '← เลือกลูกค้าเดิมที่มีในระบบ' : '+ เพิ่มลูกค้า/น้องใหม่ด่วน'}
              </button>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-2">
                {/* Search / Select Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  {filteredCustomers.map((item, idx) => {
                    const isSelected = selectedCustomerIndex === idx;
                    return (
                      <button
                        type="button"
                        key={item.petId}
                        onClick={() => setSelectedCustomerIndex(idx)}
                        className={`p-2.5 rounded-xl text-left border transition flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#0071e3] text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${item.petSpecies === 'DOG' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                          {item.petSpecies === 'DOG' ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{item.petName} <span className="font-normal text-[11px] opacity-70">({item.customerName})</span></p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.petBreed} • {item.customerPhone}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Pet Detail Summary */}
                <div className="p-3 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">น้อง {selectedPresetCustomer.petName}</span>
                    <span className="text-slate-500">({selectedPresetCustomer.petBreed}, {selectedPresetCustomer.petWeight} kg)</span>
                  </div>
                  {selectedPresetCustomer.petAllergies && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                      <ShieldAlert className="w-3 h-3" />
                      {selectedPresetCustomer.petAllergies}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Quick Create Customer Inputs */
              <div className="p-4 bg-blue-50/40 dark:bg-slate-800/60 rounded-2xl border border-blue-200/80 dark:border-blue-900 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">ชื่อ-นามสกุล เจ้าของ</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คุณกมลวรรณ ทรัพย์เจริญ"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">เบอร์โทรศัพท์ (จำเป็น)</label>
                    <input
                      type="tel"
                      required
                      placeholder="08X-XXX-XXXX"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">ชื่อสัตว์เลี้ยง</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น น้องโบชิ"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">ประเภทสัตว์</label>
                    <select
                      value={newPetSpecies}
                      onChange={(e) => setNewPetSpecies(e.target.value as 'DOG' | 'CAT')}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DOG">🐕 สุนัข (Dog)</option>
                      <option value="CAT">🐈 แมว (Cat)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">สายพันธุ์</label>
                    <input
                      type="text"
                      placeholder="เช่น ชิสุ, เฟรนช์"
                      value={newPetBreed}
                      onChange={(e) => setNewPetBreed(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">น้ำหนัก (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4.0"
                      value={newPetWeight}
                      onChange={(e) => setNewPetWeight(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Service Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#0071e3]" />
                2. เลือกรายการบริการ (Select Service)
              </label>
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {(['ALL', 'GROOMING', 'CLINIC', 'VACCINE', 'SPA'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setServiceCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-full font-semibold transition ${
                      serviceCategory === cat
                        ? 'bg-[#0071e3] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'ALL' ? 'ทั้งหมด' : cat === 'GROOMING' ? 'กรูมมิ่ง' : cat === 'CLINIC' ? 'คลินิก' : cat === 'VACCINE' ? 'วัคซีน' : 'สปา'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {filteredServices.map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => {
                      setSelectedServiceId(svc.id);
                      setCustomDuration(null);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#0071e3] text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{svc.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.durationMinutes} นาที</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">฿{(svc.priceMinor / 100).toLocaleString()}</span>
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Staff Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0071e3]" />
              3. ผู้ให้บริการ / ช่าง / สัตวแพทย์ (Assigned Staff)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_STAFF.map((st) => {
                const isSelected = selectedStaffId === st.id;
                return (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setSelectedStaffId(st.id)}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-[#0071e3] text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${st.avatarBg}`}>
                      {st.avatarText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{st.nickname}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{st.role === 'GROOMER' ? 'กรูมเมอร์' : 'สัตวแพทย์'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Date, Time & Duration */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
              4. วันและเวลานัดหมาย (Date & Time)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">วันที่</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">เวลาเริ่ม</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t} น.</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">ระยะเวลา / สิ้นสุด</label>
                <div className="mt-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>{duration} นาที</span>
                  <span className="text-blue-600 dark:text-blue-400">ถึง {calculatedEndTime} น.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Notes & Source Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">หมายเหตุพิเศษ / ทรงตัด / อาการ</label>
              <input
                type="text"
                placeholder="เช่น ตัดทรง Teddy Bear, ระวังเจ็บขาหลัง"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ช่องทางการจอง</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="LINE">🟢 LINE Official Account</option>
                <option value="PHONE">📞 โทรศัพท์ (Phone)</option>
                <option value="WALK_IN">🚶 หน้าร้าน (Walk-in)</option>
                <option value="ONLINE_BOOKING">🌐 จองออนไลน์ (Web/App)</option>
              </select>
            </div>
          </div>

          {/* Booking Summary & Conflict Warning Box (PF-017 / Item 6) */}
          {isConflict ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  ⚠️ ตรวจพบคิวซ้อนทับ (Booking Conflict Detected)
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-black uppercase">
                  ชนคิวเดิม
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                <strong>{isConflict.staffName}</strong> {isConflict.reason}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">ช่วงเวลาว่างแนะนำ:</span>
                {isConflict.suggestedTimes.map((st: string) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBookingTime(st)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 text-xs font-bold text-[#0071e3] hover:bg-blue-50 transition cursor-pointer"
                  >
                    {st} น.
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-blue-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">สรุปยอดประเมิน</p>
                <p className="text-base font-extrabold text-[#0071e3] dark:text-blue-400">
                  ฿{(activeService.priceMinor / 100).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({duration} นาที + บัฟเฟอร์ 15 นาที)</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ตารางเวลาว่าง พร้อมรับนัด</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={closeBookingModal}
              disabled={isSubmitting}
              className="text-xs font-semibold px-4 rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs font-bold px-5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shadow-blue-500/25"
            >
              {isSubmitting ? 'กำลังบันทึก...' : '✨ ยืนยันการจอง (+ บันทึกนัดหมาย)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

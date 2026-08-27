'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Phone,
  MessageSquare,
  Clock,
  User,
  Dog,
  Cat,
  CheckCircle2,
  Scissors,
  Stethoscope,
  Syringe,
  Sparkles,
  Receipt,
  Clock4,
  Check,
  XCircle,
  ExternalLink,
  ShieldAlert,
  HeartPulse,
} from 'lucide-react';
import { Button } from '@petflow/ui';

export interface AppointmentDetailData {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  customerAddress?: string;
  petId: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed: string;
  petWeight: number;
  petMicrochip?: string;
  petAllergies?: string;
  petBehavior?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA';
  staffId: string;
  staffName: string;
  staffRole?: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priceMinor: number;
  notes?: string;
  source: 'LINE' | 'PHONE' | 'WALK_IN' | 'ONLINE_BOOKING';
  history?: Array<{
    id: string;
    date: string;
    serviceName: string;
    staffName: string;
    amount: string;
  }>;
}

interface AppointmentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentDetailData | null;
  onStatusChange: (id: string, newStatus: AppointmentDetailData['status']) => void;
}

export function AppointmentDetailDrawer({
  isOpen,
  onClose,
  appointment,
  onStatusChange,
}: AppointmentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'cautions'>('overview');

  if (!isOpen || !appointment) return null;

  const renderStatusBadge = (status: AppointmentDetailData['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <Clock4 className="w-3.5 h-3.5 text-amber-500" />
            รอยืนยันนัดหมาย
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0071e3] border border-blue-200 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0071e3]" />
            ยืนยันนัดหมายแล้ว
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            เช็คอินหน้าร้านแล้ว
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse shadow-xs">
            <Scissors className="w-3.5 h-3.5 text-emerald-600" />
            กำลังให้บริการ
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            บริการเสร็จสิ้น
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            ยกเลิกนัดหมาย
          </span>
        );
    }
  };

  const getCategoryIcon = (category: AppointmentDetailData['serviceCategory']) => {
    switch (category) {
      case 'GROOMING':
        return <Scissors className="w-4 h-4 text-[#0071e3]" />;
      case 'CLINIC':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'VACCINE':
        return <Syringe className="w-4 h-4 text-indigo-600" />;
      case 'SPA':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  const mockDefaultHistory = [
    {
      id: 'h1',
      date: '10 ส.ค. 2026',
      serviceName: 'อาบน้ำ + ตัดขนทรงหมี',
      staffName: 'ช่างเอก',
      amount: '550 ฿',
    },
    {
      id: 'h2',
      date: '15 ก.ค. 2026',
      serviceName: 'ฉีดวัคซีนพิษสุนัขบ้า + ถ่ายพยาธิ',
      staffName: 'หมอวิภา',
      amount: '450 ฿',
    },
    {
      id: 'h3',
      date: '20 มิ.ย. 2026',
      serviceName: 'อาบน้ำกำจัดขนผลัด + สปาโอโซน',
      staffName: 'ช่างแนน',
      amount: '650 ฿',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* 1. Header */}
          <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    ID: {appointment.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#0071e3]">
                    {appointment.source}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  รายละเอียดนัดหมาย (Appointment)
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition shadow-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Fast Action Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-apple">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  สถานะปัจจุบัน:
                </span>
                <div className="mt-0.5">{renderStatusBadge(appointment.status)}</div>
              </div>

              <div className="flex items-center gap-1.5">
                {appointment.status === 'PENDING' && (
                  <button
                    onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0071e3] hover:bg-blue-100 text-xs font-bold transition shadow-xs"
                  >
                    ✓ ยืนยันนัด
                  </button>
                )}
                {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                  <button
                    onClick={() => onStatusChange(appointment.id, 'CHECKED_IN')}
                    className="px-3 py-1.5 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ed] text-xs font-bold transition shadow-xs shadow-blue-500/25"
                  >
                    เช็คอินรับน้อง
                  </button>
                )}
                {appointment.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => onStatusChange(appointment.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition shadow-xs shadow-emerald-600/20"
                  >
                    เริ่มบริการ
                  </button>
                )}
                {appointment.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold transition shadow-xs"
                  >
                    เสร็จสิ้น
                  </button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-200/80 dark:border-slate-700 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ภาพรวม & ข้อมูล
              </button>
              <button
                onClick={() => setActiveTab('cautions')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'cautions'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                คำเตือน & บันทึก
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ประวัติรับบริการ
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Pet Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0071e3] flex items-center justify-center font-bold">
                        {appointment.petSpecies === 'DOG' ? (
                          <Dog className="w-6 h-6" />
                        ) : (
                          <Cat className="w-6 h-6 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {appointment.petName}
                          </h3>
                          <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/60 text-slate-500">
                            {appointment.petSpecies}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          {appointment.petBreed} • น้ำหนัก: <strong>{appointment.petWeight} กก.</strong>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/pets/${appointment.petId}`}
                      className="text-[#0071e3] hover:underline flex items-center gap-1 font-semibold"
                    >
                      ดูโปรไฟล์น้อง <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Customer Contact Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      ข้อมูลเจ้าของ (Customer)
                    </span>
                    <Link
                      href={`/customers/${appointment.customerId}`}
                      className="text-[#0071e3] hover:underline font-semibold"
                    >
                      โปรไฟล์ลูกค้า &gt;
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {appointment.customerName}
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">ลูกค้าสมาชิกระดับ Gold</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${appointment.customerPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0071e3] font-bold transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {appointment.customerPhone}
                      </a>
                      {appointment.customerLine && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                          <MessageSquare className="w-3.5 h-3.5" />
                          LINE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Details & Schedule */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    รายละเอียดบริการ & ค่าใช้จ่าย (Service & Pricing)
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        {getCategoryIcon(appointment.serviceCategory)}
                        บริการ:
                      </span>
                      <strong className="text-slate-900 dark:text-white">{appointment.serviceName}</strong>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        เวลานัดหมาย:
                      </span>
                      <span className="font-bold text-[#0071e3]">
                        09:00 - 10:30 น. (90 นาที)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        ผู้ให้บริการ:
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">{appointment.staffName}</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-medium">ยอดชำระประเมิน:</span>
                      <span className="text-base font-black text-[#0071e3]">
                        {(appointment.priceMinor / 100).toLocaleString('th-TH')} บาท
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CAUTIONS & NOTES */}
            {activeTab === 'cautions' && (
              <div className="space-y-4">
                {/* Health / Allergy Box */}
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-apple space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    ประวัติแพ้ยา / แชมพู / สุขภาพ
                  </div>
                  <p className="text-rose-900 dark:text-rose-300 font-medium leading-relaxed">
                    {appointment.petAllergies || 'ไม่มีประวัติแพ้ที่ระบุไว้ในระบบ'}
                  </p>
                </div>

                {/* Behavior Box */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-apple space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                    <HeartPulse className="w-4 h-4" />
                    พฤติกรรม & ข้อควรระวังพิเศษ
                  </div>
                  <p className="text-amber-900 dark:text-amber-300 font-medium leading-relaxed">
                    {appointment.petBehavior || 'น้องไม่มีพฤติกรรมดุหรือตื่นกลัวเป็นพิเศษ'}
                  </p>
                </div>

                {/* Appointment Notes */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple space-y-2">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    บันทึกประจำนัดหมายนี้ (Appointment Notes)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                    {appointment.notes || 'ไม่มีบันทึกเพิ่มเติม'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  ประวัติการเข้ารับบริการ 3 ครั้งล่าสุด
                </span>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple overflow-hidden">
                  {(appointment.history || mockDefaultHistory).map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{item.serviceName}</p>
                          <span className="text-[10px] text-slate-400">
                            วันที่: {item.date} • โดย: {item.staffName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">{item.amount}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">ชำระแล้ว</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Modal Actions Footer */}
          <div className="p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition"
              >
                ยกเลิกนัด
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/grooming/queue">
                <button className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  ส่งเข้าคิวกรูมมิ่ง
                </button>
              </Link>
              <Button
                onClick={onClose}
                className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-4 py-2"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

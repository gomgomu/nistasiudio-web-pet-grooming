'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Send,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  X,
  Stethoscope,
  Building2,
  Phone,
  MessageSquare,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { ClinicalFollowUpItem, FollowUpSummary } from '@petflow/types';

// Mock Initial Follow-ups
const MOCK_FOLLOW_UPS: ClinicalFollowUpItem[] = [
  {
    id: 'fu-v101',
    tenantId: 't-1',
    visitId: 'v-101',
    visitNumber: 'VN-2026-0089',
    petId: 'p-1',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    customerId: 'c-1',
    customerName: 'คุณกนกวรรณ ศรีสุข',
    customerPhone: '089-111-2233',
    lineUserId: 'U111',
    veterinarianId: 'vet-1',
    veterinarianName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
    followUpDate: '2026-09-03',
    followUpReason: 'นัดตรวจซ้ำส่องกล้องเซลล์วิทยาในช่องหู (Ear Cytology Recheck)',
    diagnosis: 'Right Otitis Externa (ภาวะช่องหูส่วนนอกอักเสบจากยีสต์)',
    daysUntilDue: 7,
    urgency: 'UPCOMING',
    reminderStatus: 'PENDING',
    lastReminderSentAt: null,
  },
  {
    id: 'fu-v104',
    tenantId: 't-1',
    visitId: 'v-104',
    visitNumber: 'VN-2026-0088',
    petId: 'p-4',
    petName: 'น้องบ๊อบบี้',
    species: 'DOG',
    breed: 'Golden Retriever',
    customerId: 'c-4',
    customerName: 'คุณกิตติศักดิ์ มีชัย',
    customerPhone: '081-111-2222',
    lineUserId: 'U444',
    veterinarianId: 'vet-1',
    veterinarianName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
    followUpDate: '2026-08-27',
    followUpReason: 'นัดตรวจติดตามแผลผ่าตัดทำหมันและตัดไหม (Suture Removal)',
    diagnosis: 'Post-op neutering wound check',
    daysUntilDue: 0,
    urgency: 'DUE_TODAY',
    reminderStatus: 'PENDING',
    lastReminderSentAt: null,
  },
  {
    id: 'fu-v105',
    tenantId: 't-1',
    visitId: 'v-105',
    visitNumber: 'VN-2026-0075',
    petId: 'p-5',
    petName: 'น้องมีมี่',
    species: 'CAT',
    breed: 'Persian',
    customerId: 'c-5',
    customerName: 'คุณสุดารัตน์ เจริญสุข',
    customerPhone: '086-444-5555',
    lineUserId: null,
    veterinarianId: 'vet-2',
    veterinarianName: 'สพ.ญ. อริศรา ภัทรเดช',
    followUpDate: '2026-08-25',
    followUpReason: 'ตรวจติดตามภาวะกระจกตาอักเสบ Fluorescein stain recheck',
    diagnosis: 'Corneal Ulcer (แผลที่กระจกตา)',
    daysUntilDue: -2,
    urgency: 'OVERDUE',
    reminderStatus: 'PENDING',
    lastReminderSentAt: null,
  },
];

export default function FollowUpRemindersPage() {
  const [items, setItems] = useState<ClinicalFollowUpItem[]>(MOCK_FOLLOW_UPS);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1-Click LINE Dispatch Modal
  const [activeDispatchItem, setActiveDispatchItem] = useState<ClinicalFollowUpItem | null>(null);
  const [dispatchChannel, setDispatchChannel] = useState<'LINE' | 'SMS'>('LINE');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterUrgency !== 'ALL' && item.urgency !== filterUrgency) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        item.petName.toLowerCase().includes(s) ||
        item.customerName.toLowerCase().includes(s) ||
        item.customerPhone.includes(s) ||
        item.followUpReason.toLowerCase().includes(s) ||
        (item.diagnosis && item.diagnosis.toLowerCase().includes(s)) ||
        (item.visitNumber && item.visitNumber.toLowerCase().includes(s))
      );
    });
  }, [items, filterUrgency, searchTerm]);

  const dueTodayCount = items.filter((i) => i.urgency === 'DUE_TODAY').length;
  const overdueCount = items.filter((i) => i.urgency === 'OVERDUE').length;
  const upcomingCount = items.filter((i) => i.urgency === 'UPCOMING').length;

  const handleOpenDispatch = (item: ClinicalFollowUpItem) => {
    setActiveDispatchItem(item);
    setDispatchChannel(item.lineUserId ? 'LINE' : 'SMS');
    setCustomMessage(
      `🐾 [แจ้งเตือนนัดตรวจติดตามอาการ - PetFlow สาขาทองหล่อ]\n\nเรียน คุณ${item.customerName}\nคลินิกขอแจ้งเตือนวันนัดตรวจซ้ำของ ${item.petName}\n\n📅 วันที่: ${new Date(item.followUpDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}\n🩺 เหตุผล: ${item.followUpReason}\n👨‍⚕️ สัตวแพทย์: ${item.veterinarianName || 'สัตวแพทย์'}\n\nหากท่านต้องการยืนยันเวลานัดหมายหรือเลื่อนนัด กรุณาตอบกลับข้อความนี้ หรือโทร 02-123-4567\nขอบคุณที่ไว้วางใจให้เราดูแล ${item.petName} ครับ 💙`
    );
  };

  const handleSendReminder = () => {
    if (!activeDispatchItem) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      // Mark as sent
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeDispatchItem.id
            ? {
                ...i,
                reminderStatus: 'SENT',
                lastReminderSentAt: new Date().toISOString(),
              }
            : i
        )
      );
      setTimeout(() => {
        setSendSuccess(false);
        setActiveDispatchItem(null);
      }, 1200);
    }, 600);
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/clinical" className="hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> คิวตรวจรักษา (Clinical OPD)
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0071e3] font-bold">แจ้งเตือนติดตามอาการ (Follow-up Reminders)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-[#0071e3]" /> นัดตรวจติดตามอาการ & แจ้งเตือน LINE (Follow-up Engine)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ดึงรายการนัดตรวจซ้ำ (Recheck) และตัดไหมจาก SOAP Note พร้อมระบบส่ง LINE Message หาเจ้าของ 1-Click
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterUrgency('DUE_TODAY')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterUrgency === 'DUE_TODAY'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 dark:bg-emerald-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">ครบกำหนดวันนี้ (Due Today)</span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {dueTodayCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">ต้องตรวจซ้ำ/ตัดไหมวันนี้</span>
        </div>

        <div
          onClick={() => setFilterUrgency('OVERDUE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterUrgency === 'OVERDUE'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/40 dark:bg-rose-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">เกินกำหนดนัด (Overdue)</span>
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">
            {overdueCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">ยังไม่ได้กลับมาตรวจซ้ำ</span>
        </div>

        <div
          onClick={() => setFilterUrgency('UPCOMING')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterUrgency === 'UPCOMING'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 dark:bg-blue-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase">นัดใน 7-14 วัน (Upcoming)</span>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">
            {upcomingCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">เตรียมส่งเตือนล่วงหน้า</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase">ส่งแจ้งเตือนแล้วเดือนนี้</span>
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-purple-600 mt-2">
            38 <span className="text-xs font-medium text-slate-500">ครั้ง</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">LINE Flex & SMS Reminders</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterUrgency('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterUrgency === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            📋 ทั้งหมด ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterUrgency('DUE_TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterUrgency === 'DUE_TODAY'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            ⏰ ครบกำหนดวันนี้ ({dueTodayCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterUrgency('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterUrgency === 'OVERDUE'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            🚨 เกินกำหนด ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterUrgency('UPCOMING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterUrgency === 'UPCOMING'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300'
            }`}
          >
            📅 นัดล่วงหน้า ({upcomingCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ, เหตุผลที่นัด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-apple hover:shadow-md ${
              item.urgency === 'OVERDUE'
                ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-500/20'
                : item.urgency === 'DUE_TODAY'
                ? 'border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-purple-500/20 shrink-0">
                  {item.species === 'DOG' ? '🐶' : '🐱'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {item.petName}
                    </span>
                    <span className="text-xs text-slate-500">({item.breed || 'ไม่ระบุสายพันธุ์'})</span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.visitNumber}
                    </span>
                    {item.lineUserId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        💬 LINE Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        📱 SMS
                      </span>
                    )}

                    {item.urgency === 'OVERDUE' && (
                      <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 px-2 py-0.5 rounded-full">
                        🚨 เกินกำหนด {Math.abs(item.daysUntilDue)} วัน
                      </span>
                    )}
                    {item.urgency === 'DUE_TODAY' && (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        ⏰ ครบกำหนดวันนี้
                      </span>
                    )}
                    {item.urgency === 'UPCOMING' && (
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        📅 อีก {item.daysUntilDue} วัน
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>
                      <User className="w-3 h-3 inline text-slate-400" /> {item.customerName}
                    </span>
                    <span>•</span>
                    <span>
                      <Phone className="w-3 h-3 inline text-slate-400" /> {item.customerPhone}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      สัตวแพทย์: {item.veterinarianName || 'น.สพ. วรปรัชญ์'}
                    </span>
                  </div>

                  {/* Follow-up reason */}
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">เหตุผลที่นัดตรวจซ้ำ:</span>{' '}
                      {item.followUpReason}
                    </div>
                    {item.diagnosis && (
                      <div className="text-[11px] text-[#0071e3] font-semibold">
                        วินิจฉัยเดิม: {item.diagnosis}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2 shrink-0">
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    วันนัด: {new Date(item.followUpDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    สถานะการแจ้งเตือน:{' '}
                    {item.reminderStatus === 'SENT' ? '🟢 ส่งข้อความแล้ว' : '⏳ รอส่งเตือน'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDispatch(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" /> ส่งเตือน LINE / SMS
                  </button>
                  <Link
                    href={`/clinical/visits/${item.visitId}/soap`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition"
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> SOAP
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-medium"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 1-Click LINE Dispatch Modal */}
      {activeDispatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  ส่งข้อความแจ้งเตือนนัดติดตามอาการ (Quick Dispatch)
                </h3>
              </div>
              <button onClick={() => setActiveDispatchItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendSuccess ? (
              <div className="p-8 text-center space-y-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ส่งข้อความแจ้งเตือนสำเร็จ!
                </h4>
                <p className="text-xs text-slate-500">
                  ระบบได้ส่งข้อความผ่านทาง LINE ไปยัง {activeDispatchItem.customerName} เรียบร้อยแล้ว
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-300 block">
                        สัตว์เลี้ยง: {activeDispatchItem.petName} ({activeDispatchItem.species})
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        ผู้รับ: {activeDispatchItem.customerName} ({activeDispatchItem.customerPhone})
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                      {activeDispatchItem.lineUserId ? '🟢 LINE Official' : '📱 SMS'}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ข้อความแจ้งเตือน (Message Preview):
                    </label>
                    <textarea
                      rows={8}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveDispatchItem(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReminder}
                    disabled={isSending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'กำลังส่งข้อความ...' : 'ยืนยันและส่งข้อความทันที'}
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

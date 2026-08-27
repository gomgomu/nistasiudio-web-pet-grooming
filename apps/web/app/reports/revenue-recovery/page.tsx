'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Scissors,
  Syringe,
  Sparkles,
  AlertTriangle,
  UserX,
  Repeat,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Download,
  Building2,
  CheckCircle2,
  Send,
  Zap,
  Phone,
  MessageSquare,
  Search,
  X,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import {
  RevenueRecoverySummary,
  RevenueRecoveryOpportunityItem,
} from '@petflow/types';

// Mock Summary Data
const MOCK_SUMMARY: RevenueRecoverySummary = {
  totalOpportunityMinor: 10126800, // 101,268 THB
  recoveredRevenueMinor: 2610000, // 26,100 THB
  recoveryRate: 25.8, // 25.8%
  recoveredCustomersCount: 18,
  noShowLostMinor: 1170000, // 11,700 THB
  noShowCount: 18,
  inactiveCustomerOpportunityMinor: 4486800, // 44,868 THB
  inactiveCustomersCount: 52,
  groomingDueOpportunityMinor: 2850000, // 28,500 THB
  groomingDuePetsCount: 45,
  vaccineDueOpportunityMinor: 1620000, // 16,200 THB
  vaccineDuePetsCount: 27,
  periodStart: '2026-07-28T00:00:00Z',
  periodEnd: '2026-08-27T23:59:59Z',
};

// Mock Actionable Opportunities
const MOCK_OPPORTUNITIES: RevenueRecoveryOpportunityItem[] = [
  {
    id: 'opp-1',
    type: 'VACCINE_DUE',
    typeLabel: 'ครบกำหนดวัคซีน (Vaccine Due)',
    customerId: 'cust-1',
    customerName: 'คุณกนกวรรณ ศรีสุข',
    customerPhone: '089-111-2233',
    lineUserId: 'U111',
    petId: 'p-1',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    estimatedRevenueMinor: 65000,
    urgency: 'CRITICAL',
    daysSinceLastVisit: 60,
    suggestedAction: 'ส่งแจ้งเตือนวัคซีนรวมสุนัขประจำปี',
    suggestedTemplate: 'เรียนคุณกนกวรรณ น้องโมจิ ถึงรอบฉีดวัคซีนรวมและพิษสุนัขบ้าประจำปีแล้ว เพื่อสุขภาพที่ดีของน้อง นัดหมายตรวจสุขภาพได้เลยครับ',
  },
  {
    id: 'opp-2',
    type: 'GROOMING_DUE',
    typeLabel: 'ถึงรอบกรูมมิ่ง (Grooming Due)',
    customerId: 'cust-2',
    customerName: 'คุณธนภัทร รัตนเวช',
    customerPhone: '081-999-8877',
    lineUserId: 'U222',
    petId: 'p-2',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    estimatedRevenueMinor: 45000,
    urgency: 'HIGH',
    daysSinceLastVisit: 50,
    suggestedAction: 'ส่งแจ้งเตือนอาบน้ำสปาแมว',
    suggestedTemplate: 'สวัสดีครับคุณธนภัทร น้องชาโคล ไม่ได้มาอาบน้ำสปา 50 วันแล้ว จองคิวสปาผ่อนคลายวันหยุดนี้รับฟรีทรีตเมนต์บำรุงขนครับ',
  },
  {
    id: 'opp-3',
    type: 'AT_RISK_CUSTOMER',
    typeLabel: 'ลูกค้ากลุ่มเสี่ยงหลุดหาย (At-Risk)',
    customerId: 'cust-3',
    customerName: 'คุณพิมลดา วงศ์สว่าง',
    customerPhone: '084-555-6677',
    lineUserId: 'U333',
    petId: 'p-3',
    petName: 'น้องถ้วยฟู',
    species: 'DOG',
    breed: 'Poodle Toy',
    estimatedRevenueMinor: 85000,
    urgency: 'HIGH',
    daysSinceLastVisit: 75,
    suggestedAction: 'ส่งแคมเปญคูปอง Win-Back 15%',
    suggestedTemplate: 'PetFlow คิดถึงน้องถ้วยฟู มอบคูปองส่วนลดพิเศษ 15% สำหรับบริการตัดแต่งขนสไตล์หมี จองคิวได้เลยครับ!',
  },
  {
    id: 'opp-4',
    type: 'NO_SHOW_FOLLOWUP',
    typeLabel: 'ติดตามลูกค้าผิดนัด (No-Show Follow-up)',
    customerId: 'cust-4',
    customerName: 'คุณกิตติศักดิ์ มีชัย',
    customerPhone: '081-111-2222',
    lineUserId: 'U444',
    petId: 'p-4',
    petName: 'น้องบ๊อบบี้',
    species: 'DOG',
    breed: 'Golden Retriever',
    estimatedRevenueMinor: 85000,
    urgency: 'CRITICAL',
    daysSinceLastVisit: 10,
    suggestedAction: 'ส่งข้อความนัดหมายใหม่ & บังคับมัดจำ 50%',
    suggestedTemplate: 'เรียนคุณกิตติศักดิ์ ทางร้านขออภัยในความไม่สะดวก หากท่านต้องการจองคิวบริการกรูมมิ่งใหม่อีกครั้ง สามารถแจ้งวันเวลาที่สะดวกได้เลยครับ',
  },
  {
    id: 'opp-5',
    type: 'GROOMING_DUE',
    typeLabel: 'ถึงรอบกรูมมิ่ง (Grooming Due)',
    customerId: 'cust-5',
    customerName: 'คุณวรวิทย์ จันทร์เพ็ญ',
    customerPhone: '086-333-4455',
    lineUserId: null,
    petId: 'p-5',
    petName: 'น้องลัคกี้',
    species: 'DOG',
    breed: 'Shih Tzu',
    estimatedRevenueMinor: 55000,
    urgency: 'MEDIUM',
    daysSinceLastVisit: 42,
    suggestedAction: 'โทรนัดหมายล่วงหน้า (ไม่มี LINE)',
    suggestedTemplate: 'น้องลัคกี้ถึงรอบตัดขนแล้ว แนะนำโทรนัดคิวช่วงบ่ายเสาร์-อาทิตย์',
  },
];

export default function RevenueRecoveryPage() {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<RevenueRecoveryOpportunityItem | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const summary = MOCK_SUMMARY;

  const filteredOpportunities = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((opp) => {
      if (filterType !== 'ALL' && opp.type !== filterType) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        opp.customerName.toLowerCase().includes(s) ||
        opp.customerPhone.includes(s) ||
        (opp.petName && opp.petName.toLowerCase().includes(s))
      );
    });
  }, [filterType, searchTerm]);

  const handleOpenDispatch = (opp: RevenueRecoveryOpportunityItem) => {
    setSelectedOpportunity(opp);
    setCustomMessage(opp.suggestedTemplate);
    setIsModalOpen(true);
    setSendSuccess(false);
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSendSuccess(false);
      }, 1200);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/reports" className="hover:text-slate-900 dark:hover:text-white">
          รายงาน & วิเคราะห์ (Reports)
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-purple-600 dark:text-purple-400 font-bold">
          ศูนย์กู้คืนรายได้ & ป้องกันคิวว่าง (Revenue Recovery Command Center)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ศูนย์กู้คืนรายได้ & ป้องกันคิวว่าง (Revenue Recovery Hub)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
              <Zap className="w-3 h-3 text-purple-600" /> Revenue Protection Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            รวบรวมมูลค่ารายได้ที่หลุดลอยไปจาก 4 ช่องทางหลัก พร้อมปุ่มกดส่งแจ้งเตือน LINE ดึงลูกค้ากลับเข้าร้านแบบ 1-Click
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/retention/campaigns"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" /> จัดการแคมเปญ Win-Back
          </Link>
        </div>
      </div>

      {/* Executive Hero Metric Card (Apple UI Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/15">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                <Flame className="w-3 h-3 text-amber-300" /> High-Impact Recovery Engine
              </span>
              <span className="text-xs text-purple-100">30 วันล่าสุด</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              โอกาสสร้างรายได้เพิ่มทั้งหมด ฿{(summary.totalOpportunityMinor / 100).toLocaleString('th-TH')}
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
              กู้คืนรายได้สำเร็จแล้ว <span className="font-bold text-white">฿{(summary.recoveredRevenueMinor / 100).toLocaleString('th-TH')} ({summary.recoveryRate}%)</span> โดยมีลูกค้า {summary.recoveredCustomersCount} รายกลับมาใช้บริการ
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0 text-center">
            <div>
              <span className="text-[11px] text-purple-200 uppercase font-bold tracking-wider">กู้คืนสำเร็จ</span>
              <div className="text-2xl font-black text-emerald-300 mt-0.5">
                ฿{(summary.recoveredRevenueMinor / 100).toLocaleString('th-TH')}
              </div>
              <span className="text-[10px] text-purple-100">{summary.recoveredCustomersCount} ลูกค้ากลับมา</span>
            </div>
            <div>
              <span className="text-[11px] text-purple-200 uppercase font-bold tracking-wider">Recovery Rate</span>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {summary.recoveryRate}%
              </div>
              <span className="text-[10px] text-purple-100">เป้าหมาย &gt; 30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary Opportunity Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Grooming Due */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">ถึงรอบตัดขน (Grooming)</span>
              <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                <Scissors className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              ฿{(summary.groomingDueOpportunityMinor / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              สัตว์เลี้ยงถึงรอบ {summary.groomingDuePetsCount} ตัว
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/retention/grooming-due" className="text-[#0071e3] font-semibold hover:underline">
              ดูสัตว์เลี้ยง &gt;
            </Link>
            <span className="text-blue-600 font-medium">Auto-detector</span>
          </div>
        </div>

        {/* Pillar 2: Vaccine Due */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">ครบกำหนดวัคซีน (Vaccine)</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                <Syringe className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              ฿{(summary.vaccineDueOpportunityMinor / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              ครบกำหนด {summary.vaccineDuePetsCount} ตัว
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/retention/vaccine-due" className="text-emerald-600 font-semibold hover:underline">
              ดูรายการวัคซีน &gt;
            </Link>
            <span className="text-emerald-600 font-medium">Clinical risk</span>
          </div>
        </div>

        {/* Pillar 3: At-Risk & Lost Inactive */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">ลูกค้าขาดการติดต่อ (Inactive)</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              ฿{(summary.inactiveCustomerOpportunityMinor / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              กลุ่ม At-Risk & Lost {summary.inactiveCustomersCount} ราย
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/retention" className="text-amber-600 font-semibold hover:underline">
              ดู RFM Matrix &gt;
            </Link>
            <span className="text-amber-600 font-medium">Win-back ready</span>
          </div>
        </div>

        {/* Pillar 4: No-Show Lost Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">สูญเสีย No-Show</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                <UserX className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
              ฿{(summary.noShowLostMinor / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              ผิดนัด {summary.noShowCount} คิว
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/reports/no-show" className="text-rose-600 font-semibold hover:underline">
              ตั้งค่านโยบายมัดจำ &gt;
            </Link>
            <span className="text-rose-600 font-medium">Deposit policy</span>
          </div>
        </div>
      </div>

      {/* Actionable Opportunities Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              รายการโอกาสสร้างรายได้ที่ต้องดำเนินการด่วน (Actionable Opportunities)
            </h3>
            <p className="text-xs text-slate-500">
              กดส่งแจ้งเตือน LINE หาเจ้าของสัตว์เลี้ยง หรือเปิดการบังคับมัดจำแบบ 1-Click
            </p>
          </div>

          {/* Type Filter & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">🔍 ทุกประเภทโอกาส</option>
              <option value="GROOMING_DUE">✂️ รอบกรูมมิ่ง</option>
              <option value="VACCINE_DUE">💉 ครบกำหนดวัคซีน</option>
              <option value="AT_RISK_CUSTOMER">⚠️ ลูกค้ากลุ่มเสี่ยง</option>
              <option value="NO_SHOW_FOLLOWUP">🚫 ลูกค้าผิดนัด</option>
            </select>

            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อลูกค้า/สัตว์เลี้ยง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">ลูกค้า & สัตว์เลี้ยง</th>
                <th className="py-3 px-4">ประเภทโอกาส</th>
                <th className="py-3 px-4 text-center">ความเร่งด่วน</th>
                <th className="py-3 px-4 text-center">ไม่มานาน</th>
                <th className="py-3 px-4 text-right">มูลค่าประมาณการ</th>
                <th className="py-3 px-4">การดำเนินการที่แนะนำ</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOpportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{opp.customerName}</div>
                    <div className="text-[11px] font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                      {opp.petName && (
                        <span>
                          {opp.species === 'DOG' ? '🐶' : '🐱'} {opp.petName} ({opp.breed || ''})
                        </span>
                      )}
                      <span>• {opp.customerPhone}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {opp.typeLabel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        opp.urgency === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          : opp.urgency === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}
                    >
                      {opp.urgency === 'CRITICAL' ? '🚨 ด่วนที่สุด' : opp.urgency === 'HIGH' ? '⚠️ ด่วน' : 'ปกติ'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                    {opp.daysSinceLastVisit} วัน
                  </td>

                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                    ฿{(opp.estimatedRevenueMinor / 100).toLocaleString('th-TH')}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {opp.suggestedAction}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDispatch(opp)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition active:scale-95"
                    >
                      <Send className="w-3 h-3" /> ส่ง LINE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Dispatch Modal */}
      {isModalOpen && selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    ส่งข้อความกู้คืนรายได้ผ่าน LINE
                  </h3>
                  <p className="text-xs text-slate-500">ลูกค้า: {selectedOpportunity.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs space-y-1 text-purple-900 dark:text-purple-300">
              <div className="font-bold">🎯 ประเภทโอกาส: {selectedOpportunity.typeLabel}</div>
              <div>• สัตว์เลี้ยง: {selectedOpportunity.petName || 'สัตว์เลี้ยงของลูกค้า'}</div>
              <div>• มูลค่าประมาณการ: ฿{(selectedOpportunity.estimatedRevenueMinor / 100).toLocaleString('th-TH')}</div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                ข้อความ LINE ที่จะส่งหาลูกค้า:
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {sendSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ส่งข้อความ LINE สำเร็จเรียบร้อย!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSend}
                  className="px-4 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'กำลังส่ง...' : 'ยืนยันการส่ง LINE'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

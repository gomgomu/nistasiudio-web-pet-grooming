'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  Heart,
  Thermometer,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  FileText,
  Syringe,
  Pill,
  Building2,
  Phone,
  BellRing,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { ClinicVisitItem, ClinicVisitStatus, ClinicVisitType } from '@petflow/types';

// Mock Clinical Visits OPD Queue
const MOCK_VISITS: ClinicVisitItem[] = [
  {
    id: 'v-101',
    tenantId: 't-1',
    branchId: 'b-1',
    branchName: 'สาขาทองหล่อ',
    customerId: 'c-1',
    customerName: 'คุณกนกวรรณ ศรีสุข',
    customerPhone: '089-111-2233',
    lineUserId: 'U111',
    petId: 'p-1',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    photoUrl: null,
    allergies: 'แพ้ยาฆ่าเชื้อกลุ่มเพนิซิลลิน',
    veterinarianId: 'u-vet-01',
    veterinarianName: 'สพ.ญ. น้ำใส ใจดี',
    visitNumber: 'VN-2026-0089',
    status: 'IN_CONSULTATION',
    visitType: 'SICK_VISIT',
    chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่นและสะเก็ดสีดำ',
    symptoms: 'มีขี้หูดำสะเก็ด คันใบหูข้างขวา',
    diagnosis: 'Right Otitis Externa (ภาวะช่องหูส่วนนอกอักเสบจากยีสต์)',
    differentialDiagnosis: 'Ear mite infestation',
    vitals: {
      weightKg: 4.5,
      temperatureC: 38.6,
      heartRateBpm: 120,
      respiratoryRateBpm: 24,
      capillaryRefillTime: '< 2s',
      mucousMembrane: 'Pink, Moist',
      bodyConditionScore: 5,
    },
    subjective: 'เจ้าของสังเกตว่าสุนัขเกาหูบ่อยมา 3 วัน ไม่ยอมให้จับใบหู ร้องเจ็บ ทานอาหารปกติ',
    objective: 'ตรวจช่องหูขวาพบ Erythema, Ceruminous discharge สีน้ำตาลดำ Cytology: Malassezia pachydermatis (3+)',
    assessment: 'Right Otitis Externa caused by Malassezia overgrowth',
    plan: '1. Flush ear with Epi-Otic\n2. Dexoryl ear drops 5 drops BID x 7 days\n3. Recheck cytology in 7 days',
    treatmentSummary: 'ล้างทำความสะอาดช่องหู และหยอดยารักษา',
    dischargeNotes: 'งดให้น้ำเข้าหู ใส่คอลลาร์ป้องกันการเกา',
    followUpDate: '2026-09-03',
    followUpReason: 'นัดตรวจซ้ำและส่องกล้องดูเซลล์หู (Ear Cytology Recheck)',
    visitedAt: '2026-08-27T10:15:00Z',
    completedAt: null,
    createdAt: '2026-08-27T10:15:00Z',
    prescriptionsCount: 2,
    treatmentsCount: 1,
  },
  {
    id: 'v-102',
    tenantId: 't-1',
    branchId: 'b-1',
    branchName: 'สาขาทองหล่อ',
    customerId: 'c-2',
    customerName: 'คุณธนภัทร รัตนเวช',
    customerPhone: '081-999-8877',
    lineUserId: 'U222',
    petId: 'p-2',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    photoUrl: null,
    allergies: null,
    veterinarianId: 'u-vet-01',
    veterinarianName: 'สพ.ญ. น้ำใส ใจดี',
    visitNumber: 'VN-2026-0090',
    status: 'WAITING',
    visitType: 'VACCINATION',
    chiefComplaint: 'ฉีดวัคซีนรวมแมวและพิษสุนัขบ้าประจำปี',
    symptoms: 'สุขภาพทั่วไปแข็งแรงดี ร่าเริง',
    diagnosis: 'Healthy cat for annual vaccination',
    vitals: {
      weightKg: 5.2,
      temperatureC: 38.3,
      heartRateBpm: 140,
      respiratoryRateBpm: 28,
      capillaryRefillTime: '< 2s',
      mucousMembrane: 'Pink',
      bodyConditionScore: 6,
    },
    visitedAt: '2026-08-27T10:45:00Z',
    completedAt: null,
    createdAt: '2026-08-27T10:45:00Z',
  },
  {
    id: 'v-103',
    tenantId: 't-1',
    branchId: 'b-1',
    branchName: 'สาขาทองหล่อ',
    customerId: 'c-3',
    customerName: 'คุณพิมลดา วงศ์สว่าง',
    customerPhone: '084-555-6677',
    lineUserId: 'U333',
    petId: 'p-3',
    petName: 'น้องถ้วยฟู',
    species: 'DOG',
    breed: 'Poodle Toy',
    photoUrl: null,
    allergies: null,
    veterinarianId: 'u-vet-01',
    veterinarianName: 'สพ.ญ. น้ำใส ใจดี',
    visitNumber: 'VN-2026-0091',
    status: 'WAITING',
    visitType: 'GENERAL_CHECKUP',
    chiefComplaint: 'ตรวจสุขภาพประจำปี และตรวจคราบหินปูนในช่องปาก',
    symptoms: 'มีกลิ่นปากเล็กน้อย',
    vitals: {
      weightKg: 3.1,
      temperatureC: 38.4,
      heartRateBpm: 110,
    },
    visitedAt: '2026-08-27T11:00:00Z',
    completedAt: null,
    createdAt: '2026-08-27T11:00:00Z',
  },
  {
    id: 'v-104',
    tenantId: 't-1',
    branchId: 'b-1',
    branchName: 'สาขาทองหล่อ',
    customerId: 'c-4',
    customerName: 'คุณกิตติศักดิ์ มีชัย',
    customerPhone: '081-111-2222',
    lineUserId: 'U444',
    petId: 'p-4',
    petName: 'น้องบ๊อบบี้',
    species: 'DOG',
    breed: 'Golden Retriever',
    photoUrl: null,
    allergies: null,
    veterinarianId: 'u-vet-01',
    veterinarianName: 'สพ.ญ. น้ำใส ใจดี',
    visitNumber: 'VN-2026-0088',
    status: 'COMPLETED',
    visitType: 'FOLLOW_UP',
    chiefComplaint: 'ตรวจติดตามแผลผ่าตัดทำหมัน',
    symptoms: 'แผลแห้งดี ไม่มีหนองหรือบวมแดง',
    diagnosis: 'Surgical wound healing well - Suture removal',
    vitals: {
      weightKg: 28.5,
      temperatureC: 38.5,
    },
    treatmentSummary: 'ตัดไหมผ่าตัดทำหมัน ทำความสะอาดแผล',
    visitedAt: '2026-08-27T09:30:00Z',
    completedAt: '2026-08-27T10:00:00Z',
    createdAt: '2026-08-27T09:30:00Z',
  },
];

export default function ClinicalHubPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredVisits = useMemo(() => {
    return MOCK_VISITS.filter((v) => {
      if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
      if (filterType !== 'ALL' && v.visitType !== filterType) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        v.petName.toLowerCase().includes(s) ||
        v.customerName.toLowerCase().includes(s) ||
        v.customerPhone.includes(s) ||
        (v.chiefComplaint && v.chiefComplaint.toLowerCase().includes(s)) ||
        (v.diagnosis && v.diagnosis.toLowerCase().includes(s)) ||
        (v.visitNumber && v.visitNumber.toLowerCase().includes(s))
      );
    });
  }, [filterStatus, filterType, searchTerm]);

  const waitingCount = MOCK_VISITS.filter((v) => v.status === 'WAITING').length;
  const inConsultCount = MOCK_VISITS.filter((v) => v.status === 'IN_CONSULTATION' || v.status === 'EXAMINATION' || v.status === 'TREATMENT').length;
  const completedCount = MOCK_VISITS.filter((v) => v.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ห้องตรวจรักษา & เวชระเบียน (Clinical OPD Hub)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <Activity className="w-3 h-3 text-emerald-600" /> Veterinary Core Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            คิวตรวจรักษาผู้ป่วยนอก (OPD Queue), บันทึกเวชระเบียน SOAP, ตรวจสัญญาณชีพ และการสั่งยา
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/clinical/follow-ups"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <BellRing className="w-4 h-4" /> นัดตรวจซ้ำ & แจ้งเตือน (Follow-ups)
          </Link>
          <Link
            href="/clinical/vaccinations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Syringe className="w-4 h-4" /> ทะเบียนวัคซีน (Vaccines)
          </Link>
          <Link
            href="/clinical/visits/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> เปิดใบตรวจรักษาใหม่ (New Visit)
          </Link>
        </div>
      </div>

      {/* OPD Live Status KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Waiting */}
        <div
          onClick={() => setFilterStatus('WAITING')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'WAITING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 dark:bg-amber-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              รอตรวจ (Waiting OPD)
            </span>
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {waitingCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">สัตว์เลี้ยงมาถึงแล้ว นั่งรอในล็อบบี้</span>
        </div>

        {/* In Consultation */}
        <div
          onClick={() => setFilterStatus('IN_CONSULTATION')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'IN_CONSULTATION'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 dark:bg-blue-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              กำลังตรวจรักษา (In Exam)
            </span>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700">
              <Stethoscope className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {inConsultCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">อยู่ในห้องตรวจกับสัตวแพทย์</span>
        </div>

        {/* Completed */}
        <div
          onClick={() => setFilterStatus('COMPLETED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'COMPLETED'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 dark:bg-emerald-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              ตรวจเสร็จสิ้นวันนี้ (Completed)
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {completedCount} <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">รับยา / จ่ายเงิน / กลับบ้านแล้ว</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">📋 สถานะทั้งหมด</option>
            <option value="WAITING">⏳ รอตรวจ (Waiting)</option>
            <option value="IN_CONSULTATION">🩺 กำลังตรวจรักษา (In Exam)</option>
            <option value="COMPLETED">✅ ตรวจเสร็จสิ้น (Completed)</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">🏥 ทุกประเภทการตรวจ</option>
            <option value="GENERAL_CHECKUP">🩺 ตรวจสุขภาพทั่วไป</option>
            <option value="SICK_VISIT">🩹 ป่วย / มีอาการ</option>
            <option value="VACCINATION">💉 วัคซีนประจำปี</option>
            <option value="FOLLOW_UP">🔄 ตรวจติดตามอาการ</option>
            <option value="SURGERY">✂️ ผ่าตัด / ทำหมัน</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ, เลข VN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* OPD Visits List */}
      <div className="space-y-3">
        {filteredVisits.map((visit) => {
          const isWaiting = visit.status === 'WAITING';
          const isInConsult = visit.status === 'IN_CONSULTATION' || visit.status === 'EXAMINATION' || visit.status === 'TREATMENT';

          return (
            <div
              key={visit.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-apple hover:shadow-md ${
                isInConsult
                  ? 'border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Pet Info & Chief Complaint */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-500/20 shrink-0">
                    {visit.species === 'DOG' ? '🐶' : '🐱'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        {visit.petName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({visit.breed || 'ไม่ระบุสายพันธุ์'})
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                        {visit.visitNumber}
                      </span>
                      {visit.allergies && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3" /> {visit.allergies}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {visit.customerName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {visit.customerPhone}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        สัตวแพทย์: {visit.veterinarianName || 'ยังไม่กำหนด'}
                      </span>
                    </div>

                    {/* Chief Complaint */}
                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white">อาการสำคัญ (CC):</span>{' '}
                      {visit.chiefComplaint || 'ตรวจสุขภาพทั่วไป'}
                      {visit.diagnosis && (
                        <div className="mt-1 font-semibold text-[#0071e3] dark:text-blue-400">
                          วินิจฉัย (Dx): {visit.diagnosis}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Vitals & Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                  {/* Vitals Summary Pill */}
                  <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ⚖️ {visit.vitals?.weightKg || '-'} kg
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      🌡️ {visit.vitals?.temperatureC || '-'} °C
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ❤️ {visit.vitals?.heartRateBpm || '-'} bpm
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/clinical/visits/${visit.id}/soap`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 ${
                        isInConsult
                          ? 'bg-[#0071e3] hover:bg-[#005bb5] text-white animate-pulse'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      {isInConsult ? 'เปิดห้องตรวจ (SOAP Workspace)' : isWaiting ? 'เริ่มตรวจรักษา (Start SOAP)' : 'ดูเวชระเบียน (View SOAP)'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

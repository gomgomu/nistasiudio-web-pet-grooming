'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Dog,
  Cat,
  User,
  Phone,
  MessageCircle,
  AlertTriangle,
  HeartPulse,
  Syringe,
  FileText,
  Scissors,
  Plus,
  Edit,
  ShieldAlert,
  ChevronRight,
  Clock,
  Receipt,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';

export default function PetDetailPage() {
  const params = useParams();
  const petId = params.id as string;
  const [activeTab, setActiveTab] = useState<'timeline' | 'clinical' | 'vaccines' | 'grooming'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'CLINICAL' | 'VACCINE' | 'GROOMING' | 'INVOICE'>('ALL');

  // Mock Pet Data
  const pet = {
    id: petId,
    name: 'โมจิ (Mochi)',
    species: 'DOG' as const,
    breed: 'Pomeranian (ปอมเมอเรเนียน)',
    sex: 'FEMALE',
    birthDate: '2023-04-10 (อายุ 3 ปี 4 เดือน)',
    weight: '3.25',
    microchipNumber: '900182001928374',
    isActive: true,
    photoUrl: null,
    allergies: 'แพ้ยาฆ่าเชื้อกลุ่ม Amoxicillin และ Clavamox (มีอาการหน้าบวม ผื่นแดง)',
    behavioralNotes: 'กลัวเสียงไดร์เป่าขนตัวใหญ่ ต้องใช้ไดร์เก็บเสียง ห้ามผูกสายรัดคอแน่น',
    specialRequirements: 'ชอบให้เกาหลังใบหู ทานขนมเนื้อแกะฟรีซดรายได้',
    owner: {
      id: 'c1111111-1111-4111-a111-111111111111',
      name: 'คุณกนกวรรณ รักดี',
      phone: '089-111-2233',
      lineUserId: 'U123456789',
      address: '123/45 ซ.สุขุมวิท 39 วัฒนา กทม.',
    },
    stats: {
      totalVisits: 8,
      lastGrooming: '18 ส.ค. 2026',
      lastVaccine: '10 มิ.ย. 2026',
      nextDueVaccine: '10 มิ.ย. 2027 (วัคซีนรวมประจำปี)',
    },
    timeline: [
      {
        id: 't1',
        type: 'GROOMING' as const,
        date: '18 ส.ค. 2026 14:30',
        title: 'Full Grooming (อาบน้ำ + ตัดแต่งทรงหมี Teddy Bear Cut)',
        actor: 'ช่างบอย (Groomer)',
        badgeColor: 'amber',
        status: 'COMPLETED',
        details: 'แชมพูสูตร Sensitive Skin Hypoallergenic น้องน่ารักไม่งอแง เป่าแห้งสนิทด้วยไดร์เก็บเสียง',
      },
      {
        id: 't2',
        type: 'INVOICE' as const,
        date: '18 ส.ค. 2026 15:45',
        title: 'ชำระค่าบริการ #INV-2026-088',
        actor: 'แคชเชียร์ 01',
        badgeColor: 'emerald',
        status: 'PAID',
        details: 'ยอดชำระ: ฿850.00 (ชำระผ่าน PromptPay QR)',
      },
      {
        id: 't3',
        type: 'CLINICAL' as const,
        date: '10 ส.ค. 2026 10:30',
        title: 'ตรวจรักษา: ผิวหนังอักเสบจากความชื้น (Mild Dermatitis)',
        actor: 'สพ.ญ. วรรณภา ใจเมตตา',
        badgeColor: 'sky',
        status: 'COMPLETED',
        details: 'จ่ายยาทา Chlorhexidine spray พ่นเช้า-เย็น 7 วัน พร้อมแชมพูยาอาบน้ำสัปดาห์ละ 2 ครั้ง',
      },
      {
        id: 't4',
        type: 'VACCINE' as const,
        date: '10 มิ.ย. 2026 14:00',
        title: 'ฉีดวัคซีนรวมสุนัข 5 โรค (DHPPiL) + พิษสุนัขบ้า',
        actor: 'น.สพ. ปริญญา วงศ์เวช',
        badgeColor: 'purple',
        status: 'COMPLETED',
        details: 'Lot: VAC-2026-09 ตรวจสุขภาพก่อนฉีดแข็งแรงดี นัดกระตุ้นครั้งถัดไป 10 มิ.ย. 2027',
      },
      {
        id: 't5',
        type: 'APPOINTMENT' as const,
        date: '05 มิ.ย. 2026 09:15',
        title: 'จองคิวนัดหมายล่วงหน้าผ่าน LINE Official',
        actor: 'ระบบอัตโนมัติ (LINE Bot)',
        badgeColor: 'indigo',
        status: 'CONFIRMED',
        details: 'ลูกค้ายืนยันเวลานัดตรวจสุขภาพและฉีดวัคซีนประจำปี',
      },
    ],
    clinicalRecords: [
      {
        id: 'mr1',
        date: '2026-08-10 10:30',
        vetName: 'สพ.ญ. วรรณภา ใจเมตตา',
        diagnosis: 'ผิวหนังอักเสบจากความชื้น (Mild Dermatitis)',
        soap: {
          s: 'เจ้าของแจ้งว่าน้องเกาบริเวณโคนหางและใต้ท้องบ่อยขึ้นหลังเล่นน้ำ',
          o: 'T: 38.6°C, W: 3.25 kg, ตรวจพบ Erythema เล็กน้อยบริเวณ Ventral abdomen ไม่พบบาดแผลลึก',
          a: 'Superficial bacterial dermatitis secondary to moisture',
          p: 'จ่ายยาทา Chlorhexidine spray พ่นเช้า-เย็น 7 วัน พร้อมแชมพูยาอาบน้ำสัปดาห์ละ 2 ครั้ง',
        },
      },
      {
        id: 'mr2',
        date: '2026-06-10 14:00',
        vetName: 'น.สพ. ปริญญา วงศ์เวช',
        diagnosis: 'ตรวจสุขภาพประจำปี + ฉีดวัคซีนรวม 5 โรค',
        soap: {
          s: 'พามาฉีดวัคซีนประจำปี น้องร่าเริง ทานอาหารขับถ่ายปกติ',
          o: 'T: 38.4°C, W: 3.20 kg, สุขภาพสมบูรณ์ ฟันสะอาด ไม่มีคราบหินปูนรุนแรง',
          a: 'Healthy dog for annual vaccination',
          p: 'ฉีดวัคซีนรวม DHPPiL (Lot: VAC-2026-09) นัดกระตุ้นพิษสุนัขบ้าปีถัดไป',
        },
      },
    ],
    vaccinations: [
      {
        id: 'v1',
        name: 'วัคซีนรวมสุนัข 5 โรค (DHPPiL)',
        date: '2026-06-10',
        nextDue: '2027-06-10',
        vet: 'น.สพ. ปริญญา',
        lot: 'VAC-2026-09',
        status: 'UP_TO_DATE',
      },
      {
        id: 'v2',
        name: 'วัคซีนป้องกันโรคพิษสุนัขบ้า (Rabies)',
        date: '2026-06-10',
        nextDue: '2027-06-10',
        vet: 'น.สพ. ปริญญา',
        lot: 'RAB-2026-44',
        status: 'UP_TO_DATE',
      },
    ],
    groomingHistory: [
      {
        id: 'g1',
        date: '2026-08-18',
        service: 'Full Grooming (อาบน้ำ + ตัดแต่งทรงหมี Teddy Bear Cut)',
        groomer: 'ช่างบอย',
        shampoo: 'Sensitive Skin Hypoallergenic Shampoo',
        notes: 'น้องไม่ชอบไดร์ตัวใหญ่ ใช้ไดร์มือเก็บเสียงเป่าจนแห้งสนิท ตัดเล็บเรียบร้อย',
      },
    ],
  };

  const filteredTimeline = pet.timeline.filter((event) => {
    if (timelineFilter === 'ALL') return true;
    return event.type === timelineFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/customers/${pet.owner.id}`}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{pet.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                สถานะ: พร้อมรับบริการ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {pet.breed} • รหัสสัตว์เลี้ยง: {pet.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-apple transition cursor-pointer">
            <Edit className="w-3.5 h-3.5" />
            แก้ไขข้อมูลน้อง
          </button>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition active:scale-[0.98] cursor-pointer">
            <Scissors className="w-3.5 h-3.5" />
            เปิดคิวตัดขน
          </button>
        </div>
      </div>

      {/* Critical Warnings Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pet.allergies && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                ประวัติแพ้ยา / แพ้อาหาร (Critical Allergies)
              </h3>
              <p className="text-xs text-rose-800 mt-1 font-semibold leading-relaxed">
                {pet.allergies}
              </p>
            </div>
          </div>
        )}

        {pet.behavioralNotes && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                ข้อควรระวังด้านพฤติกรรม & การจับบังคับ (Behavior Warnings)
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {pet.behavioralNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pet Overview & Owner Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Pet Physical Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 flex items-center justify-center shadow-inner">
              {pet.species === 'DOG' ? <Dog className="w-8 h-8" /> : <Cat className="w-8 h-8 text-sky-600" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">{pet.name}</h2>
              <p className="text-xs text-slate-400 font-mono">Microchip: {pet.microchipNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50">
              <span className="text-slate-400 block mb-0.5">เพศ</span>
              <span className="font-bold text-slate-800">{pet.sex === 'FEMALE' ? 'เมีย (Female)' : 'ผู้ (Male)'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50">
              <span className="text-slate-400 block mb-0.5">น้ำหนักล่าสุด</span>
              <span className="font-bold text-emerald-600">{pet.weight} กก. (kg)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 col-span-2">
              <span className="text-slate-400 block mb-0.5">วันเกิด / อายุ</span>
              <span className="font-bold text-slate-800">{pet.birthDate}</span>
            </div>

            {pet.specialRequirements && (
              <div className="p-2.5 rounded-xl bg-slate-50 col-span-2">
                <span className="text-slate-400 block mb-0.5">ความต้องการพิเศษ</span>
                <span className="text-slate-700">{pet.specialRequirements}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Card: Owner Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-slate-900">ข้อมูลเจ้าของ (Owner)</h2>
            </div>

            <Link
              href={`/customers/${pet.owner.id}`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              ดูประวัติลูกค้า
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">ชื่อเจ้าของ</span>
              <span className="font-bold text-slate-900 text-sm">{pet.owner.name}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <a href={`tel:${pet.owner.phone}`} className="font-semibold hover:text-emerald-600">
                {pet.owner.phone}
              </a>
            </div>

            {pet.owner.lineUserId && (
              <div className="flex items-center gap-2 text-slate-700">
                <MessageCircle className="w-3.5 h-3.5 text-[#06C755]" />
                <span className="font-mono text-[11px] text-slate-600">LINE Connected ({pet.owner.lineUserId})</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-slate-500">
              <span className="text-slate-400 block mb-0.5">ที่อยู่</span>
              <p className="leading-relaxed">{pet.owner.address}</p>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Health Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-slate-900">สรุปการเข้ารับบริการ</h2>
            </div>

            <div className="space-y-2.5 text-xs pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">เข้าใช้บริการทั้งหมด:</span>
                <span className="font-bold text-slate-800">{pet.stats.totalVisits} ครั้ง</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">ตัดขนล่าสุด:</span>
                <span className="font-semibold text-slate-800">{pet.stats.lastGrooming}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">ฉีดวัคซีนล่าสุด:</span>
                <span className="font-semibold text-slate-800">{pet.stats.lastVaccine}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 block mb-1">ครบกำหนดฉีดวัคซีนถัดไป:</span>
            <span className="text-amber-800 font-semibold">{pet.stats.nextDueVaccine}</span>
          </div>
        </div>
      </div>

      {/* Tabs: Unified Timeline, Clinical Notes, Vaccines, Grooming History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            ไทม์ไลน์รวม (Unified Timeline) ({pet.timeline.length})
          </button>

          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'clinical'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            เวชระเบียน & การรักษา ({pet.clinicalRecords.length})
          </button>

          <button
            onClick={() => setActiveTab('vaccines')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'vaccines'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            ประวัติวัคซีน ({pet.vaccinations.length})
          </button>

          <button
            onClick={() => setActiveTab('grooming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'grooming'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            ประวัติอาบน้ำตัดขน ({pet.groomingHistory.length})
          </button>
        </div>

        {/* Tab 0: Unified Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" />
                  หมวดหมู่:
                </span>
                {[
                  { id: 'ALL' as const, label: 'ทั้งหมด' },
                  { id: 'CLINICAL' as const, label: 'ตรวจรักษา (Clinical)' },
                  { id: 'VACCINE' as const, label: 'วัคซีน (Vaccine)' },
                  { id: 'GROOMING' as const, label: 'ตัดขน (Grooming)' },
                  { id: 'INVOICE' as const, label: 'ชำระเงิน (POS)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTimelineFilter(f.id)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      timelineFilter === f.id
                        ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {filteredTimeline.length} เหตุการณ์
              </span>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-3 my-4">
              {filteredTimeline.map((item) => {
                let icon = <Clock className="w-4 h-4" />;
                let dotBg = 'bg-slate-600 text-white';

                if (item.type === 'CLINICAL') {
                  icon = <HeartPulse className="w-4 h-4" />;
                  dotBg = 'bg-sky-500 text-white';
                } else if (item.type === 'VACCINE') {
                  icon = <Syringe className="w-4 h-4" />;
                  dotBg = 'bg-purple-500 text-white';
                } else if (item.type === 'GROOMING') {
                  icon = <Scissors className="w-4 h-4" />;
                  dotBg = 'bg-amber-500 text-white';
                } else if (item.type === 'INVOICE') {
                  icon = <Receipt className="w-4 h-4" />;
                  dotBg = 'bg-emerald-500 text-white';
                } else if (item.type === 'APPOINTMENT') {
                  icon = <Calendar className="w-4 h-4" />;
                  dotBg = 'bg-indigo-500 text-white';
                }

                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-[35px] top-1 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${dotBg}`}
                    >
                      {icon}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <span className="text-xs text-slate-400">{item.date}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>ผู้ดำเนินการ: <strong className="text-slate-700">{item.actor}</strong></span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Clinical SOAP Notes */}
        {activeTab === 'clinical' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">บันทึกประวัติการตรวจรักษา (SOAP Medical Notes)</h3>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition">
                <Plus className="w-3.5 h-3.5" />
                เพิ่มบันทึกการรักษาใหม่ (+ SOAP Note)
              </button>
            </div>

            <div className="space-y-3">
              {pet.clinicalRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{record.diagnosis}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{record.date}</span>
                      <span>• โดย: <strong className="text-slate-700">{record.vetName}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <strong className="text-slate-700 font-semibold block text-[11px] uppercase tracking-wider text-emerald-700">
                        [S] Subjective (อาการที่เจ้าของแจ้ง)
                      </strong>
                      <p className="text-slate-600">{record.soap.s}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <strong className="text-slate-700 font-semibold block text-[11px] uppercase tracking-wider text-sky-700">
                        [O] Objective (ผลตรวจร่างกาย)
                      </strong>
                      <p className="text-slate-600">{record.soap.o}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <strong className="text-slate-700 font-semibold block text-[11px] uppercase tracking-wider text-amber-700">
                        [A] Assessment (การวินิจฉัย)
                      </strong>
                      <p className="text-slate-600">{record.soap.a}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <strong className="text-slate-700 font-semibold block text-[11px] uppercase tracking-wider text-purple-700">
                        [P] Plan & Treatment (แผนการรักษา/ยา)
                      </strong>
                      <p className="text-slate-600">{record.soap.p}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Vaccinations */}
        {activeTab === 'vaccines' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {pet.vaccinations.map((vac) => (
              <div key={vac.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Syringe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{vac.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ฉีดเมื่อ: {vac.date} • Lot: {vac.lot} • สัตวแพทย์: {vac.vet}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ครบกำหนดนัดถัดไป: {vac.nextDue}
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ครบถ้วนตามเกณฑ์
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Grooming History */}
        {activeTab === 'grooming' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {pet.groomingHistory.map((g) => (
              <div key={g.id} className="p-4 space-y-2 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{g.service}</span>
                  </div>
                  <span className="text-xs text-slate-400">วันที่: {g.date} • ช่างผู้ดูแล: <strong className="text-slate-700">{g.groomer}</strong></span>
                </div>

                <div className="pl-10 text-xs text-slate-600 space-y-1">
                  <p><strong className="text-slate-700">แชมพูที่ใช้: </strong>{g.shampoo}</p>
                  <p><strong className="text-slate-700">บันทึกการตัดขน: </strong>{g.notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

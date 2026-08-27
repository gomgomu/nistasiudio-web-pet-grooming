'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Syringe,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Printer,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  X,
  Building2,
  Phone,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { VaccinationRecordItem, VaccineType } from '@petflow/types';

// Mock Initial Vaccinations
const MOCK_VACCINATIONS: VaccinationRecordItem[] = [
  {
    id: 'vac-101',
    tenantId: 't-1',
    petId: 'p-1',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    customerId: 'c-1',
    customerName: 'คุณกนกวรรณ ศรีสุข',
    customerPhone: '089-111-2233',
    clinicVisitId: 'v-101',
    visitNumber: 'VN-2026-0089',
    productId: 'prod-vac-1',
    administeredById: 'vet-1',
    administeredByName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
    vaccineType: 'DOG_CORE_5_IN_1',
    vaccineName: 'Nobivac DHPPi + L (วัคซีนรวมสุนัข 5 โรค)',
    manufacturer: 'MSD Animal Health',
    lotNumber: 'LOT-2026-X99',
    administeredAt: '2026-08-27T10:30:00Z',
    nextDueAt: '2027-08-27',
    weightKg: 4.5,
    temperatureC: 38.5,
    siteOfInjection: 'Right shoulder (SC)',
    certificateNumber: 'VAC-2026-00441',
    isCompleted: true,
    reminderSent: false,
    reminderSentAt: null,
    notes: 'ไม่มีอาการแพ้ แนะนำงดอาบน้ำ 7 วัน',
    createdAt: '2026-08-27T10:30:00Z',
  },
  {
    id: 'vac-102',
    tenantId: 't-1',
    petId: 'p-2',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    customerId: 'c-2',
    customerName: 'คุณธนภัทร รัตนเวช',
    customerPhone: '081-999-8877',
    clinicVisitId: 'v-102',
    visitNumber: 'VN-2026-0090',
    productId: 'prod-vac-2',
    administeredById: 'vet-1',
    administeredByName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
    vaccineType: 'CAT_CORE_3_IN_1',
    vaccineName: 'Purevax RCP (วัคซีนรวมไข้หัด-หวัดแมว)',
    manufacturer: 'Boehringer Ingelheim',
    lotNumber: 'LOT-2026-CAT02',
    administeredAt: '2026-08-27T10:45:00Z',
    nextDueAt: '2027-08-27',
    weightKg: 5.2,
    temperatureC: 38.3,
    siteOfInjection: 'Right rear leg (SC)',
    certificateNumber: 'VAC-2026-00442',
    isCompleted: true,
    reminderSent: false,
    reminderSentAt: null,
    notes: 'ตรวจสุขภาพก่อนฉีด ปกติดีทุกระบบ',
    createdAt: '2026-08-27T10:45:00Z',
  },
  {
    id: 'vac-103',
    tenantId: 't-1',
    petId: 'p-2',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    customerId: 'c-2',
    customerName: 'คุณธนภัทร รัตนเวช',
    customerPhone: '081-999-8877',
    clinicVisitId: 'v-102',
    visitNumber: 'VN-2026-0090',
    productId: 'prod-vac-3',
    administeredById: 'vet-1',
    administeredByName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
    vaccineType: 'CAT_RABIES',
    vaccineName: 'Rabisin (วัคซีนป้องกันโรคพิษสุนัขบ้า)',
    manufacturer: 'Boehringer Ingelheim',
    lotNumber: 'LOT-2026-RAB01',
    administeredAt: '2026-08-27T10:48:00Z',
    nextDueAt: '2027-08-27',
    weightKg: 5.2,
    temperatureC: 38.3,
    siteOfInjection: 'Left rear leg (SC)',
    certificateNumber: 'RAB-2026-00912',
    isCompleted: true,
    reminderSent: false,
    reminderSentAt: null,
    notes: 'วัคซีนพิษสุนัขบ้าประจำปี',
    createdAt: '2026-08-27T10:48:00Z',
  },
];

export default function VaccinationRegisterPage() {
  const [vaccinations, setVaccinations] = useState<VaccinationRecordItem[]>(MOCK_VACCINATIONS);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPetName, setSelectedPetName] = useState('น้องโมจิ (Pomeranian)');
  const [newVaccineType, setNewVaccineType] = useState<VaccineType>('DOG_CORE_5_IN_1');
  const [newVaccineName, setNewVaccineName] = useState('Nobivac DHPPi + L');
  const [newManufacturer, setNewManufacturer] = useState('MSD Animal Health');
  const [newLotNumber, setNewLotNumber] = useState('LOT-2026-X99');
  const [newNextDueDate, setNewNextDueDate] = useState('2027-08-27');
  const [newSite, setNewSite] = useState('Right shoulder (SC)');
  const [newCertNo, setNewCertNo] = useState('VAC-2026-00443');
  const [newNotes, setNewNotes] = useState('ตรวจร่างกายก่อนฉีดปกติ');

  const filtered = useMemo(() => {
    return vaccinations.filter((v) => {
      if (filterType !== 'ALL' && v.vaccineType !== filterType) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        v.petName.toLowerCase().includes(s) ||
        v.customerName.toLowerCase().includes(s) ||
        v.customerPhone.includes(s) ||
        v.vaccineName.toLowerCase().includes(s) ||
        (v.certificateNumber && v.certificateNumber.toLowerCase().includes(s))
      );
    });
  }, [vaccinations, filterType, searchTerm]);

  const handleAddVaccination = () => {
    const newRecord: VaccinationRecordItem = {
      id: `vac-${Date.now()}`,
      tenantId: 't-1',
      petId: 'p-1',
      petName: 'น้องโมจิ',
      species: 'DOG',
      breed: 'Pomeranian',
      customerId: 'c-1',
      customerName: 'คุณกนกวรรณ ศรีสุข',
      customerPhone: '089-111-2233',
      clinicVisitId: 'v-101',
      visitNumber: 'VN-2026-0089',
      productId: 'prod-vac-new',
      administeredById: 'vet-1',
      administeredByName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
      vaccineType: newVaccineType,
      vaccineName: newVaccineName,
      manufacturer: newManufacturer,
      lotNumber: newLotNumber,
      administeredAt: new Date().toISOString(),
      nextDueAt: newNextDueDate,
      weightKg: 4.5,
      temperatureC: 38.5,
      siteOfInjection: newSite,
      certificateNumber: newCertNo,
      isCompleted: true,
      reminderSent: false,
      reminderSentAt: null,
      notes: newNotes,
      createdAt: new Date().toISOString(),
    };

    setVaccinations((prev) => [newRecord, ...prev]);
    setIsAddModalOpen(false);
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
            <span className="text-[#0071e3] font-bold">ทะเบียนประวัติวัคซีน (Vaccination Records)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Syringe className="w-6 h-6 text-[#0071e3]" /> ทะเบียนวัคซีน & สมุดวัคซีนดิจิทัล (Immunization Registry)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกประวัติการฉีดวัคซีนสุนัข/แมว, ทะเบียน Lot No., คำนวณวันนัดฉีดกระตุ้นซ้ำ, และพิมพ์สมุดวัคซีน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> บันทึกการฉีดวัคซีนใหม่
          </button>
        </div>
      </div>

      {/* Vaccine Programs Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">ฉีดวัคซีนทั้งหมด</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0071e3]">
              <Syringe className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {vaccinations.length} <span className="text-xs font-medium text-slate-500">เข็ม</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">บันทึกลงระบบเวชระเบียนเรียบร้อย</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">ครบกำหนดใน 30 วัน</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            8 <span className="text-xs font-medium text-slate-500">เคส</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">เชื่อมต่อระบบแจ้งเตือน LINE อัตโนมัติ</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">สมุดวัคซีนดิจิทัล</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-purple-600 mt-2">
            100% <span className="text-xs font-medium text-slate-500">Digital Passport</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">เปิดดูประวัติและพิมพ์ใบรับรองได้ทันที</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">💉 ทุกประเภทวัคซีน</option>
            <option value="DOG_CORE_5_IN_1">🐶 วัคซีนรวมสุนัข 5 โรค</option>
            <option value="DOG_CORE_6_IN_1">🐶 วัคซีนรวมสุนัข 6 โรค</option>
            <option value="DOG_RABIES">🐶 พิษสุนัขบ้า (สุนัข)</option>
            <option value="CAT_CORE_3_IN_1">🐱 วัคซีนรวมแมว 3 โรค</option>
            <option value="CAT_RABIES">🐱 พิษสุนัขบ้า (แมว)</option>
            <option value="CAT_LEUKEMIA">🐱 ลิวคีเมียแมว (FeLV)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ, ชื่อวัคซีน, เลขใบรับรอง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* Vaccinations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">สัตว์เลี้ยง / เจ้าของ</th>
                <th className="py-3 px-4">วัคซีนที่ฉีด & Lot No.</th>
                <th className="py-3 px-4">วันที่ฉีด</th>
                <th className="py-3 px-4">วันนัดฉีดซ้ำ (Next Due)</th>
                <th className="py-3 px-4">ตำแหน่งที่ฉีด</th>
                <th className="py-3 px-4">สัตวแพทย์ผู้ฉีด</th>
                <th className="py-3 px-4 text-right">สมุดวัคซีน & ใบรับรอง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {v.species === 'DOG' ? '🐶' : '🐱'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {v.petName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {v.customerName} ({v.customerPhone})
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-extrabold text-[#0071e3] dark:text-blue-400 block">
                      {v.vaccineName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Lot: {v.lotNumber || '-'} • {v.manufacturer || '-'}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {new Date(v.administeredAt).toLocaleDateString('th-TH')}
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      <Calendar className="w-3 h-3" /> {v.nextDueAt ? new Date(v.nextDueAt).toLocaleDateString('th-TH') : '-'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                    {v.siteOfInjection || '-'}
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                    {v.administeredByName || 'น.สพ. วรปรัชญ์'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`ใบรับรองการฉีดวัคซีน เลขที่ ${v.certificateNumber} สำหรับ ${v.petName}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold transition text-[11px]"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> สมุดวัคซีน (Passport)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vaccination Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-[#0071e3]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  บันทึกการฉีดวัคซีน (Record Vaccination)
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  สัตว์เลี้ยง:
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedPetName}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ประเภทวัคซีน:
                  </label>
                  <select
                    value={newVaccineType}
                    onChange={(e) => setNewVaccineType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="DOG_CORE_5_IN_1">🐶 วัคซีนรวมสุนัข 5 โรค</option>
                    <option value="DOG_CORE_6_IN_1">🐶 วัคซีนรวมสุนัข 6 โรค</option>
                    <option value="DOG_RABIES">🐶 พิษสุนัขบ้าสุนัข</option>
                    <option value="CAT_CORE_3_IN_1">🐱 วัคซีนรวมแมว 3 โรค</option>
                    <option value="CAT_RABIES">🐱 พิษสุนัขบ้าแมว</option>
                    <option value="CAT_LEUKEMIA">🐱 ลิวคีเมียแมว</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ชื่อการค้าวัคซีน:
                  </label>
                  <input
                    type="text"
                    value={newVaccineName}
                    onChange={(e) => setNewVaccineName(e.target.value)}
                    placeholder="เช่น Nobivac DHPPi + L"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ผู้ผลิต (Manufacturer):
                  </label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    รุ่นการผลิต (Lot Number):
                  </label>
                  <input
                    type="text"
                    value={newLotNumber}
                    onChange={(e) => setNewLotNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    วันนัดฉีดซ้ำรอบถัดไป:
                  </label>
                  <input
                    type="date"
                    value={newNextDueDate}
                    onChange={(e) => setNewNextDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ตำแหน่งที่ฉีด (Site):
                  </label>
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="เช่น ไหล่ขวา (SC)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  หมายเหตุ / คำแนะนำหลังฉีดวัคซีน:
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="เช่น งดอาบน้ำ 7 วัน สังเกตอาการแพ้..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddVaccination}
                className="px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md transition active:scale-95"
              >
                บันทึกประวัติวัคซีน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

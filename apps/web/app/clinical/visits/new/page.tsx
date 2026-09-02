'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  ChevronRight,
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Clock,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Search,
  CheckCircle2,
  Plus,
  AlertCircle,
  FileText,
  UserPlus,
} from 'lucide-react';
import { ClinicVisitType } from '@petflow/types';

interface PatientOption {
  customerId: string;
  customerName: string;
  customerPhone: string;
  petId: string;
  petName: string;
  species: 'DOG' | 'CAT' | 'EXOTIC';
  breed: string;
  age: string;
  gender: 'ผู้ (Male)' | 'เมีย (Female)';
  weightKg: number;
  allergies?: string;
  chronicDiseases?: string;
}

const PRESET_PATIENTS: PatientOption[] = [
  {
    customerId: 'c-1',
    customerName: 'คุณกนกวรรณ ศรีสุข',
    customerPhone: '089-111-2233',
    petId: 'p-1',
    petName: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    age: '2 ปี 4 เดือน',
    gender: 'ผู้ (Male)',
    weightKg: 4.5,
    allergies: 'แพ้ยาฆ่าเชื้อกลุ่มเพนิซิลลิน (Penicillin)',
    chronicDiseases: 'โรคภูมิแพ้ผิวหนัง (Atopic Dermatitis)',
  },
  {
    customerId: 'c-2',
    customerName: 'คุณธนภัทร รัตนเวช',
    customerPhone: '081-999-8877',
    petId: 'p-2',
    petName: 'น้องชาโคล',
    species: 'CAT',
    breed: 'British Shorthair',
    age: '1 ปี 8 เดือน',
    gender: 'ผู้ (Male)',
    weightKg: 5.2,
  },
  {
    customerId: 'c-3',
    customerName: 'คุณพิมลดา วงศ์สว่าง',
    customerPhone: '084-555-6677',
    petId: 'p-3',
    petName: 'น้องถ้วยฟู',
    species: 'DOG',
    breed: 'Poodle Toy',
    age: '4 ปี',
    gender: 'เมีย (Female)',
    weightKg: 3.1,
    allergies: 'แพ้ยาแก้ปวดกลุ่ม NSAIDs',
  },
  {
    customerId: 'c-4',
    customerName: 'คุณเกริกพล สุขสันต์',
    customerPhone: '086-333-4455',
    petId: 'p-4',
    petName: 'น้องบ๊อบบี้',
    species: 'DOG',
    breed: 'Golden Retriever',
    age: '3 ปี 2 เดือน',
    gender: 'ผู้ (Male)',
    weightKg: 28.5,
  },
];

const PRESET_VETS = [
  { id: 'u-vet-01', name: 'สพ.ญ. น้ำใส ใจดี', title: 'สัตวแพทย์ประจำห้องตรวจ 1 (OPD General)' },
  { id: 'u-vet-02', name: 'น.สพ. วรวิทย์ เกียรติคุณ', title: 'สัตวแพทย์เฉพาะทางอายุรกรรม/ผิวหนัง' },
];

const QUICK_COMPLAINTS = [
  'คันหู เกาหูบ่อย มีกลิ่นขี้หู',
  'มีผื่นแดง คันตามผิวหนัง ขนร่วง',
  'ซึม เบื่ออาหาร ไม่ทานน้ำ',
  'อาเจียน ถ่ายเหลว 2-3 ครั้ง',
  'ฉีดวัคซีนรวม + พิษสุนัขบ้าประจำปี',
  'ตรวจสุขภาพประจำปี / ตรวจเลือด',
  'เดินกะเผลก ยกขา ไม่ยอมลงน้ำหนัก',
  'ตาแดง มีขี้ตาเขียว ขยี้ตา',
  'ตรวจติดตามอาการ (Follow-up Recheck)',
];

export default function NewClinicVisitPage() {
  const router = useRouter();

  // Selection Mode
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWalkInNew, setIsWalkInNew] = useState(false);

  // New Patient Form (if walk-in new)
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<'DOG' | 'CAT'>('DOG');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetAllergies, setNewPetAllergies] = useState('');

  // Visit Parameters
  const [vetId, setVetId] = useState('u-vet-01');
  const [visitType, setVisitType] = useState<ClinicVisitType>('SICK_VISIT');
  const [triageLevel, setTriageLevel] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Initial Vitals
  const [weightKg, setWeightKg] = useState('4.5');
  const [tempC, setTempC] = useState('38.5');
  const [heartRate, setHeartRate] = useState('110');
  const [respRate, setRespRate] = useState('24');
  const [mucous, setMucous] = useState('Pink, Moist');
  const [crt, setCrt] = useState('< 2s');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter existing patients
  const filteredPatients = PRESET_PATIENTS.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(q) ||
      p.customerPhone.includes(q) ||
      p.petName.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q)
    );
  });

  const selectedPatient = PRESET_PATIENTS[selectedPatientIndex] || PRESET_PATIENTS[0];

  const handleCreateVisit = (e: React.FormEvent, startSoapImmediately: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedVn = `VN-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newVisitId = `v-${Date.now().toString().slice(-4)}`;

    const patientName = isWalkInNew ? newPetName || 'น้องใหม่' : selectedPatient.petName;
    const ownerName = isWalkInNew ? newCustName || 'ลูกค้า Walk-in' : selectedPatient.customerName;

    // Persist new visit to LocalStorage for instant real-time reflection
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('petflow_clinical_visits');
        const visits = stored ? JSON.parse(stored) : [];
        const newRecord = {
          id: newVisitId,
          tenantId: 't-1',
          branchId: 'b-1',
          branchName: 'สาขาทองหล่อ',
          customerId: isWalkInNew ? `c-${Date.now()}` : selectedPatient.customerId,
          customerName: ownerName,
          customerPhone: isWalkInNew ? newCustPhone : selectedPatient.customerPhone,
          petId: isWalkInNew ? `p-${Date.now()}` : selectedPatient.petId,
          petName: patientName,
          species: isWalkInNew ? newPetSpecies : selectedPatient.species,
          breed: isWalkInNew ? newPetBreed || 'ผสม' : selectedPatient.breed,
          allergies: isWalkInNew ? newPetAllergies : selectedPatient.allergies,
          veterinarianId: vetId,
          veterinarianName: PRESET_VETS.find((v) => v.id === vetId)?.name || 'สพ.ญ. น้ำใส ใจดี',
          visitNumber: generatedVn,
          status: startSoapImmediately ? 'IN_CONSULTATION' : 'WAITING',
          visitType: visitType,
          chiefComplaint: chiefComplaint || 'ตรวจสุขภาพทั่วไป',
          symptoms: symptoms || '',
          vitals: {
            weightKg: parseFloat(weightKg) || 4.5,
            temperatureC: parseFloat(tempC) || 38.5,
            heartRateBpm: parseInt(heartRate, 10) || 110,
            respiratoryRateBpm: parseInt(respRate, 10) || 24,
            capillaryRefillTime: crt,
            mucousMembrane: mucous,
            bodyConditionScore: 5,
          },
          visitedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          prescriptionsCount: 0,
          treatmentsCount: 0,
        };
        visits.unshift(newRecord);
        localStorage.setItem('petflow_clinical_visits', JSON.stringify(visits));
      }
    } catch {
      // ignore
    }

    setSuccessToast(`เปิดใบตรวจรักษา ${generatedVn} (${patientName}) สำเร็จ`);

    setTimeout(() => {
      setIsSubmitting(false);
      if (startSoapImmediately) {
        router.push(`/clinical/visits/${newVisitId}/soap`);
      } else {
        router.push('/clinical');
      }
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 transition">
          หน้าหลัก
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/clinical" className="hover:text-blue-600 transition">
          ห้องตรวจรักษา & เวชระเบียน
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900 dark:text-white">
          เปิดใบตรวจรักษาใหม่ (New OPD Visit)
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/clinical"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="ย้อนกลับ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-[#0071e3]" /> เปิดใบตรวจรักษาใหม่ (New OPD Visit Intake)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                บันทึกอาการเบื้องต้น คัดกรองอาการ (Triage) วัดสัญญาณชีพ และส่งต่อเข้าห้องตรวจสัตวแพทย์
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={(e) => handleCreateVisit(e, false)} className="space-y-6">
        {/* Step 1: Select Patient / Owner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0071e3] text-xs font-bold items-center justify-center">
                1
              </span>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                ข้อมูลผู้ป่วย & เจ้าของ (Patient & Owner Selection)
              </h2>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsWalkInNew(false)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  !isWalkInNew
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ค้นหาคนไข้เดิมในระบบ
              </button>
              <button
                type="button"
                onClick={() => setIsWalkInNew(true)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isWalkInNew
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                + ลูกค้าใหม่ (Walk-in)
              </button>
            </div>
          </div>

          {!isWalkInNew ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์, หรือชื่อสัตว์เลี้ยง..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              {/* Patient Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {filteredPatients.map((patient, index) => {
                  const isSelected = selectedPatientIndex === index;
                  return (
                    <div
                      key={patient.petId}
                      onClick={() => {
                        setSelectedPatientIndex(index);
                        setWeightKg(String(patient.weightKg));
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 ring-2 ring-blue-500/20'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {patient.petName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {patient.species === 'DOG' ? 'สุนัข' : 'แมว'} ({patient.breed})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" /> {patient.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {patient.customerPhone}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          {patient.weightKg} kg
                        </span>
                      </div>

                      {/* Allergies Warning */}
                      {patient.allergies && (
                        <div className="mt-2.5 p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200/60 text-[10px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>แพ้ยา: {patient.allergies}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Walk-in New Patient Form */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อเจ้าของสัตว์เลี้ยง *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="เช่น คุณสมชาย รักสัตว์"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อสัตว์เลี้ยง *
                </label>
                <input
                  type="text"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="เช่น น้องลัคกี้"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ชนิดสัตว์
                  </label>
                  <select
                    value={newPetSpecies}
                    onChange={(e) => setNewPetSpecies(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  >
                    <option value="DOG">สุนัข (Dog)</option>
                    <option value="CAT">แมว (Cat)</option>
                    <option value="EXOTIC">สัตว์พิเศษ (Exotic)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    สายพันธุ์
                  </label>
                  <input
                    type="text"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                    placeholder="เช่น ชิสุ, ผสม"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Visit Type, Triage & Veterinarian */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0071e3] text-xs font-bold items-center justify-center">
              2
            </span>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              ประเภทการตรวจ & สัตวแพทย์ผู้รับผิดชอบ (Triage & Assignment)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Visit Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ประเภทการตรวจ (Visit Type)
              </label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as ClinicVisitType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
              >
                <option value="SICK_VISIT">ตรวจรักษาอาการป่วย (Sick Visit)</option>
                <option value="VACCINATION">ฉีดวัคซีน / ป้องกันเห็บหมัด (Vaccination)</option>
                <option value="HEALTH_CHECK">ตรวจสุขภาพทั่วไป (Health Check)</option>
                <option value="FOLLOW_UP">ตรวจติดตามอาการเดิม (Follow-up)</option>
                <option value="SURGERY">ศัลยกรรม / ทำหมัน (Surgery)</option>
                <option value="EMERGENCY">ฉุกเฉิน / อุบัติเหตุ (Emergency)</option>
              </select>
            </div>

            {/* Triage Level */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ระดับความเร่งด่วน (Triage Priority)
              </label>
              <select
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
              >
                <option value="NORMAL">🟢 ปกติ (Normal OPD)</option>
                <option value="URGENT">🟡 เร่งด่วน (Urgent Priority)</option>
                <option value="EMERGENCY">🔴 ฉุกเฉินวิกฤต (Emergency Triage)</option>
              </select>
            </div>

            {/* Veterinarian */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                สัตวแพทย์ตรวจรักษา (Doctor)
              </label>
              <select
                value={vetId}
                onChange={(e) => setVetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
              >
                {PRESET_VETS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Chief Complaint & Symptoms */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0071e3] text-xs font-bold items-center justify-center">
              3
            </span>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              อาการสำคัญที่มาพบแพทย์ (Chief Complaint & History)
            </h2>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              อาการสำคัญหลัก (Chief Complaint - CC) *
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="เช่น คันหูข้างขวา เกาบ่อย มีกลิ่นขี้หูดำ..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
              required
            />

            {/* Quick Complaint Tags */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">กดเลือกด่วน:</span>
              {QUICK_COMPLAINTS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setChiefComplaint(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              รายละเอียดอาการเพิ่มเติม / ระยะเวลาที่เป็น (History of Present Illness)
            </label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="เช่น มีอาการมา 2 วัน ร่าเริงดี ทานอาหารปกติ ถ่ายก้อนปกติ..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Step 4: Initial Vital Signs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0071e3] text-xs font-bold items-center justify-center">
                4
              </span>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                สัญญาณชีพแรกรับ (Initial Vital Signs)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">ตรวจวัดโดยผู้ช่วยสัตวแพทย์ / พยาบาล</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Weight */}
            <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-bold mb-1">
                <span>น้ำหนักตัว</span>
                <Activity className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-semibold">kg</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 font-bold mb-1">
                <span>อุณหภูมิ</span>
                <Thermometer className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-semibold">°C</span>
              </div>
            </div>

            {/* Heart Rate */}
            <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 font-bold mb-1">
                <span>อัตราหัวใจ</span>
                <Heart className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-semibold">bpm</span>
              </div>
            </div>

            {/* Resp Rate */}
            <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center justify-between text-[11px] text-sky-700 dark:text-sky-300 font-bold mb-1">
                <span>การหายใจ</span>
                <Activity className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-semibold">bpm</span>
              </div>
            </div>

            {/* CRT */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                CRT
              </div>
              <input
                type="text"
                value={crt}
                onChange={(e) => setCrt(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Mucous Membrane */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                เยื่อเมือก (MM)
              </div>
              <input
                type="text"
                value={mucous}
                onChange={(e) => setMucous(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href="/clinical"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
          >
            ยกเลิก
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : '📥 ส่งเข้าคิวรอตรวจ (Add to Queue)'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleCreateVisit(e, true)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Stethoscope className="w-4 h-4" />
              {isSubmitting ? 'กำลังเปิด...' : '🩺 เข้าห้องตรวจทันที (Start SOAP)'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

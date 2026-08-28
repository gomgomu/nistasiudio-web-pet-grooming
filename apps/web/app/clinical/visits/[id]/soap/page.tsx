'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Calendar,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  Image as ImageIcon,
  History,
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Pill,
  Sparkles,
  Zap,
  ArrowLeft,
  X,
  FileCheck,
  Printer,
  Calculator,
  PackageCheck,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import {
  SoapNoteData,
  ClinicAttachmentItem,
  PrescriptionItem,
  PrescriptionLabelData,
} from '@petflow/types';

// Mock Initial Prescriptions
const MOCK_PRESCRIPTIONS: PrescriptionItem[] = [
  {
    id: 'rx-1',
    tenantId: 't-1',
    clinicVisitId: 'v-101',
    productId: 'prod-1',
    productSku: 'MED-DEX-01',
    medicationName: 'Dexoryl Ear Drops (10g)',
    genericName: 'Gentamicin + Thiabendazole + Dexamethasone',
    dosageForm: 'DROPS',
    strength: '10 g/bottle',
    dosagePerKg: null,
    calculatedDose: '5 drops / ear',
    route: 'EAR (หยอดหูขวา)',
    frequency: 'BID (วันละ 2 ครั้ง เช้า-เย็น)',
    duration: '7 วัน',
    quantity: 1,
    unit: 'ขวด',
    instruction: 'หยอดหูข้างขวาครั้งละ 5 หยด เช้า-เย็น หลังทำความสะอาดหู ติดต่อกัน 7 วัน',
    cautionNotes: 'เก็บในอุณหภูมิห้อง ไม่เกิน 30°C เขย่าขวดก่อนใช้ ห้ามใช้ในสัตว์ที่แก้วหูทะลุ',
    priceMinor: 35000,
    isDispensed: false,
    dispensedAt: null,
    dispensedById: null,
    createdAt: '2026-08-27T10:20:00Z',
  },
  {
    id: 'rx-2',
    tenantId: 't-1',
    clinicVisitId: 'v-101',
    productId: 'prod-2',
    productSku: 'MED-EPI-01',
    medicationName: 'Epi-Otic Ear Cleanser (125ml)',
    genericName: 'Salicylic acid + PCMX + EDTA',
    dosageForm: 'LIQUID',
    strength: '125 ml/bottle',
    dosagePerKg: null,
    calculatedDose: 'พอประมาณ',
    route: 'EAR (ล้างทำความสะอาดหู)',
    frequency: 'BID (วันละ 2 ครั้ง ก่อนหยอดยา)',
    duration: '7 วัน',
    quantity: 1,
    unit: 'ขวด',
    instruction: 'บีบน้ำยาลงในช่องหูขวา นวดโคนหูเบาๆ 1 นาที แล้วเช็ดทำความสะอาดด้วยสำลี ก่อนหยอดยา Dexoryl',
    cautionNotes: 'ระวังอย่าใช้คอตตอนบัดแหย่ลึกในรูหู',
    priceMinor: 28000,
    isDispensed: false,
    dispensedAt: null,
    dispensedById: null,
    createdAt: '2026-08-27T10:22:00Z',
  },
];

// Mock Initial SOAP Note Data
const MOCK_SOAP_DATA: SoapNoteData = {
  visitId: 'v-101',
  visitNumber: 'VN-2026-0089',
  petId: 'p-1',
  petName: 'น้องโมจิ',
  species: 'DOG',
  breed: 'Pomeranian',
  customerId: 'c-1',
  customerName: 'คุณกนกวรรณ ศรีสุข',
  veterinarianId: 'vet-1',
  veterinarianName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
  visitType: 'SICK_VISIT',
  status: 'IN_CONSULTATION',
  visitedAt: '2026-08-27T10:15:00Z',
  chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่นและสะเก็ดสีดำ',
  symptoms: 'มีขี้หูดำสะเก็ด คันใบหูข้างขวา ส่ายหัวบ่อย',
  vitals: {
    weightKg: 4.5,
    temperatureC: 38.6,
    heartRateBpm: 120,
    respiratoryRateBpm: 24,
    capillaryRefillTime: '< 2s',
    mucousMembrane: 'Pink, Moist',
    bodyConditionScore: 5,
  },
  subjective: 'เจ้าของสังเกตว่าสุนัขเกาหูบ่อยมา 3 วัน ไม่ยอมให้จับใบหู ร้องเจ็บ ทานอาหารปกติ ร่าเริง ไม่มีประวัติว่ายน้ำ',
  objective: 'ตรวจช่องหูขวาพบ Erythema, Ceruminous discharge สีน้ำตาลดำ มีกลิ่นยีสต์ชัดเจน\nEar Cytology (ส่องกล้องเซลล์วิทยา): พบ Malassezia pachydermatis (ยีสต์รูปขวด) จำนวนมาก (3+)\nไม่พบไรในหู (Otodectes cynotis)',
  assessment: 'Right Otitis Externa caused by Malassezia pachydermatis overgrowth (ภาวะช่องหูส่วนนอกอักเสบจากยีสต์)',
  differentialDiagnosis: 'Ear mite infestation, Atopic dermatitis, Foreign body in ear canal',
  plan: '1. Flush right ear with Epi-Otic ear cleanser\n2. Dexoryl ear drops 5 drops BID x 7 days (หยอดหูขวา เช้า-เย็น)\n3. Recheck cytology in 7 days (นัดตรวจซ้ำ 7 วัน)',
  treatmentSummary: 'ล้างทำความสะอาดช่องหูขวา และหยอดยารักษา Dexoryl',
  dischargeNotes: 'งดให้น้ำเข้าหูระหว่างอาบน้ำ ใส่คอลลาร์กันเกา 3 วันแรก หากมีอาการบวมแดงเพิ่มขึ้นให้รีบนำกลับมาพบแพทย์',
  followUpDate: '2026-09-03',
  followUpReason: 'นัดตรวจซ้ำและส่องกล้องดูเซลล์หู (Ear Cytology Recheck)',
  attachments: [
    {
      id: 'att-1',
      tenantId: 't-1',
      clinicVisitId: 'v-101',
      attachmentType: 'WOUND_PHOTO',
      fileUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=60',
      fileName: 'right-ear-canal-pre.jpg',
      caption: 'ภาพช่องหูขวาก่อนทำความสะอาด (พบ Cerumen สีน้ำตาลดำ)',
      uploadedAt: '2026-08-27T10:20:00Z',
    },
    {
      id: 'att-2',
      tenantId: 't-1',
      clinicVisitId: 'v-101',
      attachmentType: 'LAB_RESULT',
      fileUrl: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&auto=format&fit=crop&q=60',
      fileName: 'ear-cytology-malassezia.jpg',
      caption: 'ผลตรวจกล้องจุลทรรศน์: Malassezia pachydermatis (3+)',
      uploadedAt: '2026-08-27T10:25:00Z',
    },
  ],
  historyEntries: [
    {
      id: 'h-1',
      recordType: 'SOAP',
      authorName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
      createdAt: '2026-08-27T10:15:00Z',
      summary: 'เปิดเคสและบันทึกประวัติอาการแรกรับ',
      snapshot: { chiefComplaint: 'คันหู เกาตลอดเวลา มีกลิ่นและสะเก็ดสีดำ' },
    },
  ],
};

export default function SoapWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<SoapNoteData>(MOCK_SOAP_DATA);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(MOCK_PRESCRIPTIONS);
  const [activeTab, setActiveTab] = useState<'SOAP' | 'PRESCRIPTIONS' | 'ATTACHMENTS' | 'HISTORY'>('SOAP');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auditNote, setAuditNote] = useState<string>('');

  // Modals
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [newAttachmentType, setNewAttachmentType] = useState<string>('WOUND_PHOTO');
  const [newAttachmentCaption, setNewAttachmentCaption] = useState<string>('');

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');
  const [newDosePerKg, setNewDosePerKg] = useState<string>('12.5');
  const [newRoute, setNewRoute] = useState('PO (กิน)');
  const [newFrequency, setNewFrequency] = useState('BID (วันละ 2 ครั้ง เช้า-เย็น)');
  const [newDuration, setNewDuration] = useState('7 วัน');
  const [newQuantity, setNewQuantity] = useState<string>('14');
  const [newUnit, setNewUnit] = useState('เม็ด');
  const [newInstruction, setNewInstruction] = useState('');
  const [newCaution, setNewCaution] = useState('');
  const [newPriceMinor, setNewPriceMinor] = useState('25000');

  const [activeLabelData, setActiveLabelData] = useState<PrescriptionLabelData | null>(null);

  // Quick Dose Calculator
  const petWeight = data.vitals.weightKg || 4.5;
  const calculatedDosePreview = newDosePerKg
    ? `${(petWeight * parseFloat(newDosePerKg)).toFixed(1)} mg`
    : '-';

  const handleSaveSoap = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      const newHistory = [
        {
          id: `h-${Date.now()}`,
          recordType: 'SOAP',
          authorName: 'น.สพ. วรปรัชญ์ เกียรติสกุล',
          createdAt: new Date().toISOString(),
          summary: auditNote || 'บันทึก/ปรับปรุงข้อมูล SOAP Note',
          snapshot: { diagnosis: data.diagnosis, vitals: data.vitals },
        },
        ...data.historyEntries,
      ];
      setData((prev) => ({ ...prev, historyEntries: newHistory }));
      setAuditNote('');
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleCompleteVisit = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setData((prev) => ({ ...prev, status: 'COMPLETED' }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleAddAttachment = () => {
    const newAtt: ClinicAttachmentItem = {
      id: `att-${Date.now()}`,
      tenantId: 't-1',
      clinicVisitId: data.visitId,
      attachmentType: newAttachmentType as any,
      fileUrl: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&auto=format&fit=crop&q=60',
      fileName: 'attachment-upload.jpg',
      caption: newAttachmentCaption || 'ภาพประกอบการตรวจรักษา',
      uploadedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      attachments: [newAtt, ...prev.attachments],
    }));
    setIsAttachmentModalOpen(false);
    setNewAttachmentCaption('');
  };

  const handleAddPrescription = () => {
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      tenantId: 't-1',
      clinicVisitId: data.visitId,
      productId: 'prod-new',
      productSku: 'MED-NEW',
      medicationName: newMedicationName || 'Amoxicillin + Clavulanic Acid 62.5mg',
      genericName: newGenericName || 'Amoxicillin / Clavulanate potassium',
      dosageForm: 'TABLET',
      strength: '62.5 mg/tab',
      dosagePerKg: parseFloat(newDosePerKg) || 12.5,
      calculatedDose: `${calculatedDosePreview} (1 เม็ด)`,
      route: newRoute,
      frequency: newFrequency,
      duration: newDuration,
      quantity: parseFloat(newQuantity) || 14,
      unit: newUnit,
      instruction:
        newInstruction ||
        `กินครั้งละ 1 ${newUnit} ${newFrequency} หลังอาหารทันที ติดต่อกัน ${newDuration}`,
      cautionNotes: newCaution || 'กินยาให้ครบตามกำหนด ห้ามใช้ในสัตว์ที่แพ้ยาเพนิซิลลิน',
      priceMinor: parseInt(newPriceMinor, 10) || 25000,
      isDispensed: false,
      dispensedAt: null,
      dispensedById: null,
      createdAt: new Date().toISOString(),
    };

    setPrescriptions((prev) => [...prev, newRx]);
    setIsPrescriptionModalOpen(false);
    setNewMedicationName('');
    setNewInstruction('');
  };

  const handleDispenseAll = () => {
    setPrescriptions((prev) =>
      prev.map((rx) => ({
        ...rx,
        isDispensed: true,
        dispensedAt: new Date().toISOString(),
        dispensedByName: 'เภสัชกร / พนักงานจ่ายยา',
      }))
    );
  };

  const handleOpenLabel = (rx: PrescriptionItem) => {
    const label: PrescriptionLabelData = {
      clinicName: 'PetFlow Animal Hospital (สาขาทองหล่อ)',
      clinicPhone: '02-123-4567',
      clinicAddress: 'สุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ',
      visitNumber: data.visitNumber || '',
      date: new Date().toLocaleDateString('th-TH'),
      petName: data.petName,
      species: data.species === 'DOG' ? 'สุนัข (Dog)' : 'แมว (Cat)',
      breed: data.breed || '',
      customerName: data.customerName,
      veterinarianName: data.veterinarianName || 'น.สพ. วรปรัชญ์ เกียรติสกุล',
      medicationName: rx.medicationName,
      genericName: rx.genericName || '',
      strength: rx.strength || '',
      quantity: rx.quantity,
      unit: rx.unit || 'เม็ด',
      route: rx.route || 'รับประทาน',
      frequency: rx.frequency || 'วันละ 2 ครั้ง',
      instruction: rx.instruction || '',
      cautionNotes: rx.cautionNotes || '',
      lotNumber: 'LOT-2026A',
      expiryDate: '12/2027',
    };
    setActiveLabelData(label);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumbs & Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/clinical" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> คิวตรวจรักษา (Clinical OPD)
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0071e3] dark:text-blue-400 font-bold">
            ห้องตรวจรักษา & เวชระเบียน SOAP ({data.visitNumber})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> บันทึกข้อมูลสำเร็จ
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSoap}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition active:scale-95"
          >
            <Save className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก (Save SOAP)'}
          </button>
          <button
            type="button"
            onClick={handleCompleteVisit}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            ตรวจเสร็จสิ้น (Complete Visit)
          </button>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>ส่งไปชำระเงินที่แคชเชียร์ (Send to POS)</span>
          </Link>
        </div>
      </div>

      {/* Patient & Owner Context Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-apple">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl font-bold shadow-md shadow-emerald-500/20 shrink-0">
              {data.species === 'DOG' ? '🐶' : '🐱'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {data.petName}
                </h1>
                <span className="text-xs text-slate-500 font-medium">({data.breed})</span>
                <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {data.visitNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    data.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                  }`}
                >
                  {data.status === 'COMPLETED' ? '✅ ตรวจเสร็จสิ้น' : '🩺 กำลังตรวจรักษา'}
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-400" /> เจ้าของ: {data.customerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> สัตวแพทย์: {data.veterinarianName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> วันที่: {new Date(data.visitedAt).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>
          </div>

          {/* Allergies Alert Badge */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">ประวัติการแพ้ยา (Allergies Alert):</span>
                <span>แพ้ยาฆ่าเชื้อกลุ่มเพนิซิลลิน (Penicillin)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Vital Signs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#0071e3]" /> สัญญาณชีพ & การตรวจวัดร่างกาย (Vital Signs)
          </span>
          <span className="text-[11px] text-slate-400">อัปเดตน้ำหนักลงประวัติอัตโนมัติ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Weight */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">น้ำหนัก (Weight)</label>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.1"
                value={data.vitals.weightKg || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    vitals: { ...data.vitals, weightKg: parseFloat(e.target.value) || null },
                  })
                }
                className="w-full font-extrabold text-sm bg-transparent focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">kg</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">อุณหภูมิ (Temp)</label>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.1"
                value={data.vitals.temperatureC || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    vitals: { ...data.vitals, temperatureC: parseFloat(e.target.value) || null },
                  })
                }
                className="w-full font-extrabold text-sm bg-transparent focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">°C</span>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">หัวใจ (Heart Rate)</label>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={data.vitals.heartRateBpm || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    vitals: { ...data.vitals, heartRateBpm: parseInt(e.target.value, 10) || null },
                  })
                }
                className="w-full font-extrabold text-sm bg-transparent focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">bpm</span>
            </div>
          </div>

          {/* Respiratory Rate */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">การหายใจ (Resp)</label>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={data.vitals.respiratoryRateBpm || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    vitals: { ...data.vitals, respiratoryRateBpm: parseInt(e.target.value, 10) || null },
                  })
                }
                className="w-full font-extrabold text-sm bg-transparent focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">bpm</span>
            </div>
          </div>

          {/* CRT */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">CRT (ความไวหลอดเลือด)</label>
            <input
              type="text"
              value={data.vitals.capillaryRefillTime || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  vitals: { ...data.vitals, capillaryRefillTime: e.target.value },
                })
              }
              className="w-full font-extrabold text-sm bg-transparent focus:outline-none mt-1"
            />
          </div>

          {/* Mucous Membrane */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">เยื่อเมือก (Mucous)</label>
            <input
              type="text"
              value={data.vitals.mucousMembrane || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  vitals: { ...data.vitals, mucousMembrane: e.target.value },
                })
              }
              className="w-full font-extrabold text-sm bg-transparent focus:outline-none mt-1"
            />
          </div>

          {/* BCS */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">BCS (คะแนนร่างกาย 1-9)</label>
            <input
              type="number"
              min="1"
              max="9"
              value={data.vitals.bodyConditionScore || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  vitals: { ...data.vitals, bodyConditionScore: parseInt(e.target.value, 10) || null },
                })
              }
              className="w-full font-extrabold text-sm bg-transparent focus:outline-none mt-1"
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('SOAP')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition ${
            activeTab === 'SOAP'
              ? 'border-[#0071e3] text-[#0071e3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📝 บันทึกเวชระเบียน 4-Tab SOAP
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRESCRIPTIONS')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'PRESCRIPTIONS'
              ? 'border-[#0071e3] text-[#0071e3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pill className="w-3.5 h-3.5" /> ใบสั่งยา & จ่ายยา ({prescriptions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ATTACHMENTS')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'ATTACHMENTS'
              ? 'border-[#0071e3] text-[#0071e3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> รูปภาพแผล & ผลแล็บ ({data.attachments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'border-[#0071e3] text-[#0071e3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" /> ประวัติการแก้ไข & Audit Trail ({data.historyEntries.length})
        </button>
      </div>

      {/* TAB 1: 4-Tab SOAP Interface */}
      {activeTab === 'SOAP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card S: Subjective */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-[#0071e3] dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-black text-sm">
                  S
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Subjective (ประวัติและอาการจากเจ้าของ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chief Complaint, ประวัติการเกิดโรค, ความอยากอาหาร, การขับถ่าย
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  อาการสำคัญที่พามา (Chief Complaint):
                </label>
                <input
                  type="text"
                  value={data.chiefComplaint || ''}
                  onChange={(e) => setData({ ...data, chiefComplaint: e.target.value })}
                  placeholder="เช่น คันหู เกาตลอดเวลา มีกลิ่น..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  รายละเอียดประวัติอาการ (Subjective Notes):
                </label>
                <textarea
                  rows={4}
                  value={data.subjective || ''}
                  onChange={(e) => setData({ ...data, subjective: e.target.value })}
                  placeholder="บันทึกประวัติการกินอาหาร ขับถ่าย ระยะเวลาที่มีอาการ พฤติกรรมที่เปลี่ยนไป..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>
            </div>

            {/* Card O: Objective */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300 flex items-center justify-center font-black text-sm">
                  O
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Objective (ผลการตรวจร่างกายและผลแล็บ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Physical Exam, การส่องกล้อง, ผลตรวจเซลล์วิทยา, ผลตรวจเลือด
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  อาการที่ตรวจพบเบื้องต้น (Symptoms Observed):
                </label>
                <input
                  type="text"
                  value={data.symptoms || ''}
                  onChange={(e) => setData({ ...data, symptoms: e.target.value })}
                  placeholder="เช่น มีขี้หูดำสะเก็ด คันใบหูข้างขวา..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  ผลการตรวจร่างกายเฉพาะระบบ & แล็บ (Objective Notes):
                </label>
                <textarea
                  rows={4}
                  value={data.objective || ''}
                  onChange={(e) => setData({ ...data, objective: e.target.value })}
                  placeholder="ผลการตรวจเฉพาะระบบ ช่องปาก หู ตา ผิวหนัง ช่องท้อง ผล Ear Cytology / Blood panel..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Card A: Assessment */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center font-black text-sm">
                  A
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Assessment (การประเมินและการวินิจฉัยโรค)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Primary Diagnosis, Differential Diagnosis, ปัญหาทางการแพทย์
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  การวินิจฉัยโรคหลัก (Primary Diagnosis):
                </label>
                <input
                  type="text"
                  value={data.diagnosis || ''}
                  onChange={(e) => setData({ ...data, diagnosis: e.target.value })}
                  placeholder="เช่น Otitis Externa (ภาวะช่องหูส่วนนอกอักเสบจากยีสต์)..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  การวินิจฉัยแยกโรค (Differential Diagnosis):
                </label>
                <input
                  type="text"
                  value={data.differentialDiagnosis || ''}
                  onChange={(e) => setData({ ...data, differentialDiagnosis: e.target.value })}
                  placeholder="เช่น Ear mite infestation, Atopic dermatitis..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  บันทึกการประเมินและพยากรณ์โรค (Assessment Notes):
                </label>
                <textarea
                  rows={2}
                  value={data.assessment || ''}
                  onChange={(e) => setData({ ...data, assessment: e.target.value })}
                  placeholder="การประเมินความรุนแรงของโรค การพยากรณ์โรค (Prognosis: Good/Guarded)..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Card P: Plan */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                  P
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Plan (แผนการรักษา คำแนะนำ และนัดหมาย)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Treatment Plan, การสั่งยา, หัตถการ, Discharge Notes, Follow-up
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  แผนการรักษาและการสั่งยา (Treatment & Rx Plan):
                </label>
                <textarea
                  rows={3}
                  value={data.plan || ''}
                  onChange={(e) => setData({ ...data, plan: e.target.value })}
                  placeholder="1. ยาหยอดหู Dexoryl...\n2. ล้างทำความสะอาดหู...\n3. ยารับประทาน..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  คำแนะนำเจ้าของ & ข้อควรระวัง (Discharge / Home Care Notes):
                </label>
                <textarea
                  rows={2}
                  value={data.dischargeNotes || ''}
                  onChange={(e) => setData({ ...data, dischargeNotes: e.target.value })}
                  placeholder="ข้อห้าม การดูแลแผลที่บ้าน การสังเกตอาการผิดปกติ..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Follow-up schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    วันนัดตรวจติดตาม (Follow-up Date):
                  </label>
                  <input
                    type="date"
                    value={data.followUpDate || ''}
                    onChange={(e) => setData({ ...data, followUpDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    เหตุผลที่นัด (Follow-up Reason):
                  </label>
                  <input
                    type="text"
                    value={data.followUpReason || ''}
                    onChange={(e) => setData({ ...data, followUpReason: e.target.value })}
                    placeholder="เช่น นัดตรวจซ้ำ Ear Cytology..."
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Note & Changelog Bar */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-purple-900 dark:text-purple-300">
              <History className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong className="font-bold">ระบบบันทึกประวัติแบบ Non-destructive:</strong> ทุกครั้งที่กดบันทึก ระบบจะสร้างประวัติเวอร์ชันเก็บไว้เสมอ
              </span>
            </div>

            <div className="w-full sm:w-80">
              <input
                type="text"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="บันทึกเหตุผลการแก้ไข (Optional Changelog)..."
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Prescriptions & Dispensing */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    รายการใบสั่งยา & ฉลากยา (Prescription Orders)
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {prescriptions.length} รายการ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  คำนวณขนาดยาตามน้ำหนักสัตว์เลี้ยง (mg/kg), พิมพ์ฉลากยาภาษาไทย, และจ่ายยาตัดสต็อก
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDispenseAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  <PackageCheck className="w-4 h-4" /> จ่ายยาทั้งหมด (Dispense & Cut Stock)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bb5] text-white text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> เพิ่มยาในใบสั่งแพทย์
                </button>
              </div>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-4">
              {prescriptions.map((rx, idx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-200 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#0071e3] dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {rx.medicationName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">({rx.genericName})</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {rx.dosageForm} • {rx.strength}
                      </span>
                      {rx.isDispensed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> จ่ายยาแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> รอจ่ายยา
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium space-y-1">
                      <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                        <span className="font-bold text-[#0071e3] dark:text-blue-400">วิธีใช้:</span>{' '}
                        {rx.instruction}
                      </div>
                      {rx.cautionNotes && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {rx.cautionNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity, Price & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {rx.quantity} {rx.unit}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {(rx.priceMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenLabel(rx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-bold transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> ฉลากยา
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescriptions((prev) => prev.filter((item) => item.id !== rx.id))}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Attachments & Photos */}
      {activeTab === 'ATTACHMENTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                รูปภาพแผล & ผลแล็บทางการแพทย์ (Clinical Attachments)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แนบภาพถ่ายบริเวณรอยโรค, ภาพเอกซเรย์, อัลตราซาวด์, หรือใบผลแล็บ
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAttachmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> เพิ่มรูปภาพ / เอกสารแนบ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.attachments.map((att) => (
              <div
                key={att.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={att.fileUrl}
                    alt={att.caption || 'Attachment'}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-md">
                    {att.attachmentType === 'WOUND_PHOTO'
                      ? '📷 รูปถ่ายรอยโรค'
                      : att.attachmentType === 'LAB_RESULT'
                      ? '🔬 ผลแล็บ'
                      : att.attachmentType === 'XRAY'
                      ? '🦴 เอกซเรย์'
                      : '📄 เอกสารแนบ'}
                  </span>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {att.caption || att.fileName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    อัปโหลดเมื่อ: {new Date(att.uploadedAt).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: History & Audit Trail */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              ประวัติการบันทึก & บันทึกการแก้ไข (SOAP Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกทุกเวอร์ชันของเวชระเบียน ป้องกันการสูญหายหรือถูกเขียนทับ
            </p>
          </div>

          <div className="space-y-3">
            {data.historyEntries.map((h, idx) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 text-[10px] font-bold flex items-center justify-center">
                      #{data.historyEntries.length - idx}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {h.authorName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {h.summary}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-extrabold shrink-0">
                  Version Snapshot
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#0071e3]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  สั่งยาและคำนวณขนาดยา (Prescribe Medication)
                </h3>
              </div>
              <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dose Calculator Header */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#0071e3]" />
                <span className="font-bold text-blue-950 dark:text-blue-300">
                  น้ำหนักสัตว์เลี้ยง: {petWeight} kg
                </span>
              </div>
              <div className="font-extrabold text-[#0071e3] dark:text-blue-400">
                ขนาดคำนวณ: {calculatedDosePreview} / ครั้ง
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อการค้าของยา (Medication Name):
                </label>
                <input
                  type="text"
                  value={newMedicationName}
                  onChange={(e) => setNewMedicationName(e.target.value)}
                  placeholder="เช่น Amoxicillin + Clavulanic Acid 62.5mg (Clavamox)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ขนาดยาต่อ กก. (mg/kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDosePerKg}
                    onChange={(e) => setNewDosePerKg(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    เส้นทางให้ยา (Route):
                  </label>
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="PO (รับประทาน)">PO (รับประทาน)</option>
                    <option value="SC (ใต้ผิวหนัง)">SC (ใต้ผิวหนัง)</option>
                    <option value="IM (เข้ากล้าม)">IM (เข้ากล้าม)</option>
                    <option value="IV (เข้าหลอดเลือด)">IV (เข้าหลอดเลือด)</option>
                    <option value="EAR (หยอดหู)">EAR (หยอดหู)</option>
                    <option value="EYE (หยอดตา)">EYE (หยอดตา)</option>
                    <option value="TOPICAL (ทาภายนอก)">TOPICAL (ทาภายนอก)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ความถี่ (Frequency):
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="BID (วันละ 2 ครั้ง เช้า-เย็น)">BID (วันละ 2 ครั้ง เช้า-เย็น)</option>
                    <option value="SID (วันละ 1 ครั้ง)">SID (วันละ 1 ครั้ง)</option>
                    <option value="TID (วันละ 3 ครั้ง เช้า-กลางวัน-เย็น)">TID (วันละ 3 ครั้ง)</option>
                    <option value="QOD (วันเว้นวัน)">QOD (วันเว้นวัน)</option>
                    <option value="PRN (เมื่อมีอาการ)">PRN (เมื่อมีอาการ)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ระยะเวลา (Duration):
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="เช่น 7 วัน"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    จำนวน (Qty):
                  </label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    หน่วย (Unit):
                  </label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ราคาขาย (สตางค์):
                  </label>
                  <input
                    type="number"
                    value={newPriceMinor}
                    onChange={(e) => setNewPriceMinor(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  วิธีใช้บนฉลากยา (Label Instruction):
                </label>
                <textarea
                  rows={2}
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder="กินครั้งละ 1 เม็ด เช้า-เย็น หลังอาหารทันที..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddPrescription}
                className="px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md transition active:scale-95"
              >
                เพิ่มในใบสั่งยา
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thai Medicine Thermal Label Print Modal */}
      {activeLabelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Printer className="w-4 h-4 text-[#0071e3]" /> ตัวอย่างฉลากยาภาษาไทย (Medicine Sticker Preview)
              </div>
              <button onClick={() => setActiveLabelData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Graphic Container */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white text-slate-900 font-sans shadow-inner space-y-3">
              <div className="text-center border-b pb-2">
                <h4 className="font-extrabold text-sm">{activeLabelData.clinicName}</h4>
                <p className="text-[10px] text-slate-600">{activeLabelData.clinicAddress} • โทร {activeLabelData.clinicPhone}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                <div>
                  <span className="text-slate-500">ชื่อสัตว์:</span> <strong>{activeLabelData.petName}</strong> ({activeLabelData.species})
                </div>
                <div>
                  <span className="text-slate-500">เจ้าของ:</span> <strong>{activeLabelData.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">วันที่:</span> {activeLabelData.date}
                </div>
                <div>
                  <span className="text-slate-500">เลข VN:</span> {activeLabelData.visitNumber}
                </div>
              </div>

              <div className="border-t border-b py-2 space-y-1">
                <div className="font-bold text-sm text-[#0071e3]">
                  💊 {activeLabelData.medicationName}
                </div>
                <div className="text-[11px] text-slate-600">
                  {activeLabelData.genericName} ({activeLabelData.strength})
                </div>
                <div className="text-xs font-extrabold bg-blue-50 p-2 rounded-md mt-1 leading-relaxed">
                  วิธีใช้: {activeLabelData.instruction}
                </div>
              </div>

              {activeLabelData.cautionNotes && (
                <div className="text-[10px] text-rose-600 font-bold">
                  ⚠️ คำเตือน: {activeLabelData.cautionNotes}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t">
                <span>สัตวแพทย์ผู้สั่ง: {activeLabelData.veterinarianName}</span>
                <span>จำนวน: {activeLabelData.quantity} {activeLabelData.unit}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveLabelData(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('ส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์ฉลากยา Thermal Printer เรียบร้อยแล้ว');
                  setActiveLabelData(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> พิมพ์สติ๊กเกอร์ยา (Print Label)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Upload Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                เพิ่มรูปภาพ / เอกสารแนบทางการแพทย์
              </h3>
              <button onClick={() => setIsAttachmentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ประเภทรูปภาพ / เอกสาร:
                </label>
                <select
                  value={newAttachmentType}
                  onChange={(e) => setNewAttachmentType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="WOUND_PHOTO">📷 รูปถ่ายรอยโรค / แผล (Wound Photo)</option>
                  <option value="LAB_RESULT">🔬 ผลตรวจแล็บ / เซลล์วิทยา (Lab Result / Cytology)</option>
                  <option value="XRAY">🦴 ภาพถ่ายเอกซเรย์ (X-Ray)</option>
                  <option value="ULTRASOUND">🔊 ภาพอัลตราซาวด์ (Ultrasound)</option>
                  <option value="OTHER">📄 เอกสารแนบอื่นๆ (Other Document)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  คำอธิบายภาพ / จุดที่พบ (Caption):
                </label>
                <input
                  type="text"
                  value={newAttachmentCaption}
                  onChange={(e) => setNewAttachmentCaption(e.target.value)}
                  placeholder="เช่น ภาพถ่ายช่องหูขวาก่อนล้างแผล..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-500 font-medium">
                  ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </div>
                <span className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 15MB</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl shadow-md transition active:scale-95"
              >
                บันทึกรูปภาพ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

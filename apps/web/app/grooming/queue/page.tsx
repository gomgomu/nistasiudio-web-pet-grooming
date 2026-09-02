'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Search,
  Plus,
  Clock,
  User,
  Dog,
  Cat,
  Phone,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  Droplets,
  Wind,
  Check,
  ChevronRight,
  HeartPulse,
  ExternalLink,
  AlertTriangle,
  Send,
  Timer,
} from 'lucide-react';
import { Button } from '@petflow/ui';

export type GroomingStage =
  | 'WAITING'
  | 'BATHING'
  | 'DRYING'
  | 'GROOMING'
  | 'FINISHING'
  | 'READY'
  | 'PICKED_UP';

export interface QueueAlerts {
  isOverdue?: boolean;
  overdueMinutes?: number;
  isAggressive?: boolean;
  aggressiveDetail?: string;
  isMedicalWarning?: boolean;
  medicalDetail?: string;
  isDelayedPickup?: boolean;
  delayedMinutes?: number;
  hasSpecialWarning?: boolean;
}

export interface GroomingCardItem {
  id: string;
  queueNumber: number;
  queueCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  petId: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed: string;
  petWeight: number;
  serviceId: string;
  serviceName: string;
  groomerId?: string;
  groomerName?: string;
  status: GroomingStage;
  preferredCut?: string;
  shampoo?: string;
  specialCareNotes?: string;
  behaviorNotes?: string;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  priceMinor: number;
  startedAt?: string;
  checkInTime: string;
  alerts?: QueueAlerts;
}

const initialQueueItems: GroomingCardItem[] = [
  {
    id: 'q-001',
    queueNumber: 1,
    queueCode: 'Q01',
    customerId: 'c-01',
    customerName: 'คุณสุภาพร ใจดี',
    customerPhone: '081-234-5678',
    customerLine: '@supaporn_j',
    petId: 'p-01',
    petName: 'น้องโมจิ',
    petSpecies: 'DOG',
    petBreed: 'ปอมเมอเรเนียน',
    petWeight: 3.8,
    serviceId: 's-01',
    serviceName: 'อาบน้ำ + ตัดขนทรงหมี (Teddy Bear Cut)',
    groomerId: 'u-01',
    groomerName: 'ช่างเอก',
    status: 'GROOMING',
    preferredCut: 'ทรงหน้าหมีกลม ขนตัวสั้น 2 ซม. เท้าชิดทรงกลม',
    shampoo: 'แชมพูสูตร Hypoallergenic กลิ่นวานิลลาอ่อน',
    specialCareNotes: 'มีติ่งเนื้อที่หลังหูด้านซ้าย ระวังใบมีดบาด',
    behaviorNotes: 'กลัวเสียงไดร์ ให้ใช้ลมอุ่นเบาๆ',
    estimatedDurationMinutes: 90,
    actualDurationMinutes: 45,
    priceMinor: 55000,
    startedAt: '09:30',
    checkInTime: '09:00',
    alerts: {
      isMedicalWarning: true,
      medicalDetail: 'มีติ่งเนื้อหลังหูซ้าย ระวังใบมีดบาด',
    },
  },
  {
    id: 'q-002',
    queueNumber: 2,
    queueCode: 'Q02',
    customerId: 'c-02',
    customerName: 'คุณวิชัย รัตนศิลป์',
    customerPhone: '089-876-5432',
    petId: 'p-02',
    petName: 'น้องบะหมี่',
    petSpecies: 'DOG',
    petBreed: 'พุดเดิ้ล ทอย',
    petWeight: 4.2,
    serviceId: 's-01',
    serviceName: 'อาบน้ำ + ตัดขนสไตล์ Lamb Cut',
    groomerId: 'u-02',
    groomerName: 'ช่างแนน',
    status: 'DRYING',
    preferredCut: 'ทรง Lamb Cut ขาปุกปุย หน้าสั้น',
    shampoo: 'แชมพูสูตรเพิ่มวอลลุ่มขนฟู',
    specialCareNotes: 'ข้อสะโพกหลังขวาเคยผ่าตัด ระวังดึงขาแรง',
    behaviorNotes: 'อารมณ์ดี ชอบเล่น',
    estimatedDurationMinutes: 75,
    actualDurationMinutes: 90,
    priceMinor: 50000,
    startedAt: '10:00',
    checkInTime: '09:45',
    alerts: {
      isOverdue: true,
      overdueMinutes: 15,
      isMedicalWarning: true,
      medicalDetail: 'ข้อสะโพกหลังขวาเคยผ่าตัด ระวังการดึงขา',
    },
  },
  {
    id: 'q-003',
    queueNumber: 3,
    queueCode: 'Q03',
    customerId: 'c-03',
    customerName: 'คุณณัฐพล เกียรติสกุล',
    customerPhone: '086-555-1234',
    customerLine: '@nattapol_k',
    petId: 'p-03',
    petName: 'น้องส้มตำ',
    petSpecies: 'CAT',
    petBreed: 'สก็อตติช โฟลด์',
    petWeight: 4.0,
    serviceId: 's-02',
    serviceName: 'อาบน้ำสปาโอโซนแมวขนสั้น + ตัดเล็บ เช็ดหู',
    groomerId: 'u-03',
    groomerName: 'ช่างพลอย',
    status: 'BATHING',
    preferredCut: 'ไม่ตัดขน อาบน้ำสปาอย่างเดียว',
    shampoo: 'แชมพูสูตรขจัดความมันโคนหางแมว',
    specialCareNotes: 'ระวังน้ำเข้าหูพับ',
    behaviorNotes: 'ตื่นกลัวคนแปลกหน้าเล็กน้อย ต้องอุ้มเบาๆ',
    estimatedDurationMinutes: 60,
    priceMinor: 45000,
    startedAt: '10:30',
    checkInTime: '10:15',
    alerts: {
      hasSpecialWarning: true,
    },
  },
  {
    id: 'q-004',
    queueNumber: 4,
    queueCode: 'Q04',
    customerId: 'c-04',
    customerName: 'คุณกัญญา ธนากูล',
    customerPhone: '083-444-9988',
    petId: 'p-04',
    petName: 'น้องชาโคล',
    petSpecies: 'DOG',
    petBreed: 'โกลเด้น รีทรีฟเวอร์',
    petWeight: 28.5,
    serviceId: 's-03',
    serviceName: 'อาบน้ำสุนัขพันธุ์ใหญ่ + สางขนผลัด',
    status: 'WAITING',
    preferredCut: 'เล็มปลายขนและใต้ท้อง ไม่ไถสั้น',
    shampoo: 'แชมพูสูตรลดขนร่วง ขจัดกลิ่นสาบ',
    specialCareNotes: 'ขนค่อนข้างหนาแน่น ต้องเป่าให้แห้งสนิท',
    behaviorNotes: 'ใจดีมาก ชอบให้เกาคาง',
    estimatedDurationMinutes: 120,
    priceMinor: 85000,
    checkInTime: '10:45',
  },
  {
    id: 'q-005',
    queueNumber: 5,
    queueCode: 'Q05',
    customerId: 'c-05',
    customerName: 'คุณพงษ์ศักดิ์ เจริญดี',
    customerPhone: '082-111-2233',
    petId: 'p-05',
    petName: 'น้องถ้วยฟู',
    petSpecies: 'DOG',
    petBreed: 'บิชอง ฟริเซ่',
    petWeight: 5.5,
    serviceId: 's-01',
    serviceName: 'อาบน้ำ + ตัดขนทรงหัวฟูกลม (Bichon Head)',
    groomerId: 'u-01',
    groomerName: 'ช่างเอก',
    status: 'FINISHING',
    preferredCut: 'ทรงหัวเห็ดบิชองฟูเต็มที่ ผูกโบว์สีฟ้า',
    shampoo: 'แชมพูสูตรขนขาวไบรท์อัพ',
    specialCareNotes: 'ระวังคราบน้ำตาใต้ตาขวา',
    behaviorNotes: 'นิ่งมาก ให้ความร่วมมือดี',
    estimatedDurationMinutes: 100,
    priceMinor: 70000,
    startedAt: '09:00',
    checkInTime: '08:45',
  },
  {
    id: 'q-006',
    queueNumber: 6,
    queueCode: 'Q06',
    customerId: 'c-06',
    customerName: 'คุณอรทัย สิทธิชัย',
    customerPhone: '084-777-6655',
    customerLine: '@orathai_s',
    petId: 'p-06',
    petName: 'น้องไข่ตุ๋น',
    petSpecies: 'DOG',
    petBreed: 'ชิสุ',
    petWeight: 5.0,
    serviceId: 's-01',
    serviceName: 'อาบน้ำ + ตัดขนสั้นเบอร์ 2 รับหน้าร้อน',
    groomerId: 'u-02',
    groomerName: 'ช่างแนน',
    status: 'READY',
    preferredCut: 'ไถขนตัวเบอร์ 2 หัวกลม หางพู่',
    shampoo: 'แชมพูสูตรสมุนไพรลดคัน',
    specialCareNotes: 'ตาแห้งง่าย หยอดน้ำตาเทียมให้ก่อนไดร์',
    behaviorNotes: 'ดุเวลาตัดเล็บเท้าหน้า ใส่คอลล่าร์แล้ว',
    estimatedDurationMinutes: 70,
    actualDurationMinutes: 65,
    priceMinor: 45000,
    startedAt: '08:30',
    checkInTime: '08:15',
    alerts: {
      isAggressive: true,
      aggressiveDetail: 'ดุเวลาตัดเล็บเท้าหน้า ต้องใส่คอลล่าร์',
      isDelayedPickup: true,
      delayedMinutes: 45,
    },
  },
  {
    id: 'q-007',
    queueNumber: 7,
    queueCode: 'Q07',
    customerId: 'c-07',
    customerName: 'คุณธวัชชัย บวรเกียรติ',
    customerPhone: '085-333-7788',
    petId: 'p-07',
    petName: 'น้องโกโก้',
    petSpecies: 'DOG',
    petBreed: 'ยอร์คเชียร์ เทอร์เรีย',
    petWeight: 2.8,
    serviceId: 's-01',
    serviceName: 'อาบน้ำ + สปาน้ำแร่บำรุงขน',
    groomerId: 'u-03',
    groomerName: 'ช่างพลอย',
    status: 'PICKED_UP',
    preferredCut: 'เล็มขนรอบตาและอุ้งเท้า',
    shampoo: 'แชมพู Silky Coat สำหรับขนยาว',
    specialCareNotes: 'ไม่มี',
    behaviorNotes: 'เรียบร้อย',
    estimatedDurationMinutes: 60,
    actualDurationMinutes: 55,
    priceMinor: 40000,
    startedAt: '08:00',
    checkInTime: '07:50',
  },
];

interface ColumnConfig {
  stage: GroomingStage;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  borderColor: string;
  badgeBg: string;
  nextStage?: GroomingStage;
  nextActionLabel?: string;
  nextActionColor?: string;
}

const STAGE_COLUMNS: ColumnConfig[] = [
  {
    stage: 'WAITING',
    title: 'รอคิว',
    subtitle: 'Waiting',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    headerBg: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
    borderColor: 'border-amber-200 dark:border-amber-900/50',
    badgeBg: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    nextStage: 'BATHING',
    nextActionLabel: 'เริ่มอาบน้ำ',
    nextActionColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
  },
  {
    stage: 'BATHING',
    title: 'กำลังอาบน้ำ',
    subtitle: 'Bathing',
    icon: <Droplets className="w-4 h-4 text-blue-600" />,
    headerBg: 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-900/50',
    badgeBg: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    nextStage: 'DRYING',
    nextActionLabel: 'เริ่มเป่าขน',
    nextActionColor: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20',
  },
  {
    stage: 'DRYING',
    title: 'กำลังเป่าขน',
    subtitle: 'Drying',
    icon: <Wind className="w-4 h-4 text-sky-600" />,
    headerBg: 'bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200',
    borderColor: 'border-sky-200 dark:border-sky-900/50',
    badgeBg: 'bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200',
    nextStage: 'GROOMING',
    nextActionLabel: 'เริ่มตัดแต่งขน',
    nextActionColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
  },
  {
    stage: 'GROOMING',
    title: 'กำลังตัดขน',
    subtitle: 'Grooming',
    icon: <Scissors className="w-4 h-4 text-indigo-600" />,
    headerBg: 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200',
    borderColor: 'border-indigo-200 dark:border-indigo-900/50',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
    nextStage: 'FINISHING',
    nextActionLabel: 'ตรวจเช็ค & เก็บงาน',
    nextActionColor: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
  },
  {
    stage: 'FINISHING',
    title: 'เก็บงาน & ผูกโบว์',
    subtitle: 'Finishing',
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
    headerBg: 'bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200',
    borderColor: 'border-purple-200 dark:border-purple-900/50',
    badgeBg: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    nextStage: 'READY',
    nextActionLabel: 'พร้อมรับกลับ',
    nextActionColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
  },
  {
    stage: 'READY',
    title: 'พร้อมรับกลับ',
    subtitle: 'Ready for Pickup',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    headerBg: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
    borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    nextStage: 'PICKED_UP',
    nextActionLabel: 'บันทึกรับน้องกลับ',
    nextActionColor: 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20',
  },
  {
    stage: 'PICKED_UP',
    title: 'รับน้องแล้ว',
    subtitle: 'Picked Up',
    icon: <Check className="w-4 h-4 text-slate-500" />,
    headerBg: 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200',
    borderColor: 'border-slate-200 dark:border-slate-800',
    badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
];

export default function GroomingQueueBoardPage() {
  const [queueItems, setQueueItems] = useState<GroomingCardItem[]>(initialQueueItems);
  const [selectedGroomer, setSelectedGroomer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<GroomingCardItem | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeLinePreviewItem, setActiveLinePreviewItem] = useState<GroomingCardItem | null>(null);

  // New Check-in Form state
  const [newPetName, setNewPetName] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newPetSpecies, setNewPetSpecies] = useState<'DOG' | 'CAT'>('DOG');
  const [newPetBreed, setNewPetBreed] = useState<string>('');
  const [newPetWeight, setNewPetWeight] = useState<string>('4.0');
  const [newServiceName, setNewServiceName] = useState<string>('อาบน้ำตัดขนสุนัขพันธุ์เล็ก');
  const [newGroomerName, setNewGroomerName] = useState<string>('ช่างเอก');
  const [newSpecialNotes, setNewSpecialNotes] = useState<string>('');

  // Active alerts count
  const alertStats = useMemo(() => {
    const overdue = queueItems.filter((i) => i.alerts?.isOverdue).length;
    const aggressive = queueItems.filter((i) => i.alerts?.isAggressive).length;
    const medical = queueItems.filter((i) => i.alerts?.isMedicalWarning).length;
    const delayedPickup = queueItems.filter((i) => i.alerts?.isDelayedPickup).length;
    const totalAlerts = queueItems.filter((i) => {
      const a = i.alerts;
      return a && (a.isOverdue || a.isAggressive || a.isMedicalWarning || a.isDelayedPickup || a.hasSpecialWarning);
    }).length;

    return { overdue, aggressive, medical, delayedPickup, totalAlerts };
  }, [queueItems]);

  // Filtered queue items
  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      // Alerts Only filter
      if (showOnlyAlerts) {
        const a = item.alerts;
        const hasAlert = a && (a.isOverdue || a.isAggressive || a.isMedicalWarning || a.isDelayedPickup || a.hasSpecialWarning);
        if (!hasAlert) return false;
      }

      // Groomer filter
      if (selectedGroomer !== 'ALL' && item.groomerName !== selectedGroomer) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.petName.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.includes(q) ||
          item.queueCode.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [queueItems, selectedGroomer, searchQuery, showOnlyAlerts]);

  // Toast notification trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Stage Advancement Handler
  const advanceStage = (id: string, targetStage: GroomingStage) => {
    setQueueItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nowStr = new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return {
            ...item,
            status: targetStage,
            startedAt: item.startedAt || (targetStage === 'BATHING' ? nowStr : item.startedAt),
          };
        }
        return item;
      })
    );

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, status: targetStage } : null));
    }

    if (targetStage === 'READY') {
      const found = queueItems.find((i) => i.id === id);
      if (found) {
        setActiveLinePreviewItem({ ...found, status: 'READY' });
      }
      showToast('🎉 กรูมมิ่งเสร็จแล้ว! ระบบเปิดพรีวิวข้อความแจ้งเตือน LINE พร้อมส่งหาลูกค้า');
    }
  };

  // Send LINE Pickup Reminder
  const handleSendLineReminder = (item: GroomingCardItem) => {
    setActiveLinePreviewItem(item);
  };

  // Submit New Check-In
  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName || !newCustomerName || !newCustomerPhone) return;

    const nextNumber = queueItems.length + 1;
    const nextCode = `Q0${nextNumber}`;

    const newItem: GroomingCardItem = {
      id: `q-${Date.now()}`,
      queueNumber: nextNumber,
      queueCode: nextCode,
      customerId: `c-${Date.now()}`,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      petId: `p-${Date.now()}`,
      petName: newPetName,
      petSpecies: newPetSpecies,
      petBreed: newPetBreed || (newPetSpecies === 'DOG' ? 'สุนัขพันธุ์ผสม' : 'แมวไทย'),
      petWeight: parseFloat(newPetWeight) || 4.0,
      serviceId: 's-01',
      serviceName: newServiceName,
      groomerName: newGroomerName,
      status: 'WAITING',
      specialCareNotes: newSpecialNotes,
      estimatedDurationMinutes: 75,
      priceMinor: 50000,
      checkInTime: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setQueueItems((prev) => [newItem, ...prev]);
    setIsCheckInModalOpen(false);
    showToast(`🐾 เช็คอิน #${nextCode} (${newPetName}) สำเร็จ`);

    // Reset form
    setNewPetName('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewSpecialNotes('');
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = queueItems.length;
    const inProgress = queueItems.filter((i) =>
      ['BATHING', 'DRYING', 'GROOMING', 'FINISHING'].includes(i.status)
    ).length;
    const waiting = queueItems.filter((i) => i.status === 'WAITING').length;
    const ready = queueItems.filter((i) => i.status === 'READY').length;
    const pickedUp = queueItems.filter((i) => i.status === 'PICKED_UP').length;
    return { total, inProgress, waiting, ready, pickedUp };
  }, [queueItems]);

  return (
    <div className="space-y-5">
      {/* Toast Floating Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Bar with Title and Quick Check-in CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  บอร์ดคิวกรูมมิ่ง (Grooming Queue)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#0071e3]">
                  สาขาทองหล่อ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ติดตามขั้นตอนอาบน้ำ เป่าขน ตัดแต่ง พร้อมระบบแจ้งเตือนคิวล่าช้าและข้อควรระวังพิเศษ
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnlyAlerts((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-apple ${
              showOnlyAlerts
                ? 'bg-rose-600 text-white border-rose-600 shadow-rose-600/20'
                : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>เฉพาะคิวแจ้งเตือน ({alertStats.totalAlerts})</span>
          </button>

          <Button
            onClick={() => setIsCheckInModalOpen(true)}
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-apple flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + เช็คอินรับน้องเข้าคิว
          </Button>
        </div>
      </div>

      {/* 2. Top Urgent Alert Bar (PF-032) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-blue-500/10 border border-amber-500/20 dark:border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-apple">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            สรุปการแจ้งเตือนประจำคิว (Queue Alerts):
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {alertStats.overdue > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold border border-rose-300/60 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-rose-600" />
                เกินเวลา {alertStats.overdue} คิว
              </span>
            )}

            {alertStats.aggressive > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300/60 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                พฤติกรรมดุ/ระวังกัด {alertStats.aggressive} คิว
              </span>
            )}

            {alertStats.medical > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 font-bold border border-teal-300/60 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                ข้อควรระวังสุขภาพ/แผล {alertStats.medical} คิว
              </span>
            )}

            {alertStats.delayedPickup > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold border border-blue-300/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
                รอมารับ &gt;30 นาที {alertStats.delayedPickup} คิว
              </span>
            )}
          </div>
        </div>

        {showOnlyAlerts && (
          <button
            onClick={() => setShowOnlyAlerts(false)}
            className="text-xs text-[#0071e3] font-bold hover:underline"
          >
            แสดงคิวทั้งหมด &gt;
          </button>
        )}
      </div>

      {/* 3. Real-time Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">คิวทั้งหมดวันนี้</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{metrics.total}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center font-bold">
            🐾
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">รอคิว</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{metrics.waiting}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">กำลังดำเนินการ</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{metrics.inProgress}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0071e3] flex items-center justify-center font-bold">
            <Scissors className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">พร้อมรับกลับ</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics.ready}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">รับน้องแล้ว</span>
            <span className="text-xl font-black text-slate-700 dark:text-slate-300">{metrics.pickedUp}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Search & Groomer Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อน้อง, เจ้าของ, เบอร์โทร, หรือรหัสคิว..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200/80 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0071e3] transition"
          />
        </div>

        {/* Groomer Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex-shrink-0">ช่าง:</span>
          {['ALL', 'ช่างเอก', 'ช่างแนน', 'ช่างพลอย'].map((groomer) => {
            const isSelected = selectedGroomer === groomer;
            return (
              <button
                key={groomer}
                onClick={() => setSelectedGroomer(groomer)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {groomer === 'ALL' ? 'ช่างทุกคน' : groomer}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Kanban Workflow Board (7 Columns - Horizontal Swipe on Mobile/iPad, 7-Col Grid on Desktop) */}
      <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory xl:grid xl:grid-cols-7 xl:overflow-visible items-start">
        {STAGE_COLUMNS.map((col) => {
          const colItems = filteredItems.filter((i) => i.status === col.stage);

          return (
            <div
              key={col.stage}
              className={`min-w-[280px] sm:min-w-[320px] xl:min-w-0 snap-center rounded-3xl border ${col.borderColor} bg-slate-50/50 dark:bg-slate-900/40 p-3 flex flex-col min-h-[550px] shadow-sm`}
            >
              {/* Column Header */}
              <div
                className={`p-3 rounded-2xl ${col.headerBg} flex items-center justify-between mb-3 shadow-xs`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                    {col.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs tracking-tight">{col.title}</h3>
                    <span className="text-[10px] opacity-70 block font-mono">
                      {col.subtitle}
                    </span>
                  </div>
                </div>

                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${col.badgeBg}`}
                >
                  {colItems.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1">
                {colItems.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                    <span>ไม่มีคิวในขั้นตอนนี้</span>
                  </div>
                ) : (
                  colItems.map((item) => {
                    const hasOverdue = item.alerts?.isOverdue;
                    const hasAggressive = item.alerts?.isAggressive;
                    const hasMedical = item.alerts?.isMedicalWarning;
                    const hasDelayedPickup = item.alerts?.isDelayedPickup;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer space-y-2.5 group shadow-apple hover:shadow-md ${
                          hasOverdue
                            ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/40 bg-rose-50/10'
                            : hasAggressive
                              ? 'border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/40 bg-amber-50/10'
                              : 'border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/40'
                        }`}
                      >
                        {/* Card Header: Queue Code & Species */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg font-black font-mono text-xs bg-blue-50 text-[#0071e3] border border-blue-200/60 dark:bg-blue-950 dark:border-blue-900">
                              {item.queueCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              เข้า {item.checkInTime}
                            </span>
                          </div>

                          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0071e3] flex items-center justify-center">
                            {item.petSpecies === 'DOG' ? (
                              <Dog className="w-4 h-4" />
                            ) : (
                              <Cat className="w-4 h-4 text-sky-600" />
                            )}
                          </div>
                        </div>

                        {/* Pet Name & Breed */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0071e3] transition">
                              {item.petName}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              ({item.petWeight} กก.)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {item.petBreed}
                          </p>
                        </div>

                        {/* HIGHLIGHTED ALERTS BADGES (PF-032) */}
                        <div className="space-y-1.5">
                          {/* 1. Overdue Alert */}
                          {hasOverdue && (
                            <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center justify-between animate-pulse">
                              <span className="flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5 text-rose-600" />
                                ⏱️ เกินเวลา (+{item.alerts?.overdueMinutes} นาที)
                              </span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-900">
                                Overdue
                              </span>
                            </div>
                          )}

                          {/* 2. Aggressive Behavior Alert */}
                          {hasAggressive && (
                            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span className="line-clamp-1">{item.alerts?.aggressiveDetail}</span>
                            </div>
                          )}

                          {/* 3. Medical Warning Alert */}
                          {hasMedical && (
                            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 text-teal-800 dark:text-teal-200 text-[10px] font-bold flex items-center gap-1">
                              <HeartPulse className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              <span className="line-clamp-1">{item.alerts?.medicalDetail}</span>
                            </div>
                          )}

                          {/* 4. Delayed Pickup Alert */}
                          {hasDelayedPickup && item.status === 'READY' && (
                            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 text-[#0071e3] text-[10px] font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
                                พร้อมรับ &gt;{item.alerts?.delayedMinutes} นาที
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendLineReminder(item);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-[#0071e3] text-white hover:bg-blue-700 text-[9px] flex items-center gap-0.5 transition cursor-pointer"
                              >
                                <Send className="w-2.5 h-2.5" />
                                ส่ง LINE
                              </button>
                            </div>
                          )}

                          {/* Fallback Special Care Notes */}
                          {!hasAggressive && !hasMedical && item.specialCareNotes && (
                            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-start gap-1">
                              <ShieldAlert className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                              <span className="line-clamp-1">{item.specialCareNotes}</span>
                            </div>
                          )}
                        </div>

                        {/* Service & Price */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 line-clamp-1 max-w-[120px]">
                            {item.serviceName}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {(item.priceMinor / 100).toLocaleString('th-TH')} ฿
                          </span>
                        </div>

                        {/* Groomer Badge & Fast Advance Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold">{item.groomerName || 'ยังไม่ระบุ'}</span>
                          </div>

                          {col.nextStage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (col.nextStage) {
                                  advanceStage(item.id, col.nextStage);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer ${col.nextActionColor}`}
                            >
                              <span>{col.nextActionLabel}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Quick Detail Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 font-black text-sm font-mono text-[#0071e3]">
                      {selectedItem.queueCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      เข้าคิวเวลา {selectedItem.checkInTime} น.
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    รายละเอียดคิวกรูมมิ่ง ({selectedItem.petName})
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Pet Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0071e3] flex items-center justify-center">
                    {selectedItem.petSpecies === 'DOG' ? (
                      <Dog className="w-6 h-6" />
                    ) : (
                      <Cat className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedItem.petName}
                    </h4>
                    <p className="text-slate-500">
                      {selectedItem.petBreed} • น้ำหนัก: <strong>{selectedItem.petWeight} กก.</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1">
                      เจ้าของ: {selectedItem.customerName}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/pets/${selectedItem.petId}`}
                  className="text-[#0071e3] font-semibold hover:underline flex items-center gap-1"
                >
                  โปรไฟล์ <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* SPECIAL ALERTS & CAUTIONS BANNER (PF-032) */}
              {(selectedItem.alerts?.isOverdue ||
                selectedItem.alerts?.isAggressive ||
                selectedItem.alerts?.isMedicalWarning ||
                selectedItem.alerts?.isDelayedPickup) && (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ข้อควรระวังพิเศษประจำคิวนี้:
                  </div>

                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    {selectedItem.alerts?.isOverdue && (
                      <p className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <Timer className="w-3.5 h-3.5" />
                        เกินเวลาประมาณการแล้ว +{selectedItem.alerts.overdueMinutes} นาที
                      </p>
                    )}
                    {selectedItem.alerts?.isAggressive && (
                      <p className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        {selectedItem.alerts.aggressiveDetail}
                      </p>
                    )}
                    {selectedItem.alerts?.isMedicalWarning && (
                      <p className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-medium">
                        <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                        {selectedItem.alerts.medicalDetail}
                      </p>
                    )}
                    {selectedItem.alerts?.isDelayedPickup && (
                      <p className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
                        ทำเสร็จพร้อมรับแล้ว &gt;{selectedItem.alerts.delayedMinutes} นาที
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Grooming Specifications & Shampoo */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple space-y-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  สเปกทรงตัด & แชมพู (Grooming Specifications)
                </span>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100">
                    <span className="font-bold text-[#0071e3] block mb-0.5">✂️ ทรงขนที่ลูกค้าต้องการ:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {selectedItem.preferredCut || 'ตัดแต่งตามมาตรฐานสายพันธุ์'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100">
                    <span className="font-bold text-purple-700 dark:text-purple-400 block mb-0.5">🧴 แชมพู & ทรีตเมนต์:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {selectedItem.shampoo || 'แชมพูสูตรอ่อนโยนมาตรฐาน'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Contact & Call */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-apple flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">ติดต่อเจ้าของ</span>
                  <strong className="text-slate-900 dark:text-white text-xs">{selectedItem.customerName}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedItem.customerPhone}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0071e3] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {selectedItem.customerPhone}
                  </a>
                  <button
                    onClick={() => handleSendLineReminder(selectedItem)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    ส่ง LINE เตือน
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                onClick={() => handleSendLineReminder(selectedItem)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                ส่ง LINE แจ้งสถานะ
              </button>

              <Button
                onClick={() => setSelectedItem(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-4 py-2"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Check-In Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleCheckInSubmit}>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      เช็คอินรับน้องเข้าคิวกรูมมิ่ง (Check-in)
                    </h3>
                    <p className="text-[11px] text-slate-400">ออกหมายเลขคิวและระบุบริการหน้าร้าน</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* Pet Name & Species */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ชื่อน้องสัตว์เลี้ยง *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="เช่น น้องโมจิ"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ประเภทสัตว์เลี้ยง
                    </label>
                    <select
                      value={newPetSpecies}
                      onChange={(e) => setNewPetSpecies(e.target.value as 'DOG' | 'CAT')}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    >
                      <option value="DOG">🐶 สุนัข (Dog)</option>
                      <option value="CAT">🐱 แมว (Cat)</option>
                    </select>
                  </div>
                </div>

                {/* Breed & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      สายพันธุ์
                    </label>
                    <input
                      type="text"
                      value={newPetBreed}
                      onChange={(e) => setNewPetBreed(e.target.value)}
                      placeholder="เช่น ปอมเมอเรเนียน"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      น้ำหนักชั่งจริง (กก.)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newPetWeight}
                      onChange={(e) => setNewPetWeight(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ชื่อเจ้าของ *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="เช่น คุณสุภาพร"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Service & Groomer */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      บริการที่เลือก
                    </label>
                    <select
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    >
                      <option value="อาบน้ำตัดขนสุนัขพันธุ์เล็ก">อาบน้ำ + ตัดขนสุนัขเล็ก</option>
                      <option value="อาบน้ำสปาโอโซนแมว">อาบน้ำ + สปาโอโซนแมว</option>
                      <option value="อาบน้ำสุนัขพันธุ์ใหญ่">อาบน้ำสุนัขพันธุ์ใหญ่</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      มอบหมายช่าง
                    </label>
                    <select
                      value={newGroomerName}
                      onChange={(e) => setNewGroomerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    >
                      <option value="ช่างเอก">ช่างเอก</option>
                      <option value="ช่างแนน">ช่างแนน</option>
                      <option value="ช่างพลอย">ช่างพลอย</option>
                    </select>
                  </div>
                </div>

                {/* Special Notes */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ข้อควรระวัง / ทรงที่ต้องการ
                  </label>
                  <textarea
                    rows={2}
                    value={newSpecialNotes}
                    onChange={(e) => setNewSpecialNotes(e.target.value)}
                    placeholder="เช่น ระวังติ่งเนื้อที่หู, ทรงหน้าหมี"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/60 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-5 py-2"
                >
                  ยืนยันเช็คอินเข้าคิว
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE OA Flex Message Preview Modal (Item 2) */}
      {activeLinePreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#2c2d30] text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700 space-y-0">
            {/* LINE Top Bar */}
            <div className="bg-[#00B900] text-white px-5 py-3.5 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>PetFlow Official LINE OA</span>
              </div>
              <button
                onClick={() => setActiveLinePreviewItem(null)}
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body (LINE Bubble) */}
            <div className="p-5 bg-[#74889e] dark:bg-slate-950 space-y-4">
              {/* Flex Message Card */}
              <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                {/* Header Badge */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                    Grooming Completed ✨
                  </span>
                  <h3 className="text-base font-black mt-1">
                    น้อง{activeLinePreviewItem.petName} กรูมมิ่งเสร็จแล้วค่ะ! 🐾
                  </h3>
                  <p className="text-xs text-white/90">
                    เรียนคุณ {activeLinePreviewItem.customerName} มารับน้องได้เลยนะคะ
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">บริการที่ทำ:</span>
                    <strong className="text-slate-800">{activeLinePreviewItem.serviceName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">ช่างผู้ดูแล:</span>
                    <span className="font-semibold text-slate-700">{activeLinePreviewItem.groomerName || 'ช่างประจำ'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">ยอดค่าบริการ:</span>
                    <strong className="text-emerald-600 text-sm font-black">
                      {(activeLinePreviewItem.priceMinor / 100).toLocaleString('th-TH')} ฿
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">สถานที่รับ:</span>
                    <span className="text-slate-700">สาขาทองหล่อ (สุขุมวิท 55)</span>
                  </div>
                </div>

                {/* Action Buttons inside LINE card */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <a
                    href="tel:0812345678"
                    className="flex-1 py-2 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    📞 โทรติดต่อร้าน
                  </a>
                  <button
                    onClick={() => {
                      showToast(`📲 ส่งข้อความ LINE สำเร็จไปยัง ${activeLinePreviewItem.customerPhone}`);
                      setActiveLinePreviewItem(null);
                    }}
                    className="flex-1 py-2 text-center text-xs font-bold text-white bg-[#00B900] hover:bg-[#009e00] rounded-xl shadow-xs cursor-pointer"
                  >
                    ✓ ส่ง LINE ตอนนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Sparkles,
  Users,
  Send,
  Calendar,
  Clock,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  Search,
  Filter,
  Plus,
  X,
  MessageSquare,
  Gift,
  Crown,
  Scissors,
  Syringe,
  Eye,
  DollarSign,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import {
  CampaignItem,
  CampaignAudienceSegment,
  CampaignStatus,
  CampaignChannel,
  CampaignDiscountType,
} from '@petflow/types';

// Mock campaigns
const MOCK_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'camp-1',
    tenantId: 't1',
    name: 'แคมเปญดึงดูดลูกค้าหาย 90 วัน (Win-Back Lost 90D)',
    channel: 'LINE',
    status: 'COMPLETED',
    audienceSegment: 'LOST',
    audienceFilterCriteria: { minDaysSinceLastVisit: 90 },
    messageTemplate:
      'สวัสดีครับคุณ {customerName} ทางร้านคิดถึงน้อง {petName} มากเลยครับ! รับส่วนลด 15% ทันทีเมื่อพาน้องมาใช้บริการ เพียงแจ้งรหัส {promoCode} 🐶✨',
    promoCode: 'COMEBACK15',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    scheduledAt: '2026-08-15T10:00:00Z',
    createdAt: '2026-08-14T09:00:00Z',
    targetCount: 45,
    sentCount: 45,
    deliveredCount: 43,
    convertedCount: 12,
    revenueGeneratedMinor: 960000, // 9,600 THB
    conversionRate: 26.7,
  },
  {
    id: 'camp-2',
    tenantId: 't1',
    name: 'กระตุ้นลูกค้ากลุ่มเสี่ยงไม่มาเกิน 60 วัน (At-Risk Re-engagement)',
    channel: 'LINE',
    status: 'RUNNING',
    audienceSegment: 'AT_RISK',
    audienceFilterCriteria: { minDaysSinceLastVisit: 60 },
    messageTemplate:
      'สวัสดีครับคุณ {customerName} ขนของน้อง {petName} เริ่มยาวหรือยังครับ? จองคิววันนี้ รับฟรีทรีตเมนต์บำรุงขนนุ่ม รหัส {promoCode} 🐾🛁',
    promoCode: 'SOFTFUR',
    discountType: 'FREE_SERVICE',
    discountValue: 0,
    scheduledAt: '2026-08-25T11:00:00Z',
    createdAt: '2026-08-24T14:00:00Z',
    targetCount: 28,
    sentCount: 28,
    deliveredCount: 28,
    convertedCount: 6,
    revenueGeneratedMinor: 480000, // 4,800 THB
    conversionRate: 21.4,
  },
  {
    id: 'camp-3',
    tenantId: 't1',
    name: 'สิทธิพิเศษขอบคุณลูกค้า VIP (VIP Exclusive Gift)',
    channel: 'LINE',
    status: 'SCHEDULED',
    audienceSegment: 'VIP',
    audienceFilterCriteria: null,
    messageTemplate:
      'สวัสดีครับคุณ {customerName} ขอบคุณที่เป็นลูกค้าคนพิเศษของทางร้านเสมอมาครับ! มอบคูปองส่วนลด ฿200 สำหรับน้อง {petName} รหัส {promoCode} 👑💖',
    promoCode: 'VIPSPECIAL',
    discountType: 'FIXED',
    discountValue: 20000,
    scheduledAt: '2026-09-01T09:00:00Z',
    createdAt: '2026-08-26T16:00:00Z',
    targetCount: 15,
    sentCount: 0,
    deliveredCount: 0,
    convertedCount: 0,
    revenueGeneratedMinor: 0,
    conversionRate: 0,
  },
  {
    id: 'camp-4',
    tenantId: 't1',
    name: 'แจ้งเตือนรอบกรูมมิ่งประจำเดือน (Monthly Grooming Booster)',
    channel: 'LINE',
    status: 'DRAFT',
    audienceSegment: 'GROOMING_DUE',
    audienceFilterCriteria: null,
    messageTemplate:
      'สวัสดีครับคุณ {customerName} น้อง {petName} ถึงรอบกรูมมิ่งประจำเดือนแล้วนะครับ จองคิวก่อนล่วงหน้าเพื่อรับช่วงเวลาที่สะดวกที่สุดครับ ✂️🐾',
    promoCode: 'GROOMNOW',
    discountType: 'NONE',
    discountValue: 0,
    scheduledAt: '2026-09-05T10:00:00Z',
    createdAt: '2026-08-27T08:00:00Z',
    targetCount: 32,
    sentCount: 0,
    deliveredCount: 0,
    convertedCount: 0,
    revenueGeneratedMinor: 0,
    conversionRate: 0,
  },
];

const AUDIENCE_SEGMENT_CONFIG: Record<
  CampaignAudienceSegment,
  { label: string; badgeColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ALL: { label: 'ลูกค้าทุกคน', badgeColor: 'bg-slate-100 text-slate-700', icon: Users },
  LOST: { label: 'ลูกค้าที่หายไป (Lost >90 วัน)', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle },
  AT_RISK: { label: 'ลูกค้ากลุ่มเสี่ยง (At-Risk 60-90 วัน)', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  VIP: { label: 'ลูกค้าชั้นดี (VIP Top 20%)', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', icon: Crown },
  GROOMING_DUE: { label: 'ถึงรอบกรูมมิ่ง (Grooming Due)', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', icon: Scissors },
  VACCINE_DUE: { label: 'ถึงรอบวัคซีน (Vaccine Due)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Syringe },
  NEW: { label: 'ลูกค้าใหม่ (New)', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', icon: Sparkles },
};

const STATUS_BADGES: Record<
  CampaignStatus,
  { label: string; badgeColor: string }
> = {
  DRAFT: { label: 'แบบร่าง', badgeColor: 'bg-slate-100 text-slate-600 border-slate-200' },
  SCHEDULED: { label: 'ตั้งเวลาส่ง', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  RUNNING: { label: 'กำลังส่ง...', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' },
  COMPLETED: { label: 'ส่งสำเร็จแล้ว', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'ยกเลิกแล้ว', badgeColor: 'bg-rose-50 text-rose-600 border-rose-200' },
  PAUSED: { label: 'หยุดชั่วคราว', badgeColor: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function WinBackCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(MOCK_CAMPAIGNS);
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<CampaignItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Campaign Form state
  const [formName, setFormName] = useState('แคมเปญ Win-Back ลูกค้าหาย > 90 วัน');
  const [formAudience, setFormAudience] = useState<CampaignAudienceSegment>('LOST');
  const [formChannel, setFormChannel] = useState<CampaignChannel>('LINE');
  const [formTemplate, setFormTemplate] = useState(
    'สวัสดีครับคุณ {customerName} ทางร้านคิดถึงน้อง {petName} มากเลยครับ! รับส่วนลด 15% ทันทีเมื่อพาน้องมาใช้บริการ เพียงแจ้งรหัส {promoCode} 🐶✨'
  );
  const [formPromoCode, setFormPromoCode] = useState('WINBACK15');
  const [formDiscountType, setFormDiscountType] = useState<CampaignDiscountType>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState(15);
  const [launchImmediately, setLaunchImmediately] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Metrics
  const metrics = useMemo(() => {
    const total = campaigns.length;
    let totalSent = 0;
    let totalConverted = 0;
    let totalRevenue = 0;

    for (const c of campaigns) {
      totalSent += c.sentCount;
      totalConverted += c.convertedCount;
      totalRevenue += c.revenueGeneratedMinor;
    }

    const avgRate = totalSent > 0 ? Math.round((totalConverted / totalSent) * 1000) / 10 : 0;

    return { total, totalSent, totalConverted, totalRevenue, avgRate };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const s = searchTerm.toLowerCase().trim();
      const matchSearch =
        !s ||
        c.name.toLowerCase().includes(s) ||
        (c.promoCode && c.promoCode.toLowerCase().includes(s));
      return matchStatus && matchSearch;
    });
  }, [campaigns, selectedStatus, searchTerm]);

  // Live preview tags replacement
  const liveMessagePreview = useMemo(() => {
    return formTemplate
      .replace(/{customerName}/g, 'กนกวรรณ')
      .replace(/{petName}/g, 'โมจิ')
      .replace(/{promoCode}/g, formPromoCode || 'WINBACK');
  }, [formTemplate, formPromoCode]);

  const handleLaunchCampaign = (campId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campId
          ? {
              ...c,
              status: 'COMPLETED',
              sentCount: c.targetCount,
              deliveredCount: c.targetCount - 1,
              convertedCount: Math.round(c.targetCount * 0.25),
              revenueGeneratedMinor: Math.round(c.targetCount * 0.25) * 80000,
              conversionRate: 25.0,
            }
          : c
      )
    );
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const newCamp: CampaignItem = {
      id: 'camp-' + Date.now(),
      tenantId: 't1',
      name: formName,
      channel: formChannel,
      status: launchImmediately ? 'COMPLETED' : 'DRAFT',
      audienceSegment: formAudience,
      audienceFilterCriteria: null,
      messageTemplate: formTemplate,
      promoCode: formPromoCode,
      discountType: formDiscountType,
      discountValue: formDiscountValue,
      scheduledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      targetCount: formAudience === 'LOST' ? 38 : formAudience === 'AT_RISK' ? 24 : 16,
      sentCount: launchImmediately ? (formAudience === 'LOST' ? 38 : 24) : 0,
      deliveredCount: launchImmediately ? (formAudience === 'LOST' ? 37 : 23) : 0,
      convertedCount: 0,
      revenueGeneratedMinor: 0,
      conversionRate: 0,
    };

    setTimeout(() => {
      setCampaigns((prev) => [newCamp, ...prev]);
      setFormSubmitting(false);
      setCreateSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(false);
      }, 1200);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/retention" className="hover:text-slate-900 dark:hover:text-white">
          การรักษาลูกค้า (Retention)
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0071e3] dark:text-blue-400 font-bold">
          แคมเปญดึงดูดลูกค้ากลับมา (Win-Back Campaigns)
        </span>
      </div>

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ระบบแคมเปญดึงดูดลูกค้ากลับมา (Win-Back & Retention Campaigns)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <Sparkles className="w-3 h-3 text-emerald-600" /> LINE Ready
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            สร้างแคมเปญและข้อความโปรโมชั่นอัตโนมัติ เจาะจงกลุ่มลูกค้าที่หายไป (Lost), ลูกค้ากลุ่มเสี่ยง (At-Risk), และลูกค้า VIP เพื่อเพิ่มอัตราการกลับมาใช้บริการซ้ำ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            สร้างแคมเปญใหม่ (Create Campaign)
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              แคมเปญทั้งหมด
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.total} <span className="text-sm font-normal text-slate-500">แคมเปญ</span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
              ครอบคลุมทุกกลุ่มเป้าหมาย
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ข้อความที่ส่งถึงลูกค้า
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.totalSent} <span className="text-sm font-normal text-slate-500">ข้อความ</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
              ผ่าน LINE Official Account
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ลูกค้ากลับมาใช้บริการ (Conversions)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.totalConverted} <span className="text-sm font-normal text-slate-500">ราย ({metrics.avgRate}%)</span>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1 inline-block">
              Re-engagement สำเร็จ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              รายได้ที่กู้คืนได้ (Recovered Revenue)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              ฿{(metrics.totalRevenue / 100).toLocaleString('th-TH')}
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
              ROI จากแคมเปญ Win-Back
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3 Quick-Start Campaign Presets */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          เทมเพลตแคมเปญแนะนำ (Ready-to-use Presets)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/70 dark:border-rose-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                  Win-Back Lost
                </span>
                <span className="text-xs text-rose-600 font-semibold">ส่วนลด 15%</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                ดึงดูดลูกค้าหายไปนานกว่า 90 วัน
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                ส่งข้อความ "คิดถึงน้อง..." พร้อมรหัสคูปองส่วนลดพิเศษ เพื่อกระตุ้นให้กลับมาจองคิว
              </p>
            </div>
            <button
              onClick={() => {
                setFormName('แคมเปญ Win-Back ลูกค้าหาย 90 วัน');
                setFormAudience('LOST');
                setFormPromoCode('COMEBACK15');
                setFormDiscountType('PERCENTAGE');
                setFormDiscountValue(15);
                setIsCreateModalOpen(true);
              }}
              className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm transition active:scale-95"
            >
              ใช้เทมเพลตนี้
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/70 dark:border-amber-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  At-Risk Alert
                </span>
                <span className="text-xs text-amber-600 font-semibold">ฟรีของแถม</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                เตือนลูกค้ากลุ่มเสี่ยง 60-90 วัน
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                เสนอของแถมพิเศษ เช่น ฟรีทรีตเมนต์บำรุงขน หรือตัดเล็บเช็ดหู เพื่อจูงใจให้รีบจอง
              </p>
            </div>
            <button
              onClick={() => {
                setFormName('กระตุ้นลูกค้ากลุ่มเสี่ยง At-Risk');
                setFormAudience('AT_RISK');
                setFormPromoCode('FREECARE');
                setFormDiscountType('FREE_SERVICE');
                setFormDiscountValue(0);
                setIsCreateModalOpen(true);
              }}
              className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm transition active:scale-95"
            >
              ใช้เทมเพลตนี้
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/70 dark:border-blue-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  VIP Rewards
                </span>
                <span className="text-xs text-blue-600 font-semibold">คูปองเงินสด ฿200</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                รักษาฐานลูกค้า VIP ชั้นดี
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                ขอบคุณลูกค้าที่ใช้จ่ายสม่ำเสมอ มอบสิทธิ์จองคิวพิเศษและส่วนลดเอกสิทธิ์
              </p>
            </div>
            <button
              onClick={() => {
                setFormName('สิทธิพิเศษลูกค้า VIP');
                setFormAudience('VIP');
                setFormPromoCode('VIPCLUB');
                setFormDiscountType('FIXED');
                setFormDiscountValue(200);
                setIsCreateModalOpen(true);
              }}
              className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm transition active:scale-95"
            >
              ใช้เทมเพลตนี้
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({campaigns.length})
          </button>
          <button
            onClick={() => setSelectedStatus('RUNNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'RUNNING'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            กำลังส่ง
          </button>
          <button
            onClick={() => setSelectedStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'COMPLETED'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            สำเร็จแล้ว
          </button>
          <button
            onClick={() => setSelectedStatus('SCHEDULED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'SCHEDULED'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ตั้งเวลาส่ง
          </button>
          <button
            onClick={() => setSelectedStatus('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'DRAFT'
                ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            แบบร่าง
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อแคมเปญ หรือ รหัสโปรโมชั่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">ชื่อแคมเปญ & รหัสโปรโมชั่น</th>
                <th className="py-3.5 px-4">กลุ่มเป้าหมาย</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จำนวนที่ส่ง (Delivered)</th>
                <th className="py-3.5 px-4 text-center">กลับมาใช้บริการ (Conversion)</th>
                <th className="py-3.5 px-4 text-right">รายได้ที่กู้คืน</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบแคมเปญในเงื่อนไขที่เลือก</p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => {
                  const audienceConfig = AUDIENCE_SEGMENT_CONFIG[camp.audienceSegment] || AUDIENCE_SEGMENT_CONFIG.ALL;
                  const statusConfig = STATUS_BADGES[camp.status] || STATUS_BADGES.DRAFT;
                  const AudienceIcon = audienceConfig.icon;

                  return (
                    <tr
                      key={camp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {camp.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                            {camp.promoCode || 'ไม่มีรหัส'}
                          </span>
                          <span className="text-xs text-slate-400">• ช่องทาง: {camp.channel}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${audienceConfig.badgeColor}`}
                        >
                          <AudienceIcon className="w-3 h-3" />
                          {audienceConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeColor}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {camp.sentCount} / {camp.targetCount}
                        </div>
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-[#0071e3] h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${camp.targetCount > 0 ? (camp.sentCount / camp.targetCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-purple-700 dark:text-purple-400 text-xs">
                          {camp.convertedCount} ราย ({camp.conversionRate}%)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ฿{(camp.revenueGeneratedMinor / 100).toLocaleString('th-TH')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {camp.status === 'DRAFT' || camp.status === 'SCHEDULED' ? (
                            <button
                              onClick={() => handleLaunchCampaign(camp.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              ส่งทันที
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveCampaign(camp);
                                setIsDetailModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              ดูผลลัพธ์
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0071e3] dark:bg-blue-950/60">
                  <Megaphone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    สร้างแคมเปญดึงดูดลูกค้ากลับมา (Create Win-Back Campaign)
                  </h3>
                  <p className="text-xs text-slate-500">
                    กำหนดกลุ่มเป้าหมาย ข้อความโปรโมชั่น และรหัสส่วนลด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อแคมเปญ (Campaign Name):
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    กลุ่มเป้าหมาย (Audience Segment):
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="LOST">🔴 ลูกค้าที่หายไป (Lost &gt;90 วัน)</option>
                    <option value="AT_RISK">🟡 ลูกค้ากลุ่มเสี่ยง (At-Risk 60-90 วัน)</option>
                    <option value="VIP">👑 ลูกค้าชั้นดี (VIP Top 20%)</option>
                    <option value="GROOMING_DUE">✂️ สัตว์เลี้ยงถึงรอบกรูมมิ่ง (Grooming Due)</option>
                    <option value="VACCINE_DUE">💉 สัตว์เลี้ยงถึงรอบวัคซีน (Vaccine Due)</option>
                    <option value="ALL">👥 ลูกค้าทุกคน (All Customers)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ช่องทางการส่ง (Delivery Channel):
                  </label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="LINE">💚 LINE Official Account</option>
                    <option value="SMS">📱 SMS Message</option>
                  </select>
                </div>
              </div>

              {/* Promo code & discount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    รหัสโปรโมชั่น (Promo Code):
                  </label>
                  <input
                    type="text"
                    value={formPromoCode}
                    onChange={(e) => setFormPromoCode(e.target.value.toUpperCase())}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                    placeholder="WINBACK15"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    ประเภทส่วนลด:
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="PERCENTAGE">ส่วนลดเปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">ส่วนลดบาทคงที่ (฿)</option>
                    <option value="FREE_SERVICE">ฟรีบริการของแถม</option>
                    <option value="NONE">ไม่มีส่วนลด</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    มูลค่าส่วนลด:
                  </label>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Message Template Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    เทมเพลตข้อความ (Message Template):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    แท็กที่ใช้ได้: {'{customerName}'}, {'{petName}'}, {'{promoCode}'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formTemplate}
                  onChange={(e) => setFormTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-normal leading-relaxed"
                  required
                />
              </div>

              {/* Live Preview Bubble */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> ตัวอย่างข้อความที่จะแสดงบน LINE:
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs shadow-sm border border-emerald-100 dark:border-emerald-900 leading-relaxed whitespace-pre-wrap">
                  {liveMessagePreview}
                </div>
              </div>

              {/* Launch Option */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <input
                  type="checkbox"
                  id="launchImmediate"
                  checked={launchImmediately}
                  onChange={(e) => setLaunchImmediately(e.target.checked)}
                  className="rounded border-slate-300 text-[#0071e3] focus:ring-[#0071e3]"
                />
                <label htmlFor="launchImmediate" className="font-medium text-slate-700 dark:text-slate-300">
                  ส่งข้อความหาลูกค้าทันทีหลังจากสร้างแคมเปญ (Launch immediately)
                </label>
              </div>

              {createSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> สร้างและบันทึกแคมเปญเรียบร้อยแล้ว!
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {formSubmitting ? 'กำลังสร้าง...' : launchImmediately ? 'สร้างและส่งทันที' : 'บันทึกแคมเปญ'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {isDetailModalOpen && activeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {activeCampaign.name}
                </h3>
                <p className="text-xs text-slate-500">รหัสโปรโมชั่น: {activeCampaign.promoCode}</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
              <div>
                <div className="text-xs text-slate-500">เป้าหมาย</div>
                <div className="font-bold text-slate-800 dark:text-white text-sm">
                  {activeCampaign.targetCount} ราย
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ส่งสำเร็จ</div>
                <div className="font-bold text-blue-600 text-sm">
                  {activeCampaign.sentCount} ราย
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">กลับมาซื้อ</div>
                <div className="font-bold text-emerald-600 text-sm">
                  {activeCampaign.convertedCount} ราย
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                รายได้ที่กู้คืนได้:
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                ฿{(activeCampaign.revenueGeneratedMinor / 100).toLocaleString('th-TH')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">ข้อความที่ส่ง:</div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                {activeCampaign.messageTemplate}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

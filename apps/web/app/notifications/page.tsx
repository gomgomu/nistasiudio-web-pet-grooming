'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  Copy,
  ExternalLink,
  Edit2,
  Eye,
  Sliders,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { Button, Badge } from '@petflow/ui';

export interface NotificationTemplate {
  id: string;
  name: string;
  category: 'APPOINTMENT' | 'GROOMING_READY' | 'VACCINE_REMINDER' | 'FOLLOW_UP';
  channel: 'LINE_OA' | 'SMS';
  triggerTiming: string;
  messageText: string;
  isActive: boolean;
  variables: string[];
}

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-01',
    name: 'แจ้งเตือนนัดหมายล่วงหน้า 24 ชม.',
    category: 'APPOINTMENT',
    channel: 'LINE_OA',
    triggerTiming: 'ล่วงหน้า 24 ชั่วโมงก่อนเวลานัด',
    messageText:
      'สวัสดีค่ะคุณ {customer_name} 🐾 แจ้งเตือนนัดหมายของน้อง {pet_name} ในวันพรุ่งนี้ เวลา {appointment_time} บริการ: {service_name} ที่ PetFlow Clinic สาขา {branch_name} หากต้องการเลื่อนนัดกรุณากดตอบกลับค่ะ ขอบคุณค่ะ',
    isActive: true,
    variables: ['customer_name', 'pet_name', 'appointment_time', 'service_name', 'branch_name'],
  },
  {
    id: 'tpl-02',
    name: 'กรูมมิ่งเสร็จแล้ว พร้อมรับน้องกลับ',
    category: 'GROOMING_READY',
    channel: 'LINE_OA',
    triggerTiming: 'ทันทีที่สถานะเปลี่ยนเป็น "พร้อมรับกลับ (READY)"',
    messageText:
      '🎉 น้อง {pet_name} อาบน้ำตัดแต่งขนเสร็จเรียบร้อยแล้วค่ะ! สวยหล่อหอมชื่นใจ พร้อมให้คุณพ่อคุณแม่มารับกลับบ้านได้เลยนะคะ 🐶✨ ที่ PetFlow Salon โทร {branch_phone}',
    isActive: true,
    variables: ['pet_name', 'branch_phone'],
  },
  {
    id: 'tpl-03',
    name: 'เตือนฉีดวัคซีนและป้องกันพยาธิประจำปี',
    category: 'VACCINE_REMINDER',
    channel: 'LINE_OA',
    triggerTiming: '11 เดือนหลังจากฉีดวัคซีนเข็มล่าสุด',
    messageText:
      'เรียนคุณ {customer_name} 🏥 ใกล้ถึงรอบฉีดวัคซีนประจำปีของน้อง {pet_name} แล้วนะคะ (วัคซีน: {vaccine_name}) เพื่อสุขภาพและภูมิคุ้มกันที่แข็งแรง สามารถจองคิวตรวจกับคุณหมอได้ที่ลิงก์นี้ค่ะ: {booking_url}',
    isActive: true,
    variables: ['customer_name', 'pet_name', 'vaccine_name', 'booking_url'],
  },
  {
    id: 'tpl-04',
    name: 'ติดตามอาการหลังการรักษา 3 วัน (Clinical Follow-up)',
    category: 'FOLLOW_UP',
    channel: 'LINE_OA',
    triggerTiming: '3 วันหลังจากตรวจรักษา',
    messageText:
      'สวัสดีค่ะคุณ {customer_name} 🩺 คุณหมอขอติดตามอาการของน้อง {pet_name} หลังจากเข้ารับการรักษา {diagnosis} น้องทานยาและอาการดีขึ้นไหมคะ? หากมีอาการผิดปกติสามารถส่งข้อความปรึกษาทีมแพทย์ได้ทันทีค่ะ',
    isActive: true,
    variables: ['customer_name', 'pet_name', 'diagnosis'],
  },
];

export default function NotificationsSettingsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // LINE OA Config States
  const [lineChannelId, setLineChannelId] = useState('2001928374');
  const [lineChannelSecret, setLineChannelSecret] = useState('••••••••••••••••••••••••••••••••');
  const [lineAccessToken, setLineAccessToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9••••••••');
  const [isLineConnected, setIsLineConnected] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
    showToast('ปรับสถานะเทมเพลตเรียบร้อย');
  };

  const handlePreview = (tpl: NotificationTemplate) => {
    setSelectedTemplate(tpl);
    setPreviewModalOpen(true);
  };

  const renderSampleText = (text: string) => {
    return text
      .replace('{customer_name}', 'คุณสมชาย')
      .replace('{pet_name}', 'น้องโมจิ')
      .replace('{appointment_time}', '14:00 น.')
      .replace('{service_name}', 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก')
      .replace('{branch_name}', 'สาขาทองหล่อ')
      .replace('{branch_phone}', '02-123-4567')
      .replace('{vaccine_name}', 'วัคซีนรวม 5 โรค + พิษสุนัขบ้า')
      .replace('{booking_url}', 'https://petflow.app/b/thonglor')
      .replace('{diagnosis}', 'ช่องหูอักเสบ');
  };

  return (
    <div className="w-full space-y-6 pb-24 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-3">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-slate-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> การตั้งค่าระบบ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">การแจ้งเตือน & LINE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-500" /> การแจ้งเตือน & ข้อความอัตโนมัติ (Notifications & LINE)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เชื่อมต่อ LINE Official Account และตั้งค่าเทมเพลตแจ้งเตือนนัดหมาย คิวตัดขน และเตือนวัคซีนอัตโนมัติ
          </p>
        </div>
      </div>

      {/* LINE OA Connection Status Card */}
      <div className="bg-gradient-to-br from-[#06C755]/10 via-emerald-50/40 to-transparent dark:from-[#06C755]/20 dark:via-slate-900 dark:to-slate-900 p-6 rounded-3xl border border-[#06C755]/30 shadow-apple">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#06C755] flex items-center justify-center text-white shadow-md shadow-[#06C755]/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  LINE Official Account Integration
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> เชื่อมต่อแล้ว (Active)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                เชื่อมต่อกับ LINE Developers Messaging API พร้อมส่ง Push Message & Webhook ตอบรับอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => showToast('🎉 ส่งข้อความทดสอบไปยัง LINE OA สำเร็จ')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition"
            >
              ทดสอบส่งข้อความ (Test Send)
            </button>
            <a
              href="https://developers.line.biz/console/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b54c] text-white shadow-sm transition flex items-center gap-1.5"
            >
              LINE Console <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-emerald-100 dark:border-slate-800/80 text-xs">
          <div className="p-3 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold mb-0.5">Channel ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{lineChannelId}</span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold mb-0.5">Webhook URL</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 break-all">https://api.petflow.app/api/v1/line/webhook</span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 block font-semibold mb-0.5">Messaging API Quota</span>
            <span className="font-bold text-emerald-600">ใช้งานแล้ว 245 / 500 ข้อความฟรี (เดือนนี้)</span>
          </div>
        </div>
      </div>

      {/* Notification Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#0071e3]" /> เทมเพลตข้อความอัตโนมัติ (Automated Message Templates)
            </h2>
            <p className="text-xs text-slate-500">
              ข้อความจะถูกส่งหาเจ้าของสัตว์เลี้ยงโดยอัตโนมัติตามเงื่อนไขและเวลาที่กำหนด
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-apple ${
                tpl.isActive
                  ? 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40'
                  : 'border-slate-200/40 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
                      LINE OA
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {tpl.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleTemplate(tpl.id)}
                    className={`w-8 h-4 rounded-full p-0.5 transition cursor-pointer ${
                      tpl.isActive ? 'bg-[#06C755]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={tpl.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        tpl.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/60 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>เงื่อนไข: {tpl.triggerTiming}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono line-clamp-3">
                    {tpl.messageText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tpl.variables.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-300 border border-blue-100"
                    >
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {tpl.isActive ? '✅ กำลังทำงานอัตโนมัติ' : '⏸️ หยุดการส่งชั่วคราว'}
                </span>

                <button
                  onClick={() => handlePreview(tpl)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0071e3] hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> ดูตัวอย่างข้อความ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Preview Modal */}
      {previewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#06C755] flex items-center justify-center text-white">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ตัวอย่างข้อความใน LINE
                  </h3>
                  <span className="text-[10px] text-slate-400">{selectedTemplate.name}</span>
                </div>
              </div>

              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Chat Bubble Mockup */}
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <div className="w-5 h-5 rounded-full bg-[#06C755] text-white flex items-center justify-center text-[10px] font-bold">
                  P
                </div>
                <span>PetFlow Clinic (LINE Official)</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200/60 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {renderSampleText(selectedTemplate.messageText)}
              </div>
              <span className="text-[10px] text-slate-400 block text-right">
                {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  setPreviewModalOpen(false);
                  showToast('🎉 ส่งข้อความตัวอย่างเข้า LINE สำเร็จ');
                }}
                className="bg-[#06C755] hover:bg-[#05b54c] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> ส่งทดสอบทันที
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

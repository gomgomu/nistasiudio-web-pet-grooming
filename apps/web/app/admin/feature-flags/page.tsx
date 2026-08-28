'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ToggleLeft,
  ToggleRight,
  Shield,
  Search,
  Plus,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Building2,
  X,
  Lock,
  Unlock,
  Sliders,
  Settings,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { FeatureFlagItem } from '@petflow/types';

// Mock Initial Feature Flags
const MOCK_ADMIN_FLAGS: FeatureFlagItem[] = [
  {
    id: 'f-1',
    key: 'CLINICAL_SOAP',
    name: 'Veterinary Clinical OPD & SOAP Records',
    description: 'ห้องตรวจรักษาผู้ป่วยนอก และการบันทึกเวชระเบียน SOAP สัตวแพทย์',
    category: 'CLINICAL',
    isGlobalEnabled: true,
    minPlanCode: 'STARTER',
    overrideCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-2',
    key: 'VACCINATION_REGISTRY',
    name: 'Digital Vaccination & Passport',
    description: 'ทะเบียนประวัติการฉีดวัคซีน และสมุดวัคซีนดิจิทัล',
    category: 'CLINICAL',
    isGlobalEnabled: true,
    minPlanCode: 'STARTER',
    overrideCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-3',
    key: 'LINE_MESSAGING',
    name: 'LINE Official Account Integration',
    description: 'ส่งแจ้งเตือนนัดหมาย, คิวกรูมมิ่ง, และใบเสร็จผ่าน LINE OA อัตโนมัติ',
    category: 'MARKETING',
    isGlobalEnabled: true,
    minPlanCode: 'PROFESSIONAL',
    overrideCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-4',
    key: 'ADVANCED_INVENTORY',
    name: 'Advanced Inventory & Batch Lot Tracking',
    description: 'คลังยาและสินค้าขั้นสูง ติดตาม Lot วันหมดอายุ และ FIFO Cost',
    category: 'OPERATIONS',
    isGlobalEnabled: true,
    minPlanCode: 'PROFESSIONAL',
    overrideCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-5',
    key: 'COMMISSION_ENGINE',
    name: 'Staff & Groomer Commission Calculation',
    description: 'ระบบคำนวณค่าคอมมิชชั่นช่างกรูมมิ่งและสัตวแพทย์อัตโนมัติ',
    category: 'FINANCE',
    isGlobalEnabled: true,
    minPlanCode: 'PROFESSIONAL',
    overrideCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-6',
    key: 'MULTI_BRANCH_HQ',
    name: 'Multi-Branch Central HQ & Stock Transfer',
    description: 'ศูนย์ควบคุมหลายสาขา และการโอนย้ายสต็อกสินค้าระหว่างสาขา',
    category: 'ENTERPRISE',
    isGlobalEnabled: true,
    minPlanCode: 'ENTERPRISE',
    overrideCount: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-7',
    key: 'API_ACCESS',
    name: 'Developer API & Webhooks Access',
    description: 'การเชื่อมต่อภายนอกผ่าน REST API และ Webhooks',
    category: 'DEVELOPER',
    isGlobalEnabled: true,
    minPlanCode: 'ENTERPRISE',
    overrideCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-8',
    key: 'TELE_MED_BETA',
    name: 'Tele-Veterinary Video Consultation (Beta)',
    description: 'ระบบปรึกษาสัตวแพทย์ทางไกลผ่านวิดีโอคอล (ฟีเจอร์ทดลอง)',
    category: 'BETA',
    isGlobalEnabled: false,
    minPlanCode: 'ENTERPRISE',
    overrideCount: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f-9',
    key: 'AI_ASSISTANT',
    name: 'AI Clinical Assistant & Voice Scribe',
    description: 'ผู้ช่วย AI สรุปประวัติการรักษาและถอดเสียง SOAP Note',
    category: 'BETA',
    isGlobalEnabled: true,
    minPlanCode: 'ENTERPRISE',
    overrideCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagItem[]>(MOCK_ADMIN_FLAGS);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Override Modal
  const [overrideModalFlag, setOverrideModalFlag] = useState<FeatureFlagItem | null>(null);
  const [targetTenant, setTargetTenant] = useState<string>('คลินิกทองหล่อ (t-1)');
  const [overrideEnabled, setOverrideEnabled] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('VIP Early Access Promo');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('BETA');
  const [newMinPlan, setNewMinPlan] = useState('PROFESSIONAL');
  const [newDesc, setNewDesc] = useState('');

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      if (filterCategory !== 'ALL' && f.category !== filterCategory) return false;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        f.key.toLowerCase().includes(s) ||
        f.name.toLowerCase().includes(s) ||
        (f.description && f.description.toLowerCase().includes(s))
      );
    });
  }, [flags, filterCategory, searchTerm]);

  const toggleGlobal = (id: string) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, isGlobalEnabled: !f.isGlobalEnabled } : f
      )
    );
  };

  const handleSaveOverride = () => {
    if (!overrideModalFlag) return;
    setFlags((prev) =>
      prev.map((f) =>
        f.id === overrideModalFlag.id
          ? { ...f, overrideCount: (f.overrideCount || 0) + 1 }
          : f
      )
    );
    setOverrideModalFlag(null);
  };

  const handleCreateFlag = () => {
    if (!newKey || !newName) return;
    const newFlag: FeatureFlagItem = {
      id: `f-${Date.now()}`,
      key: newKey.toUpperCase().trim(),
      name: newName,
      description: newDesc,
      category: newCategory,
      isGlobalEnabled: true,
      minPlanCode: newMinPlan,
      overrideCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFlags((prev) => [...prev, newFlag]);
    setIsCreateModalOpen(false);
    setNewKey('');
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/settings" className="hover:text-slate-900">
              การตั้งค่า (Settings)
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-purple-600 font-bold">SaaS Admin Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" /> จัดการ Feature Flags & สิทธิ์การใช้งาน (Feature Entitlements)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ควบคุมการเปิด/ปิดฟีเจอร์ระดับ Global, จัดสรรตามแพ็กเกจสมาชิก, และกำหนด Override ราย Tenant
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> สร้าง Feature Flag ใหม่
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-xs font-bold text-slate-500 uppercase">ฟีเจอร์ทั้งหมด</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {flags.length} <span className="text-xs font-normal text-slate-500">Flags</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-xs font-bold text-emerald-600 uppercase">เปิดใช้งานปกติ (Active)</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {flags.filter((f) => f.isGlobalEnabled).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-xs font-bold text-rose-600 uppercase">Global Kill-switch (Off)</span>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">
            {flags.filter((f) => !f.isGlobalEnabled).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-xs font-bold text-purple-600 uppercase">Tenant Overrides</span>
          <div className="text-3xl font-extrabold text-purple-600 mt-1">
            {flags.reduce((acc, f) => acc + (f.overrideCount || 0), 0)}{' '}
            <span className="text-xs font-normal text-slate-500">ข้อยกเว้น</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {['ALL', 'CLINICAL', 'MARKETING', 'OPERATIONS', 'FINANCE', 'ENTERPRISE', 'BETA'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat === 'ALL' ? 'ทั้งหมด' : cat}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ Flag, Key, หรือรายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Feature Flags Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">สวิตช์ Global</th>
                <th className="py-3 px-4">ชื่อฟีเจอร์ & Key</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">แพ็กเกจขั้นต่ำ (Min Plan)</th>
                <th className="py-3 px-4">Tenant Overrides</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((flag) => (
                <tr key={flag.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleGlobal(flag.id)}
                      className="cursor-pointer transition active:scale-95"
                    >
                      {flag.isGlobalEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ON (Global)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full text-[11px] border border-rose-200/60">
                          <AlertTriangle className="w-3.5 h-3.5" /> OFF (Kill-switch)
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {flag.name}
                    </span>
                    <span className="font-mono text-[10px] text-purple-600 font-bold">
                      {flag.key}
                    </span>
                    {flag.description && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {flag.description}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {flag.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        flag.minPlanCode === 'STARTER'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : flag.minPlanCode === 'PROFESSIONAL'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}
                    >
                      {flag.minPlanCode || 'STARTER'}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    {flag.overrideCount && flag.overrideCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md text-[11px] font-bold">
                        <UserCheck className="w-3 h-3" /> {flag.overrideCount} องค์กร
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">- ไม่มี Override -</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setOverrideModalFlag(flag)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-[11px] transition"
                    >
                      <Building2 className="w-3.5 h-3.5" /> ตั้งค่า Tenant Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Override Modal */}
      {overrideModalFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  ตั้งค่า Tenant Override
                </h3>
              </div>
              <button onClick={() => setOverrideModalFlag(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200/60 dark:border-purple-800/60">
                <span className="text-[10px] font-bold uppercase text-purple-600 block">
                  Feature Flag
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {overrideModalFlag.name} ({overrideModalFlag.key})
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  เลือกองค์กร (Tenant):
                </label>
                <input
                  type="text"
                  value={targetTenant}
                  onChange={(e) => setTargetTenant(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  สถานะการเปิดให้ใช้งาน (Override Status):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideEnabled(true)}
                    className={`p-2.5 rounded-xl font-bold border transition ${
                      overrideEnabled
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    ✓ บังคับเปิดใช้งาน (Enabled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideEnabled(false)}
                    className={`p-2.5 rounded-xl font-bold border transition ${
                      !overrideEnabled
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    ✕ บังคับปิด (Disabled)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  เหตุผลในการให้สิทธิ์ (Reason):
                </label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="เช่น ลูกค้าทดลองใช้ VIP 30 วัน"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setOverrideModalFlag(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition active:scale-95"
              >
                บันทึกข้อยกเว้น (Save Override)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Flag Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  สร้าง Feature Flag ใหม่
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Feature Key (UPPERCASE_SNAKE_CASE):
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  placeholder="เช่น AI_VOICE_SCRIBE"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ชื่อฟีเจอร์ (Display Name):
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น AI Voice Transcription"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    หมวดหมู่ (Category):
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="CORE">CORE</option>
                    <option value="CLINICAL">CLINICAL</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="BETA">BETA</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Plan Code:
                  </label>
                  <select
                    value={newMinPlan}
                    onChange={(e) => setNewMinPlan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  คำอธิบาย:
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="รายละเอียดและความสามารถของฟีเจอร์..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateFlag}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition active:scale-95"
              >
                สร้าง Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

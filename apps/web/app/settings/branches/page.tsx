'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronRight,
  Edit3,
  Trash2,
  Sparkles,
  X,
  ArrowRight,
  Save,
} from 'lucide-react';
import { Badge, Button } from '@petflow/ui';
import { useAuth } from '../../../contexts/auth-context';

export interface StoreBranch {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
  address: string;
  phone: string;
  openingHours: string;
  staffCount: number;
  isActive: boolean;
}

const INITIAL_BRANCHES: StoreBranch[] = [
  {
    id: 'b-main',
    name: 'สาขาทองหล่อ (Main Headquarter)',
    code: 'MAIN',
    isMain: true,
    address: '88/1 ซอยทองหล่อ 13 ถนนสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กทม. 10110',
    phone: '02-712-8899',
    openingHours: '09:00 - 20:00 น. (ทุกวัน)',
    staffCount: 3,
    isActive: true,
  },
];

const BRANCHES_STORAGE_KEY = 'petflow_branches_data';

export default function BranchManagementPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<StoreBranch[]>(INITIAL_BRANCHES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchHours, setBranchHours] = useState('09:00 - 20:00 น.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Success Modal State
  const [createdSuccessBranch, setCreatedSuccessBranch] = useState<StoreBranch | null>(null);

  // Edit Modal State
  const [editingBranch, setEditingBranch] = useState<StoreBranch | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Load from DB and fallback to LocalStorage on mount
  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
          localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(data.branches));
        } else {
          const saved = localStorage.getItem(BRANCHES_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setBranches(parsed);
          }
        }
      })
      .catch(() => {
        const saved = localStorage.getItem(BRANCHES_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setBranches(parsed);
          } catch {}
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Helper to update state and localStorage simultaneously
  const updateBranches = (newBranches: StoreBranch[]) => {
    setBranches(newBranches);
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(newBranches));
    } catch {
      // storage quota or disabled
    }
  };

  // Quota calculation (Default Pro Plan = 3 Branches)
  const maxQuota = 3;
  const currentCount = branches.length;
  const isQuotaFull = currentCount >= maxQuota;

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || isQuotaFull) return;

    const newBranchItem: StoreBranch = {
      id: `b-${Date.now()}`,
      name: branchName,
      code: branchCode.toUpperCase().trim() || `BR-${currentCount + 1}`,
      isMain: false,
      address: branchAddress || 'กรุงเทพมหานคร',
      phone: branchPhone || '02-000-0000',
      openingHours: branchHours || '09:00 - 20:00 น.',
      staffCount: 0,
      isActive: true,
    };

    const updated = [...branches, newBranchItem];
    updateBranches(updated);
    setIsAddModalOpen(false);
    setCreatedSuccessBranch(newBranchItem);
    setToastMessage(`🎉 เพิ่มสาขา "${branchName}" สำเร็จเรียบร้อย!`);

    // Sync to PostgreSQL DB
    fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: branchName,
        code: branchCode,
        address: branchAddress,
        phone: branchPhone,
      }),
    }).catch(console.error);

    // Reset Form
    setBranchName('');
    setBranchCode('');
    setBranchAddress('');
    setBranchPhone('');
  };

  const handleOpenEdit = (b: StoreBranch) => {
    setEditingBranch(b);
    setEditName(b.name);
    setEditCode(b.code);
    setEditAddress(b.address);
    setEditPhone(b.phone);
    setEditHours(b.openingHours);
    setEditIsActive(b.isActive);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const updated = branches.map((b) => {
      if (b.id === editingBranch.id) {
        return {
          ...b,
          name: editName,
          code: editCode.toUpperCase().trim() || b.code,
          address: editAddress,
          phone: editPhone,
          openingHours: editHours,
          isActive: editIsActive,
        };
      }
      return b;
    });

    updateBranches(updated);
    setEditingBranch(null);
    setToastMessage(`💾 บันทึกการแก้ไขสาขา "${editName}" เข้า Database เรียบร้อย!`);

    // Sync to PostgreSQL DB
    fetch('/api/branches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingBranch.id,
        name: editName,
        code: editCode,
        address: editAddress,
        phone: editPhone,
        isActive: editIsActive,
      }),
    }).catch(console.error);
  };

  const toggleBranchStatus = (branchId: string) => {
    let newStatus = true;
    const updated = branches.map((b) => {
      if (b.id === branchId) {
        newStatus = !b.isActive;
        setToastMessage(
          newStatus
            ? `🟢 เปิดให้บริการสาขา ${b.name} แล้ว`
            : `🔴 ปิดให้บริการชั่วคราวสาขา ${b.name} แล้ว`
        );
        return { ...b, isActive: newStatus };
      }
      return b;
    });
    updateBranches(updated);

    // Sync to PostgreSQL DB
    fetch('/api/branches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: branchId,
        isActive: newStatus,
      }),
    }).catch(console.error);
  };

  return (
    <div className="w-full space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Toast Notification */}
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

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/settings" className="hover:text-slate-900 dark:hover:text-white">
              การตั้งค่า (Settings)
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0071e3] font-bold">จัดการสาขา (Branches)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0071e3]" /> จัดการสาขาของร้าน (Branches & Locations)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เปิดสาขาใหม่, แก้ไขข้อมูลที่อยู่, เวลาทำการ, และควบคุมสถานะเปิด/ปิดให้บริการ
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => setIsAddModalOpen(true)}
          disabled={isQuotaFull}
          className={`gap-1.5 shadow-md px-4 py-2 text-xs font-bold text-white transition ${
            isQuotaFull
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-[#0071e3] hover:bg-[#0077ed] shadow-blue-500/25 cursor-pointer'
          }`}
        >
          <Plus className="w-4 h-4" />
          + เพิ่มสาขาใหม่ (+ Add Branch)
        </Button>
      </div>

      {/* Quota Banner Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-blue-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/30 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                โควต้าสาขาตามแพ็กเกจ (Professional Plan)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/15 text-[#0071e3]">
                ใช้งานแล้ว {currentCount} จาก {maxQuota} สาขา
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แพ็กเกจ Pro ของคุณรองรับได้สูงสุด 3 สาขาฟรี (ไม่ต้องจ่ายเพิ่ม)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-32 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0071e3] h-full rounded-full transition-all duration-500"
              style={{ width: `${(currentCount / maxQuota) * 100}%` }}
            />
          </div>
          {isQuotaFull ? (
            <Link
              href="/settings/subscription"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline ml-2"
            >
              <span>อัปเกรด Enterprise</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="text-xs font-bold text-emerald-600 ml-2">
              เปิดได้อีก {maxQuota - currentCount} สาขา
            </span>
          )}
        </div>
      </div>

      {/* Branches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              b.isActive
                ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-apple hover:shadow-apple-md hover:border-blue-300'
                : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/50 opacity-70'
            }`}
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                      b.isMain
                        ? 'bg-blue-50 text-[#0071e3] dark:bg-blue-950/80 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {b.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      CODE: {b.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {b.isMain && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-[#0071e3] border border-blue-500/20 shrink-0">
                      👑 สาขาหลัก
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    {b.isActive ? 'เปิดปกติ' : 'ปิดชั่วคราว'}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{b.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.openingHours}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                👥 {b.staffCount} พนักงานประจำ
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(b)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-[#0071e3] text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-[#0071e3]" />
                  <span>แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleBranchStatus(b.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    b.isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                  }`}
                >
                  {b.isActive ? 'ปิดชั่วคราว' : 'เปิดให้บริการ'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    เพิ่มสาขาใหม่ (Add New Branch)
                  </h3>
                  <p className="text-xs text-slate-400">
                    โควต้าคงเหลือ {maxQuota - currentCount} สาขาในแพ็กเกจปัจจุบัน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อสาขา (เช่น สาขาอารีย์) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สาขาอารีย์ (Ari Branch)"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    รหัสย่อสาขา (Branch Code)
                  </label>
                  <input
                    type="text"
                    placeholder="ARI / BR-2"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ที่อยู่สาขา
                </label>
                <textarea
                  rows={2}
                  placeholder="เลขที่, ซอย, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    เบอร์โทรศัพท์สาขา
                  </label>
                  <input
                    type="text"
                    placeholder="02-XXX-XXXX หรือ 08X-XXX-XXXX"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    เวลาเปิด-ปิด
                  </label>
                  <input
                    type="text"
                    value={branchHours}
                    onChange={(e) => setBranchHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  🏢 บันทึกและเปิดสาขา
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    แก้ไขข้อมูลสาขา (Edit Branch)
                  </h3>
                  <p className="text-xs text-slate-400">
                    แก้ไขชื่อ ที่อยู่ เบอร์ติดต่อ และเวลาเปิด-ปิดทำการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อสาขา *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    รหัสย่อสาขา
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ที่อยู่สาขา
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    เบอร์โทรศัพท์สาขา
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    เวลาเปิด-ปิด
                  </label>
                  <input
                    type="text"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  สถานะสาขา
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="branchActive"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="text-emerald-600"
                    />
                    <span className="text-emerald-600 font-bold">🟢 เปิดให้บริการปกติ</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="branchActive"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="text-rose-600"
                    />
                    <span className="text-rose-600 font-bold">🔴 ปิดให้บริการชั่วคราว</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md shadow-blue-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Branch Created Success Modal */}
      {createdSuccessBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 my-8 text-center animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0071e3] dark:bg-blue-950/70 dark:text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 ring-8 ring-blue-50/50 dark:ring-blue-900/20">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/15 text-[#0071e3] dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> เปิดสาขาใหม่สำเร็จ
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {createdSuccessBranch.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                สาขาใหม่พร้อมให้บริการแล้ว สามารถมอบหมายพนักงานและเปิดรับนัดหมายได้ทันที
              </p>
            </div>

            {/* Branch Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">รหัสย่อสาขา:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {createdSuccessBranch.code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">เบอร์โทรศัพท์:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {createdSuccessBranch.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">เวลาทำการ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {createdSuccessBranch.openingHours}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-start justify-between gap-2">
                <span className="text-slate-500 font-semibold shrink-0">ที่อยู่:</span>
                <span className="text-right text-slate-700 dark:text-slate-300">
                  {createdSuccessBranch.address}
                </span>
              </div>
            </div>

            {/* Actions */}
            <Button
              onClick={() => setCreatedSuccessBranch(null)}
              className="w-full py-2.5 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md shadow-blue-500/25 cursor-pointer"
            >
              ตกลง / เริ่มจัดการสาขา
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Building2,
  Shield,
  Scissors,
  Stethoscope,
  Crown,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  X,
  Edit3,
  Save,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { Badge, Button } from '@petflow/ui';
import { useAuth, UserRole } from '../../../contexts/auth-context';

export interface StoreStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTitle: string;
  branchName: string;
  avatarText: string;
  avatarGradient: string;
  isActive: boolean;
  joinedAt: string;
}

const INITIAL_STAFF: StoreStaffMember[] = [
  {
    id: 's-1',
    name: 'สมชาย รักสัตว์',
    email: 'owner@demopetcare.com',
    phone: '081-234-5678',
    role: 'TENANT_OWNER',
    roleTitle: 'เจ้าของร้าน (Owner)',
    branchName: 'ทุกสาขา (All Branches)',
    avatarText: 'สม',
    avatarGradient: 'from-blue-600 to-indigo-700',
    isActive: true,
    joinedAt: '1 ม.ค. 2026',
  },
  {
    id: 's-2',
    name: 'น.สพ. วรวิทย์ ใจดี (หมอวิทย์)',
    email: 'vet@demopetcare.com',
    phone: '089-876-5432',
    role: 'VETERINARIAN',
    roleTitle: 'สัตวแพทย์ (Doctor OPD)',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'หมอ',
    avatarGradient: 'from-purple-600 to-pink-700',
    isActive: true,
    joinedAt: '15 ม.ค. 2026',
  },
  {
    id: 's-3',
    name: 'ช่างเอก กรูมเมอร์มือทอง',
    email: 'groomer@demopetcare.com',
    phone: '086-555-4321',
    role: 'GROOMER',
    roleTitle: 'ช่างกรูมมิ่ง (Groomer)',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'เอก',
    avatarGradient: 'from-teal-600 to-emerald-700',
    isActive: true,
    joinedAt: '1 ก.พ. 2026',
  },
  {
    id: 's-4',
    name: 'น้องฝน ต้อนรับ & แคชเชียร์',
    email: 'cashier@demopetcare.com',
    phone: '083-444-9988',
    role: 'RECEPTIONIST',
    roleTitle: 'พนักงานต้อนรับ & แคชเชียร์',
    branchName: 'สาขาทองหล่อ (Main)',
    avatarText: 'ฝน',
    avatarGradient: 'from-amber-600 to-orange-700',
    isActive: true,
    joinedAt: '10 ก.พ. 2026',
  },
];

const STAFF_STORAGE_KEY = 'petflow_staff_data';

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StoreStaffMember[]>(INITIAL_STAFF);
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('GROOMER');
  const [staffBranch, setStaffBranch] = useState('สาขาทองหล่อ (Main)');
  const [tempPassword, setTempPassword] = useState('password123');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Success Modal State
  const [createdSuccessStaff, setCreatedSuccessStaff] = useState<{
    name: string;
    email: string;
    phone: string;
    roleTitle: string;
    branchName: string;
    tempPassword: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<StoreStaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('GROOMER');
  const [editBranch, setEditBranch] = useState('สาขาทองหล่อ (Main)');
  const [editIsActive, setEditIsActive] = useState(true);

  // Load from DB and fallback to LocalStorage on mount
  useEffect(() => {
    fetch('/api/staff')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.staff) && data.staff.length > 0) {
          setStaffList(data.staff);
          localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(data.staff));
        } else {
          const saved = localStorage.getItem(STAFF_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
          }
        }
      })
      .catch(() => {
        const saved = localStorage.getItem(STAFF_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
          } catch {}
        }
      });
  }, []);

  // Update state and storage simultaneously
  const updateStaffList = (newList: StoreStaffMember[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // storage quota
    }
  };

  const roleTitles: Record<UserRole, string> = {
    TENANT_OWNER: 'เจ้าของร้าน (Owner)',
    VETERINARIAN: 'สัตวแพทย์ (Doctor OPD)',
    GROOMER: 'ช่างกรูมมิ่ง (Groomer)',
    RECEPTIONIST: 'พนักงานต้อนรับ & แคชเชียร์',
    SAAS_ADMIN: 'Super Admin HQ',
  };

  const gradients: Record<string, string> = {
    VETERINARIAN: 'from-purple-600 to-pink-700',
    GROOMER: 'from-teal-600 to-emerald-700',
    RECEPTIONIST: 'from-amber-600 to-orange-700',
    TENANT_OWNER: 'from-blue-600 to-indigo-700',
    SAAS_ADMIN: 'from-violet-600 to-purple-800',
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !staffEmail) return;

    const newStaff: StoreStaffMember = {
      id: `s-${Date.now()}`,
      name: fullName,
      email: staffEmail.trim().toLowerCase(),
      phone: staffPhone || '08X-XXX-XXXX',
      role: staffRole,
      roleTitle: roleTitles[staffRole] || 'พนักงาน',
      branchName: staffBranch,
      avatarText: fullName.charAt(0).toUpperCase(),
      avatarGradient: gradients[staffRole] || 'from-blue-500 to-indigo-600',
      isActive: true,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...staffList, newStaff];
    updateStaffList(updated);
    setIsAddModalOpen(false);
    setToastMessage(`🎉 เพิ่มพนักงาน "${fullName}" สำเร็จเรียบร้อย!`);

    // Show Success Modal
    setCreatedSuccessStaff({
      name: fullName,
      email: staffEmail,
      phone: staffPhone || '08X-XXX-XXXX',
      roleTitle: newStaff.roleTitle,
      branchName: staffBranch,
      tempPassword: tempPassword || 'password123',
    });
    setIsCopied(false);

    // Sync to PostgreSQL DB
    fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullName,
        email: staffEmail,
        phone: staffPhone,
        role: staffRole,
      }),
    }).catch(console.error);

    // Reset Form
    setFullName('');
    setStaffEmail('');
    setStaffPhone('');
  };

  const handleOpenEdit = (s: StoreStaffMember) => {
    setEditingStaff(s);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditPhone(s.phone);
    setEditRole(s.role);
    setEditBranch(s.branchName);
    setEditIsActive(s.isActive);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const updated = staffList.map((s) => {
      if (s.id === editingStaff.id) {
        return {
          ...s,
          name: editName,
          email: editEmail.trim().toLowerCase(),
          phone: editPhone,
          role: editRole,
          roleTitle: roleTitles[editRole] || s.roleTitle,
          branchName: editBranch,
          avatarText: editName.charAt(0).toUpperCase(),
          avatarGradient: gradients[editRole] || s.avatarGradient,
          isActive: editIsActive,
        };
      }
      return s;
    });

    updateStaffList(updated);
    setEditingStaff(null);
    setToastMessage(`💾 อัปเดตข้อมูลพนักงาน "${editName}" เข้า Database สำเร็จ!`);

    // Sync to PostgreSQL DB
    fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingStaff.id,
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        isActive: editIsActive,
      }),
    }).catch(console.error);
  };

  const toggleStaffStatus = (id: string) => {
    let newStatus = true;
    const updated = staffList.map((s) => {
      if (s.id === id) {
        newStatus = !s.isActive;
        setToastMessage(
          newStatus
            ? `🟢 ปลดล็อกการเข้าสู่ระบบของ ${s.name} แล้ว`
            : `🔴 ระงับสิทธิ์การเข้าสู่ระบบของ ${s.name} ชั่วคราวแล้ว`
        );
        return { ...s, isActive: newStatus };
      }
      return s;
    });
    updateStaffList(updated);

    // Sync to PostgreSQL DB
    fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        isActive: newStatus,
      }),
    }).catch(console.error);
  };

  const filteredStaff = staffList.filter((s) => {
    if (filterRole !== 'ALL' && s.role !== filterRole) return false;
    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'TENANT_OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0071e3] border border-blue-200/60">
            <Crown className="w-3 h-3" />
            เจ้าของร้าน (Owner)
          </span>
        );
      case 'VETERINARIAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            <Stethoscope className="w-3 h-3" />
            สัตวแพทย์ (Doctor OPD)
          </span>
        );
      case 'GROOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
            <Scissors className="w-3 h-3" />
            ช่างกรูมมิ่ง (Groomer)
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <UserCheck className="w-3 h-3" />
            พนักงานต้อนรับ / แคชเชียร์
          </span>
        );
      default:
        return null;
    }
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
            <span className="text-[#0071e3] font-bold">ทีมงาน & ผู้ใช้งาน (Staff)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0071e3]" /> จัดการทีมงาน & ผู้ใช้งาน (Staff & User Permissions)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่มบัญชีพนักงาน, แก้ไขสิทธิ์, มอบหมายสาขาประจำ, และควบคุมการเข้าสู่ระบบ
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 shadow-md shadow-blue-500/25 px-4 py-2 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + เพิ่มพนักงานใหม่ (+ Add Staff)
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-[11px] font-bold text-slate-500">พนักงานทั้งหมด</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {staffList.length} <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-[11px] font-bold text-purple-600">สัตวแพทย์ (Vet)</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            {staffList.filter((s) => s.role === 'VETERINARIAN').length} <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-[11px] font-bold text-teal-600">ช่างกรูมมิ่ง (Groomer)</span>
          <div className="text-xl font-black text-teal-600 mt-1">
            {staffList.filter((s) => s.role === 'GROOMER').length} <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <span className="text-[11px] font-bold text-emerald-600">สถานะเปิดใช้งาน</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {staffList.filter((s) => s.isActive).length} <span className="text-xs font-normal text-slate-400">บัญชี</span>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
        {/* Table Filter Tabs */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterRole('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ทั้งหมด ({staffList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('VETERINARIAN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === 'VETERINARIAN'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              สัตวแพทย์
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('GROOMER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === 'GROOMER'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ช่างกรูมมิ่ง
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('RECEPTIONIST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === 'RECEPTIONIST'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ต้อนรับ / แคชเชียร์
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">ชื่อพนักงาน / ผู้ใช้งาน</th>
                <th className="py-3 px-4">บทบาท & สิทธิ์</th>
                <th className="py-3 px-4">สาขาที่สังกัด</th>
                <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${s.avatarGradient} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                      >
                        {s.avatarText}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {s.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getRoleBadge(s.role)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.branchName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                    {s.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        ระงับสิทธิ์
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-[#0071e3] text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                        title="แก้ไขข้อมูลพนักงาน"
                      >
                        <Edit3 className="w-3 h-3 text-[#0071e3]" />
                        <span>แก้ไข</span>
                      </button>

                      {s.role !== 'TENANT_OWNER' && (
                        <button
                          type="button"
                          onClick={() => toggleStaffStatus(s.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                            s.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                          }`}
                        >
                          {s.isActive ? 'ระงับสิทธิ์' : 'เปิดใช้งาน'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    เพิ่มพนักงาน / ผู้ใช้ใหม่ (Add Staff)
                  </h3>
                  <p className="text-xs text-slate-400">
                    สร้างบัญชีสำหรับช่างกรูมมิ่ง, สัตวแพทย์, หรือพนักงานแคชเชียร์
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

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อ - นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมศักดิ์ กรูมเมอร์"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  บทบาทหน้าที่ & สิทธิ์ในระบบ *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffRole('GROOMER')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      staffRole === 'GROOMER'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                    <span className="text-[11px] block">ช่างกรูมมิ่ง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffRole('VETERINARIAN')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      staffRole === 'VETERINARIAN'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="text-[11px] block">สัตวแพทย์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffRole('RECEPTIONIST')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      staffRole === 'RECEPTIONIST'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="text-[11px] block">ต้อนรับ/แคชเชียร์</span>
                  </button>
                </div>
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  สาขาที่ประจำการ (Assigned Branch)
                </label>
                <select
                  value={staffBranch}
                  onChange={(e) => setStaffBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                >
                  <option value="สาขาทองหล่อ (Main)">🏢 สาขาทองหล่อ (Main Headquarter)</option>
                  <option value="สาขาอารีย์ (Branch 2)">📍 สาขาอารีย์ (Ari Express)</option>
                  <option value="สาขาเอกมัย (Branch 3)">📍 สาขาเอกมัย (Ekkamai Grooming)</option>
                </select>
              </div>

              {/* Email & Initial Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    อีเมลสำหรับเข้าสู่ระบบ *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@demopetcare.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    รหัสผ่านเริ่มต้น *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  👥 บันทึกและสร้างผู้ใช้
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    แก้ไขข้อมูลพนักงาน (Edit Staff)
                  </h3>
                  <p className="text-xs text-slate-400">
                    แก้ไขชื่อ เบอร์ติดต่อ บทบาทหน้าที่ และสาขาประจำการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อ - นามสกุล *
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
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  อีเมลเข้าใช้งาน (Email Login)
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  บทบาทหน้าที่ & สิทธิ์ในระบบ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('GROOMER')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editRole === 'GROOMER'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                    <span className="text-[11px] block">ช่างกรูมมิ่ง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('VETERINARIAN')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editRole === 'VETERINARIAN'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="text-[11px] block">สัตวแพทย์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('RECEPTIONIST')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editRole === 'RECEPTIONIST'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="text-[11px] block">ต้อนรับ/แคชเชียร์</span>
                  </button>
                </div>
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  สาขาที่ประจำการ (Assigned Branch)
                </label>
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                >
                  <option value="สาขาทองหล่อ (Main)">🏢 สาขาทองหล่อ (Main Headquarter)</option>
                  <option value="สาขาอารีย์ (Branch 2)">📍 สาขาอารีย์ (Ari Express)</option>
                  <option value="สาขาเอกมัย (Branch 3)">📍 สาขาเอกมัย (Ekkamai Grooming)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  สถานะการเข้าสู่ระบบ
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="text-emerald-600"
                    />
                    <span className="text-emerald-600 font-bold">🟢 เปิดใช้งานปกติ</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="text-rose-600"
                    />
                    <span className="text-rose-600 font-bold">🔴 ระงับการเข้าสู่ระบบ</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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

      {/* 3. Staff Created Success Modal */}
      {createdSuccessStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 my-8 text-center animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50/50 dark:ring-emerald-900/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> เพิ่มผู้ใช้งานใหม่สำเร็จ
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {createdSuccessStaff.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                บัญชีผู้ใช้งานเปิดระบบพร้อมทำงานและล็อกอินเข้าสู่ระบบได้ทันที
              </p>
            </div>

            {/* Staff Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">ตำแหน่ง / บทบาท:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">
                  {createdSuccessStaff.roleTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">สาขาประจำการ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {createdSuccessStaff.branchName}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">อีเมลเข้าสู่ระบบ:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  {createdSuccessStaff.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">รหัสผ่านเริ่มต้น:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {createdSuccessStaff.tempPassword}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={() => {
                  const shareText = `🐾 ข้อมูลการเข้าใช้งานระบบ PetFlow\nชื่อ: ${createdSuccessStaff.name}\nตำแหน่ง: ${createdSuccessStaff.roleTitle}\nอีเมลเข้าใช้งาน: ${createdSuccessStaff.email}\nรหัสผ่านเริ่มต้น: ${createdSuccessStaff.tempPassword}\nเข้าใช้งานที่: https://app.petflow.th/login`;
                  navigator.clipboard.writeText(shareText);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                className="w-full py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>คัดลอกข้อมูลเรียบร้อยแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>📋 คัดลอกข้อมูลบัญชีส่งให้พนักงาน</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setCreatedSuccessStaff(null)}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                ตกลง / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

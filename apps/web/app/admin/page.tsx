'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Zap,
  Sliders,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  Plus,
  X,
  Phone,
  Mail,
  Check,
  Scissors,
  Stethoscope,
  Crown,
  Activity,
  Layers,
  KeyRound,
  Edit3,
  Settings,
  Save,
  Copy,
} from 'lucide-react';
import { Badge, Button } from '@petflow/ui';
import { SaaSTenantListItem, SystemAuditLogItem } from '@petflow/types';
import { useAuth } from '../../contexts/auth-context';

// Baseline Real Database Tenants
const INITIAL_TENANTS: SaaSTenantListItem[] = [
  {
    id: 't-demo-01',
    name: 'Demo Pet Care Clinic & Grooming',
    slug: 'demo-pet-clinic',
    businessType: 'HYBRID_CLINIC_GROOMING',
    phone: '02-123-4567',
    email: 'owner@demopetcare.com',
    isActive: true,
    planCode: 'PROFESSIONAL',
    planName: 'Professional Plan',
    subscriptionStatus: 'ACTIVE',
    billingCycle: 'MONTHLY',
    priceMinor: 299000,
    branchCount: 1,
    userCount: 3,
    customerCount: 0,
    petCount: 0,
    monthlyAppointmentCount: 0,
    createdAt: '2026-08-28T00:00:00Z',
  },
];

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetTenantName: string;
  details: string;
  status: 'SUCCESS' | 'FAILED';
}

// Baseline System Audit Logs
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-28 13:25:00',
    actorName: 'PetFlow Super Admin (DEV)',
    actorEmail: 'admin@petflow.co',
    action: 'SYSTEM_MAINTENANCE_CLEAN',
    targetTenantName: 'Demo Pet Care Clinic & Grooming',
    details: 'ล้างข้อมูลทรานแซกชันจำลอง (Wipe Transaction Data) สำเร็จ',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-28 11:30:00',
    actorName: 'PetFlow Super Admin (DEV)',
    actorEmail: 'admin@petflow.co',
    action: 'TENANT_INITIALIZE',
    targetTenantName: 'Demo Pet Care Clinic & Grooming',
    details: 'สร้าง Tenant เริ่มต้นและบัญชีเจ้าของร้าน (Owner Account)',
    status: 'SUCCESS',
  },
];

export default function SaaSAdminPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<SaaSTenantListItem[]>(INITIAL_TENANTS);
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'AUDIT'>('TENANTS');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<SaaSTenantListItem | null>(null);

  // New Tenant Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newBusinessType, setNewBusinessType] = useState<'GROOMING_SALON' | 'VETERINARY_CLINIC' | 'HYBRID_CLINIC_GROOMING'>('GROOMING_SALON');
  const [newPlan, setNewPlan] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('STARTER');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Success Confirmation Modal State
  const [createdSuccessTenant, setCreatedSuccessTenant] = useState<{
    name: string;
    slug: string;
    businessType: string;
    planName: string;
    priceFormatted: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    tempPassword: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Edit Tenant Modal State
  const [editingTenant, setEditingTenant] = useState<SaaSTenantListItem | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editBusinessType, setEditBusinessType] = useState<'GROOMING_SALON' | 'VETERINARY_CLINIC' | 'HYBRID_CLINIC_GROOMING'>('GROOMING_SALON');
  const [editPlan, setEditPlan] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('STARTER');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBranchCount, setEditBranchCount] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Load tenants from PostgreSQL on mount
  useEffect(() => {
    fetch('/api/tenants')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.tenants) && data.tenants.length > 0) {
          setTenants(data.tenants);
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenEdit = (t: SaaSTenantListItem) => {
    setEditingTenant(t);
    setEditStoreName(t.name);
    setEditSlug(t.slug);
    setEditBusinessType(t.businessType as any);
    setEditPlan(t.planCode as any);
    setEditPhone(t.phone || '');
    setEditEmail(t.email || '');
    setEditBranchCount(t.branchCount || 1);
    setEditIsActive(t.isActive);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const planPrices: Record<string, number> = {
      STARTER: 129000,
      PROFESSIONAL: 299000,
      ENTERPRISE: 599000,
    };

    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === editingTenant.id) {
          return {
            ...t,
            name: editStoreName,
            slug: editSlug,
            businessType: editBusinessType,
            planCode: editPlan,
            planName: `${editPlan.charAt(0) + editPlan.slice(1).toLowerCase()} Plan`,
            priceMinor: planPrices[editPlan] || t.priceMinor,
            phone: editPhone,
            email: editEmail,
            branchCount: editBranchCount,
            isActive: editIsActive,
            subscriptionStatus: editIsActive ? 'ACTIVE' : 'SUSPENDED',
          };
        }
        return t;
      })
    );

    // Sync to PostgreSQL DB
    fetch('/api/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingTenant.id,
        name: editStoreName,
        slug: editSlug,
        businessType: editBusinessType,
        phone: editPhone,
        email: editEmail,
        isActive: editIsActive,
      }),
    }).catch(console.error);

    setEditingTenant(null);
    setToastMessage(`💾 อัปเดตข้อมูลร้าน "${editStoreName}" เข้า Database สำเร็จเรียบร้อย!`);
  };

  // Auto generate slug from store name
  const handleStoreNameChange = (val: string) => {
    setNewStoreName(val);
    if (!newSlug || newSlug === newStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setNewSlug(generated || 'new-shop');
    }
  };

  // Submit New Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newOwnerEmail) return;

    const planPrices: Record<string, number> = {
      STARTER: 129000,
      PROFESSIONAL: 299000,
      ENTERPRISE: 599000,
    };

    const newTenantItem: SaaSTenantListItem = {
      id: `t-${Date.now()}`,
      name: newStoreName,
      slug: newSlug || `shop-${Date.now()}`,
      businessType: newBusinessType,
      phone: newOwnerPhone || '02-000-0000',
      email: newOwnerEmail,
      isActive: true,
      planCode: newPlan,
      planName: `${newPlan.charAt(0) + newPlan.slice(1).toLowerCase()} Plan`,
      subscriptionStatus: 'ACTIVE',
      billingCycle: 'MONTHLY',
      priceMinor: planPrices[newPlan] || 129000,
      branchCount: 1,
      userCount: 1,
      customerCount: 0,
      petCount: 0,
      monthlyAppointmentCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTenants((prev) => [newTenantItem, ...prev]);
    setIsAddModalOpen(false);
    setToastMessage(`🎉 สร้างร้าน "${newStoreName}" สำเร็จเรียบร้อย!`);

    // Show Success Modal
    const businessTypeLabels: Record<string, string> = {
      GROOMING_SALON: 'ร้านตัดขนและกรูมมิ่งสัตว์เลี้ยง (Grooming)',
      VETERINARIAN: 'คลินิกรักษาสัตว์ (Clinic OPD)',
      HYBRID_CLINIC_GROOMING: 'ไฮบริด (คลินิกสัตวแพทย์ + กรูมมิ่ง)',
    };
    const priceLabels: Record<string, string> = {
      STARTER: '1,290 บาท / เดือน',
      PROFESSIONAL: '2,990 บาท / เดือน',
      ENTERPRISE: '5,990 บาท / เดือน',
    };

    setCreatedSuccessTenant({
      name: newStoreName,
      slug: newSlug || `shop-${Date.now()}`,
      businessType: businessTypeLabels[newBusinessType] || newBusinessType,
      planName: `${newPlan.charAt(0) + newPlan.slice(1).toLowerCase()} Plan`,
      priceFormatted: priceLabels[newPlan] || '2,990 บาท / เดือน',
      ownerName: newOwnerName || 'เจ้าของร้าน',
      ownerEmail: newOwnerEmail,
      ownerPhone: newOwnerPhone || '08X-XXX-XXXX',
      tempPassword: newPassword || 'password123',
    });
    setIsCopied(false);

    // Sync to PostgreSQL DB
    fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStoreName,
        slug: newSlug,
        businessType: newBusinessType,
        planCode: newPlan,
        ownerName: newOwnerName,
        ownerEmail: newOwnerEmail,
        ownerPhone: newOwnerPhone,
        password: newPassword,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.tenant) {
          // Re-fetch to get real UUID
          fetch('/api/tenants')
            .then((r) => r.json())
            .then((d) => {
              if (d.status === 'success' && Array.isArray(d.tenants)) {
                setTenants(d.tenants);
              }
            })
            .catch(console.error);
        }
      })
      .catch(console.error);

    // Reset Form
    setNewStoreName('');
    setNewSlug('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerPhone('');
  };

  // Toggle Suspend / Activate Tenant
  const toggleTenantStatus = (tenantId: string) => {
    let newStatus = true;
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          newStatus = !t.isActive;
          setToastMessage(
            newStatus
              ? `🟢 ปลดล็อกการใช้งานร้าน ${t.name} เรียบร้อย`
              : `🔴 ระงับการใช้งานร้าน ${t.name} ชั่วคราวเรียบร้อย`
          );
          return {
            ...t,
            isActive: newStatus,
            subscriptionStatus: newStatus ? 'ACTIVE' : 'SUSPENDED',
          };
        }
        return t;
      })
    );

    // Sync to PostgreSQL DB
    fetch('/api/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: tenantId,
        isActive: newStatus,
      }),
    }).catch(console.error);
  };

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (filterStatus === 'ACTIVE' && !t.isActive) return false;
      if (filterStatus === 'SUSPENDED' && t.isActive) return false;
      if (filterPlan !== 'ALL' && t.planCode !== filterPlan) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.email ? t.email.toLowerCase().includes(q) : false) ||
          (t.phone ? t.phone.includes(q) : false)
        );
      }
      return true;
    });
  }, [tenants, filterStatus, filterPlan, searchTerm]);

  // Platform Metrics
  const platformMetrics = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.isActive).length;
    const mrr = tenants.reduce((acc, t) => acc + (t.isActive ? t.priceMinor : 0), 0);
    const totalUsers = tenants.reduce((acc, t) => acc + t.userCount, 0) + 1; // +1 for Super Admin
    return { total, active, mrr, totalUsers };
  }, [tenants]);

  if (user.role !== 'SAAS_ADMIN') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl font-bold border border-amber-500/20">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          สงวนสิทธิ์เฉพาะ Super Admin (DEV HQ)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          คุณกำลังล็อกอินอยู่ในบทบาท <strong>{user.roleTitle}</strong> หน้านี้เป็นศูนย์ควบคุมแพลตฟอร์มส่วนกลางสำหรับทีมผู้พัฒนาเท่านั้น
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:bg-[#0077ed] transition cursor-pointer"
          >
            กลับสู่แดชบอร์ดร้านของคุณ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/30 text-violet-300 border border-violet-500/40 uppercase tracking-wide">
              👑 DEV PLATFORM HQ
            </span>
            <span className="text-xs text-slate-400">Multi-Tenant Management Console</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-400" />
            SaaS Admin Hub (ศูนย์บริหารจัดการแพลตฟอร์ม)
          </h1>
          <p className="text-xs text-slate-300">
            ควบคุม ดูแล และสร้างร้านกรูมมิ่ง / คลินิกสัตวแพทย์ ให้กับลูกค้าทั่วประเทศ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/feature-flags"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            Feature Flags Hub
          </Link>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 shadow-md shadow-violet-500/25 px-4 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + เพิ่มร้าน / คลินิกใหม่ (+ Add Tenant)
          </Button>
        </div>
      </div>

      {/* Platform KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tenants */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ร้าน / คลินิกทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {platformMetrics.active} <span className="text-sm font-semibold text-slate-400">/ {platformMetrics.total} ร้าน</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            ● ใช้งานปกติ 100%
          </span>
        </div>

        {/* Card 2: Platform MRR */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">รายได้ค่าบริการ SaaS (MRR)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {(platformMetrics.mrr / 100).toLocaleString('th-TH')}{' '}
            <span className="text-xs font-normal text-slate-500">บาท/เดือน</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            รายรับหมุนเวียนรายเดือนของระบบ
          </span>
        </div>

        {/* Card 3: Platform Users */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ผู้ใช้งานในระบบรวม</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {platformMetrics.totalUsers}{' '}
            <span className="text-xs font-normal text-slate-400">บัญชี</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            รวม Owner, ช่าง, หมอ, Super Admin
          </span>
        </div>

        {/* Card 4: Platform Health */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">สถานะคลาวด์ & API</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 mt-1">
            99.99%
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            ● PostgreSQL Cloud Active
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('TENANTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'TENANTS'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          🏢 ทะเบียนร้านค้า / คลินิกทั้งหมด ({tenants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          📜 ประวัติการทำงานระบบ (Audit Logs)
        </button>
      </div>

      {/* Tab 1: Tenants Directory Table */}
      {activeTab === 'TENANTS' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="ACTIVE">🟢 เปิดใช้งาน (Active)</option>
                <option value="SUSPENDED">🔴 ถูกระงับ (Suspended)</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">ทุกแพ็กเกจ (All Plans)</option>
                <option value="STARTER">Starter Plan (1,290฿)</option>
                <option value="PROFESSIONAL">Professional Plan (2,990฿)</option>
                <option value="ENTERPRISE">Enterprise Plan (5,990฿)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อร้าน, slug, อีเมลเจ้าของ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ชื่อร้านค้า / คลินิก (Tenant)</th>
                    <th className="py-3 px-4">ประเภทธุรกิจ</th>
                    <th className="py-3 px-4">แพ็กเกจ SaaS</th>
                    <th className="py-3 px-4">ข้อมูลผู้ใช้ & สาขา</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลร้านค้าที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t: SaaSTenantListItem) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                            {t.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-violet-600 dark:text-violet-400 font-bold">
                              /{t.slug}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {t.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {t.businessType === 'GROOMING_SALON' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
                              <Scissors className="w-3 h-3 text-teal-600" />
                              กรูมมิ่งตัดขนล้วน
                            </span>
                          )}
                          {t.businessType === 'VETERINARY_CLINIC' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
                              <Stethoscope className="w-3 h-3 text-purple-600" />
                              คลินิกสัตวแพทย์
                            </span>
                          )}
                          {t.businessType === 'HYBRID_CLINIC_GROOMING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                              <Sparkles className="w-3 h-3 text-[#0071e3]" />
                              ไฮบริด (คลินิก+กรูมมิ่ง)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {t.planName}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {(t.priceMinor / 100).toLocaleString('th-TH')} ฿ / เดือน
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded mt-1 inline-block">
                            ⏳ รอบบิล: 28 ก.ย. 2026
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-300 font-medium block">
                            🏢 {t.branchCount} สาขา • 👥 {t.userCount} ผู้ใช้
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {t.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              เปิดใช้งาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              ถูกระงับ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1"
                              title="แก้ไขข้อมูลร้าน / แผน / โควต้า"
                            >
                              <Edit3 className="w-3 h-3 text-violet-500" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleTenantStatus(t.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                                t.isActive
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80'
                              }`}
                            >
                              {t.isActive ? 'ระงับบริการ' : 'ปลดระงับ'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: System Audit Logs */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              บันทึกกิจกรรมระบบทั้งหมด (System Audit Trails)
            </h3>
            <span className="text-xs text-slate-400">เก็บประวัติย้อนหลังอัตโนมัติ</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {INITIAL_AUDIT_LOGS.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    {log.details}
                  </p>
                  <span className="text-[11px] text-violet-600 font-semibold mt-0.5 block">
                    🏢 {log.targetTenantName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {log.timestamp}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> สำเร็จ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Interactive Modal: Onboard New Store / Clinic (New Tenant Modal) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    เพิ่มร้านค้า / คลินิกใหม่ (Add New Tenant)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    สร้างระบบแยกเฉพาะร้าน (Tenant Isolation) พร้อมบัญชีเจ้าของร้าน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              {/* Step 1: Business Information */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  1. ข้อมูลร้านค้า / คลินิก
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อร้าน / คลินิก *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Happy Paws Grooming Studio หรือ Bangkok Vet"
                    value={newStoreName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Slug URL * (ใช้ระบุร้าน)
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2.5 bg-slate-200/80 dark:bg-slate-700 rounded-l-xl text-[11px] text-slate-500 font-mono">
                        petflow.th/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="happypaws"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-r-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-violet-600 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      ประเภทธุรกิจ *
                    </label>
                    <select
                      value={newBusinessType}
                      onChange={(e) => setNewBusinessType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                    >
                      <option value="GROOMING_SALON">✂️ ร้านกรูมมิ่ง ตัดขนล้วน</option>
                      <option value="VETERINARY_CLINIC">🩺 คลินิกสัตวแพทย์ / รพ.สัตว์</option>
                      <option value="HYBRID_CLINIC_GROOMING">🐾 ไฮบริด (คลินิก + กรูมมิ่ง)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: SaaS Subscription Plan */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  2. เลือกแพ็กเกจ SaaS
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STARTER', label: 'Starter', price: '1,290 ฿/ด.', desc: '1 สาขา / 3 พนักงาน' },
                    { id: 'PROFESSIONAL', label: 'Pro', price: '2,990 ฿/ด.', desc: '3 สาขา / 10 พนักงาน' },
                    { id: 'ENTERPRISE', label: 'Enterprise', price: '5,990 ฿/ด.', desc: 'ไม่จำกัด' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPlan(p.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        newPlan === p.id
                          ? 'border-violet-500 bg-violet-500/10 text-violet-900 dark:text-violet-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="font-bold text-xs">{p.label}</span>
                      <span className="text-[11px] font-extrabold text-emerald-600 mt-1">{p.price}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Owner Account Credentials */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Crown className="w-4 h-4 text-amber-500" />
                  3. บัญชีเจ้าของร้าน (Owner Account สำหรับส่งมอบ)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      ชื่อ-นามสกุล เจ้าของร้าน
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น คุณกานดา รักสัตว์"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      placeholder="08X-XXX-XXXX"
                      value={newOwnerPhone}
                      onChange={(e) => setNewOwnerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      อีเมลล็อกอิน (Username) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@happypaws.com"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
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
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-500/25 cursor-pointer"
                >
                  🚀 สร้างร้านค้าและส่งมอบบัญชี
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    แก้ไขข้อมูลร้าน / คลินิก (Edit Tenant)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {editingTenant.id} • อัปเดตแพ็กเกจ โควต้าสาขา และข้อมูลติดต่อ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Store Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    ชื่อร้าน / คลินิก *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    URL Slug Identifier *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-full pl-6 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-violet-600 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  ประเภทธุรกิจ (Business Type)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditBusinessType('GROOMING_SALON')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editBusinessType === 'GROOMING_SALON'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                    <span className="text-[11px] block">กรูมมิ่งล้วน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditBusinessType('VETERINARY_CLINIC')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editBusinessType === 'VETERINARY_CLINIC'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="text-[11px] block">คลินิกล้วน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditBusinessType('HYBRID_CLINIC_GROOMING')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      editBusinessType === 'HYBRID_CLINIC_GROOMING'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-[#0071e3]" />
                    <span className="text-[11px] block">ไฮบริด (คลินิก+กรูมมิ่ง)</span>
                  </button>
                </div>
              </div>

              {/* SaaS Plan & Quota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    แพ็กเกจ SaaS (SaaS Plan)
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  >
                    <option value="STARTER">Starter Plan (1,290 ฿/ด.)</option>
                    <option value="PROFESSIONAL">Professional Plan (2,990 ฿/ด.)</option>
                    <option value="ENTERPRISE">Enterprise Plan (5,990 ฿/ด.)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    โควต้าสาขา (Branch Quota)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={editBranchCount}
                    onChange={(e) => setEditBranchCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  สถานะการให้บริการ
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-600 font-bold">🟢 เปิดใช้งานปกติ (Active)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-600 font-bold">🔴 ระงับบริการชั่วคราว (Suspended)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Tenant Created Success Modal */}
      {createdSuccessTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 my-8 text-center animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50/50 dark:ring-emerald-900/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> เปิดระบบร้านค้าใหม่สำเร็จ
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {createdSuccessTenant.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ระบบได้สร้างฐานข้อมูล, สาขาหลัก, บัญชีผู้ดูแล, และแพ็กเกจสมาชิกให้เรียบร้อยแล้ว
              </p>
            </div>

            {/* Credential Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">แพ็กเกจ SaaS:</span>
                <span className="font-extrabold text-violet-600 dark:text-violet-400">
                  {createdSuccessTenant.planName} ({createdSuccessTenant.priceFormatted})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">ประเภทธุรกิจ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {createdSuccessTenant.businessType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">ชื่อเจ้าของร้าน:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {createdSuccessTenant.ownerName} ({createdSuccessTenant.ownerPhone})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">อีเมลเข้าสู่ระบบ:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  {createdSuccessTenant.ownerEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">รหัสผ่านเริ่มต้น:</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  {createdSuccessTenant.tempPassword}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => {
                  const shareText = `🐾 ข้อมูลการเข้าใช้งานระบบ PetFlow SaaS\nชื่อร้าน: ${createdSuccessTenant.name}\nแพ็กเกจ: ${createdSuccessTenant.planName}\nอีเมลเข้าใช้งาน: ${createdSuccessTenant.ownerEmail}\nรหัสผ่านเริ่มต้น: ${createdSuccessTenant.tempPassword}\nเข้าใช้งานที่: https://app.petflow.th/login`;
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
                    <span>📋 คัดลอกข้อมูลเข้าสู่ระบบส่งต่อให้ลูกค้า</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setCreatedSuccessTenant(null)}
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

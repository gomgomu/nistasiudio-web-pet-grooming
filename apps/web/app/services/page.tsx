'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Stethoscope,
  Syringe,
  Sparkles,
  Plus,
  Search,
  Clock,
  Dog,
  Cat,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Tag,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button, Badge } from '@petflow/ui';

export type ServiceCategory = 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMinutes: number;
  priceMinor: number;
  species: 'DOG' | 'CAT' | 'ALL';
  description?: string;
  isActive: boolean;
  commissionRate: number; // percentage e.g. 15
}

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 's-01',
    name: 'อาบน้ำ + ตัดแต่งทรงกรูมมิ่ง สุนัขพันธุ์เล็ก',
    category: 'GROOMING',
    durationMinutes: 90,
    priceMinor: 55000,
    species: 'DOG',
    description: 'อาบน้ำอุ่น แชมพูสูตรอ่อนโยน เช็ดหู ตัดเล็บ ไถเท้า และตัดแต่งขนตามทรงที่ต้องการ',
    isActive: true,
    commissionRate: 15,
  },
  {
    id: 's-02',
    name: 'อาบน้ำ + สปาโอโซนบำรุงผิวขน สุนัขทุกสายพันธุ์',
    category: 'SPA',
    durationMinutes: 60,
    priceMinor: 65000,
    species: 'DOG',
    description: 'แช่อ่างสปานาโนโอโซน ฆ่าเชื้อแบคทีเรีย ลดกลิ่นตัวและอาการคัน',
    isActive: true,
    commissionRate: 15,
  },
  {
    id: 's-03',
    name: 'อาบน้ำกำจัดสังกะตังและหวีสางขน แมวขนยาว',
    category: 'GROOMING',
    durationMinutes: 75,
    priceMinor: 50000,
    species: 'CAT',
    description: 'หวีสางสังกะตัง อาบน้ำเป่าขนแห้งสนิทด้วยไดร์ลมเงียบพิเศษสำหรับแมว',
    isActive: true,
    commissionRate: 15,
  },
  {
    id: 's-04',
    name: 'ตรวจสุขภาพทั่วไปโดยสัตวแพทย์ (General Health Check)',
    category: 'CLINIC',
    durationMinutes: 30,
    priceMinor: 30000,
    species: 'ALL',
    description: 'ตรวจร่างกายพื้นฐาน ฟังเสียงหัวใจ ปอด ตรวจช่องปาก หู ตา วัดอุณหภูมิ',
    isActive: true,
    commissionRate: 10,
  },
  {
    id: 's-05',
    name: 'ฉีดวัคซีนรวมสุนัข 5 โรค + ถ่ายพยาธิ',
    category: 'VACCINE',
    durationMinutes: 20,
    priceMinor: 45000,
    species: 'DOG',
    description: 'ป้องกันโรคไข้หัด ลำไส้อักเสบ ตับอักเสบ เลปโตสไปโรซิส และหลอดลมอักเสบ',
    isActive: true,
    commissionRate: 10,
  },
  {
    id: 's-06',
    name: 'ฉีดวัคซีนรวมแมว + ป้องกันพิษสุนัขบ้า',
    category: 'VACCINE',
    durationMinutes: 20,
    priceMinor: 40000,
    species: 'CAT',
    description: 'ป้องกันไข้หัดแมว หวัดแมว ช่องปากอักเสบ และโรคพิษสุนัขบ้า',
    isActive: true,
    commissionRate: 10,
  },
  {
    id: 's-07',
    name: 'ตรวจผิวหนัง ตรวจหู ส่องกล้องเซลล์วิทยา (Ear Cytology)',
    category: 'CLINIC',
    durationMinutes: 45,
    priceMinor: 55000,
    species: 'ALL',
    description: 'เก็บตัวอย่างเซลล์ในช่องหู/ผิวหนัง ย้อมสีส่องกล้องตรวจหาเชื้อรา ยีสต์ และไรในหู',
    isActive: true,
    commissionRate: 10,
  },
  {
    id: 's-08',
    name: 'สปาโคลนเดดซี พอกบำรุงขนและผ่อนคลายกล้ามเนื้อ',
    category: 'SPA',
    durationMinutes: 60,
    priceMinor: 75000,
    species: 'DOG',
    description: 'พอกโคลนแร่ธรรมชาติบริสุทธิ์ ช่วยขับสารพิษ ฟื้นฟูสภาพผิวหนังแห้งแพ้ง่าย',
    isActive: true,
    commissionRate: 15,
  },
];

export default function ServicesPricingPage() {
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('GROOMING');
  const [formDuration, setFormDuration] = useState('60');
  const [formPrice, setFormPrice] = useState('500');
  const [formSpecies, setFormSpecies] = useState<'DOG' | 'CAT' | 'ALL'>('ALL');
  const [formDescription, setFormDescription] = useState('');
  const [formCommission, setFormCommission] = useState('15');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (selectedSpecies !== 'ALL' && s.species !== 'ALL' && s.species !== selectedSpecies) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [services, selectedCategory, selectedSpecies, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormName('');
    setFormCategory('GROOMING');
    setFormDuration('60');
    setFormPrice('500');
    setFormSpecies('ALL');
    setFormDescription('');
    setFormCommission('15');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setFormName(service.name);
    setFormCategory(service.category);
    setFormDuration(service.durationMinutes.toString());
    setFormPrice((service.priceMinor / 100).toString());
    setFormSpecies(service.species);
    setFormDescription(service.description || '');
    setFormCommission(service.commissionRate.toString());
    setIsModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceMinor = Math.round((parseFloat(formPrice) || 0) * 100);
    const durationMinutes = parseInt(formDuration, 10) || 60;
    const commissionRate = parseFloat(formCommission) || 10;

    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: formName,
                category: formCategory,
                durationMinutes,
                priceMinor,
                species: formSpecies,
                description: formDescription,
                commissionRate,
              }
            : s
        )
      );
      showToast('✅ อัปเดตรายการบริการเรียบร้อย');
    } else {
      const newService: ServiceItem = {
        id: `s-${Date.now()}`,
        name: formName,
        category: formCategory,
        durationMinutes,
        priceMinor,
        species: formSpecies,
        description: formDescription,
        isActive: true,
        commissionRate,
      };
      setServices((prev) => [newService, ...prev]);
      showToast('🎉 เพิ่มรายการบริการใหม่สำเร็จ');
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDeleteService = (id: string, name: string) => {
    if (confirm(`ยืนยันการลบรายการบริการ "${name}" หรือไม่?`)) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('🗑️ ลบรายการบริการเรียบร้อย');
    }
  };

  const getCategoryBadge = (category: ServiceCategory) => {
    switch (category) {
      case 'GROOMING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
            <Scissors className="w-3 h-3" /> กรูมมิ่ง
          </span>
        );
      case 'CLINIC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
            <Stethoscope className="w-3 h-3" /> ตรวจรักษา
          </span>
        );
      case 'VACCINE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
            <Syringe className="w-3 h-3" /> วัคซีน
          </span>
        );
      case 'SPA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
            <Sparkles className="w-3 h-3" /> สปา/ทรีตเมนต์
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-3">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-slate-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> การตั้งค่าระบบ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">รายการบริการ & ราคา</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#0071e3]" /> จัดการบริการ & อัตราค่าบริการ (Services & Pricing)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กำหนดแค็ตตาล็อกบริการ ระยะเวลา อัตราค่าบริการ และเปอร์เซ็นต์คอมมิชชั่นช่าง/แพทย์
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-apple transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> เพิ่มบริการใหม่
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-apple space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริการ หรือรายละเอียด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'GROOMING', label: '✂️ กรูมมิ่ง' },
              { id: 'CLINIC', label: '🩺 ตรวจรักษา' },
              { id: 'VACCINE', label: '💉 วัคซีน' },
              { id: 'SPA', label: '✨ สปา' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#0071e3] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Species Filter */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            {[
              { id: 'ALL', label: 'ทุกสัตว์' },
              { id: 'DOG', label: '🐶 สุนัข' },
              { id: 'CAT', label: '🐱 แมว' },
            ].map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedSpecies(sp.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedSpecies === sp.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-apple ${
              service.isActive
                ? 'border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/40'
                : 'border-slate-200/40 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>{getCategoryBadge(service.category)}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    {service.species === 'DOG' && '🐶 สุนัข'}
                    {service.species === 'CAT' && '🐱 แมว'}
                    {service.species === 'ALL' && '🐾 ทุกสายพันธุ์'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(service.id)}
                    className={`w-7 h-4 rounded-full p-0.5 transition cursor-pointer ${
                      service.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={service.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        service.isActive ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{service.durationMinutes} นาที</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>คอมมิชชั่น {service.commissionRate}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400">ราคาค่าบริการ</span>
                <div className="text-lg font-black text-[#0071e3] dark:text-blue-400">
                  {(service.priceMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(service)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="แก้ไข"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id, service.name)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="ลบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">ไม่พบบริการที่ค้นหา</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือคลิกปุ่ม &quot;เพิ่มบริการใหม่&quot; ด้านบน
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0071e3]" />
                {editingService ? 'แก้ไขรายการบริการ' : 'เพิ่มรายการบริการใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อบริการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อาบน้ำตัดขนสุนัขพันธุ์เล็ก"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    หมวดหมู่บริการ
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  >
                    <option value="GROOMING">✂️ กรูมมิ่ง (Grooming)</option>
                    <option value="CLINIC">🩺 คลินิก/ตรวจรักษา (Clinic)</option>
                    <option value="VACCINE">💉 วัคซีน (Vaccine)</option>
                    <option value="SPA">✨ สปา/ทรีตเมนต์ (Spa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    สัตว์เลี้ยงที่รองรับ
                  </label>
                  <select
                    value={formSpecies}
                    onChange={(e) => setFormSpecies(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  >
                    <option value="ALL">🐾 รองรับทุกสายพันธุ์</option>
                    <option value="DOG">🐶 สุนัขเท่านั้น</option>
                    <option value="CAT">🐱 แมวเท่านั้น</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ราคา (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ระยะเวลา (นาที)
                  </label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    คอมมิชชั่น (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียด / สิ่งที่รวมในบริการ
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น รวมอาบน้ำ เช็ดหู ตัดเล็บ ไถขนอุ้งเท้า..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-apple transition"
                >
                  {editingService ? 'บันทึกการแก้ไข' : 'เพิ่มบริการ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Dog,
  Cat,
  Plus,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Scissors,
  Receipt,
  Edit,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [activeTab, setActiveTab] = useState<'pets' | 'history' | 'notifications'>('pets');

  // Mock Customer Detail Data
  const customer = {
    id: customerId,
    firstName: 'กนกวรรณ',
    lastName: 'รักดี',
    phone: '089-111-2233',
    email: 'kanokwan@gmail.com',
    lineUserId: 'U123456789',
    address: '123/45 ซ.สุขุมวิท 39 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    notes: 'ลูกค้าชอบจองวันเสาร์ช่วงบ่าย มักพาน้องมาทั้ง 2 ตัวพร้อมกัน',
    marketingStatus: 'OPTED_IN',
    createdAt: '2026-08-01',
    stats: {
      totalVisits: 14,
      totalSpent: '฿18,450',
      activeAppointments: 1,
      unpaidInvoices: 0,
    },
    pets: [
      {
        id: 'p1111111-1111-4111-a111-111111111111',
        name: 'โมจิ (Mochi)',
        species: 'DOG',
        breed: 'Pomeranian',
        sex: 'FEMALE',
        birthDate: '2023-04-10',
        weight: '3.20',
        microchip: '900182001928374',
        allergies: 'แพ้ยาฆ่าเชื้อกลุ่ม Amoxicillin',
        behavior: 'กลัวเสียงไดร์เป่าขนตัวใหญ่ ต้องใช้ไดร์เก็บเสียง',
        specialRequirements: 'ชอบให้หวีขนเบาๆ บริเวณหลังหู',
        lastVisit: '2026-08-18',
        nextAppointment: '2026-08-30 14:00 (อาบน้ำตัดขน)',
      },
      {
        id: 'p2222222-2222-4222-a222-222222222222',
        name: 'ชาโคล (Charcoal)',
        species: 'CAT',
        breed: 'British Shorthair',
        sex: 'MALE',
        birthDate: '2024-01-15',
        weight: '4.80',
        microchip: '900182001928375',
        allergies: 'ไม่มี',
        behavior: 'นิ่ง ใจดี ไม่งอแงเวลาตัดเล็บ',
        specialRequirements: 'ระวังอย่าตัดเล็บลึกเกินไป',
        lastVisit: '2026-08-10',
        nextAppointment: null,
      },
    ],
    recentHistory: [
      {
        id: 'h1',
        date: '2026-08-18',
        type: 'GROOMING',
        petName: 'โมจิ (Mochi)',
        serviceName: 'Full Grooming (อาบน้ำ + ตัดขนทรงหมี)',
        staffName: 'ช่างบอย',
        amount: '฿750',
        status: 'COMPLETED',
      },
      {
        id: 'h2',
        date: '2026-08-10',
        type: 'VACCINE',
        petName: 'ชาโคล (Charcoal)',
        serviceName: 'ฉีดวัคซีนรวมแมว + หยอดยาป้องกันเห็บหมัด',
        staffName: 'สพ.ญ. วรรณภา',
        amount: '฿890',
        status: 'COMPLETED',
      },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {customer.firstName} {customer.lastName}
              </h1>
              {customer.lineUserId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
                  <MessageCircle className="w-3.5 h-3.5" />
                  LINE Connect
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              รหัสลูกค้า: {customer.id} • สมาชิกตั้งแต่ {customer.createdAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-apple transition cursor-pointer">
            <Edit className="w-3.5 h-3.5" />
            แก้ไขข้อมูล
          </button>

          <Link
            href={`/customers/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มสัตว์เลี้ยง (+ Pet)
          </Link>
        </div>
      </div>

      {/* Customer Info Card & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Info & Address */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ข้อมูลการติดต่อ (Contact Info)
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">เบอร์โทรศัพท์</p>
                <a href={`tel:${customer.phone}`} className="font-semibold hover:text-emerald-600">
                  {customer.phone}
                </a>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">อีเมล</p>
                  <p className="font-medium text-xs">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ที่อยู่จัดส่ง / ติดต่อ</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{customer.address}</p>
                </div>
              </div>
            )}

            {customer.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">บันทึกช่วยจำ: </span>
                {customer.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right: CRM Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">เข้าใช้บริการ</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{customer.stats.totalVisits}</span>
              <span className="text-xs text-slate-500 ml-1">ครั้ง</span>
            </div>
            <span className="text-[11px] text-[#0071e3] font-medium mt-1">สม่ำเสมอ</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">ยอดใช้จ่ายสะสม</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#0071e3]">{customer.stats.totalSpent}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Tier: Gold Member</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">สัตว์เลี้ยงในระบบ</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{customer.pets.length}</span>
              <span className="text-xs text-slate-500 ml-1">ตัว</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">สุนัข 1, แมว 1</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">นัดหมายรอดำเนินการ</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-600">{customer.stats.activeAppointments}</span>
              <span className="text-xs text-slate-500 ml-1">รายการ</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium mt-1">30 ส.ค. นี้</span>
          </div>
        </div>
      </div>

      {/* Tabs Section: Pets / History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'pets'
                ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            สัตว์เลี้ยงที่ลงทะเบียน ({customer.pets.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ประวัติการรับบริการ & ใบเสร็จ ({customer.recentHistory.length})
          </button>
        </div>

        {/* Tab 1: Pets Cards */}
        {activeTab === 'pets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4 hover:shadow-apple-md transition"
              >
                {/* Pet Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#0071e3] flex items-center justify-center">
                      {pet.species === 'DOG' ? (
                        <Dog className="w-6 h-6" />
                      ) : (
                        <Cat className="w-6 h-6 text-sky-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{pet.name}</h3>
                      <p className="text-xs text-slate-500">
                        {pet.breed} • เพศ: {pet.sex === 'FEMALE' ? 'เมีย' : 'ผู้'} • น้ำหนัก: {pet.weight} กก.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">
                    Chip: {pet.microchip}
                  </span>
                </div>

                {/* Warnings / Allergies */}
                <div className="space-y-2 text-xs">
                  {pet.allergies && pet.allergies !== 'ไม่มี' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                      <span className="font-medium">แพ้ยา/อาหาร: {pet.allergies}</span>
                    </div>
                  )}

                  {pet.behavior && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 flex-shrink-0 text-amber-600" />
                      <span>ข้อควรระวัง: {pet.behavior}</span>
                    </div>
                  )}
                </div>

                {/* Next Appointment / Last Visit */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>มาล่าสุด: {pet.lastVisit}</span>
                  {pet.nextAppointment && (
                    <span className="font-semibold text-[#0071e3]">นัดถัดไป: {pet.nextAppointment}</span>
                  )}
                </div>

                {/* Pet Quick Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-blue-50 text-[#0071e3] hover:bg-blue-100 font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs">
                    <Scissors className="w-3.5 h-3.5" />
                    เปิดคิวตัดขน
                  </button>

                  <button className="flex-1 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    นัดหมายใหม่
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Service History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {customer.recentHistory.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.serviceName}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                        {item.petName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      วันที่: {item.date} • ผู้ให้บริการ: {item.staffName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm">{item.amount}</span>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold justify-end mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    ชำระแล้ว
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Dog,
  Cat,
  User,
  ChevronRight,
  Filter,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@petflow/ui';

interface MockCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  lineUserId: string | null;
  address: string | null;
  marketingStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';
  createdAt: string;
  pets: {
    id: string;
    name: string;
    species: 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER';
    breed: string | null;
  }[];
}

const INITIAL_CUSTOMERS: MockCustomer[] = [
  {
    id: 'c1111111-1111-4111-a111-111111111111',
    firstName: 'กนกวรรณ',
    lastName: 'รักดี',
    phone: '089-111-2233',
    email: 'kanokwan@gmail.com',
    lineUserId: 'U123456789',
    address: '123/45 ซ.สุขุมวิท 39 คลองตันเหนือ วัฒนา กทม.',
    marketingStatus: 'OPTED_IN',
    createdAt: '2026-08-01T10:00:00Z',
    pets: [
      { id: 'p1', name: 'โมจิ (Mochi)', species: 'DOG', breed: 'Pomeranian' },
      { id: 'p2', name: 'ชาโคล (Charcoal)', species: 'CAT', breed: 'British Shorthair' },
    ],
  },
  {
    id: 'c2222222-2222-4222-a222-222222222222',
    firstName: 'ธนากร',
    lastName: 'สุขสวัสดิ์',
    phone: '081-444-5566',
    email: 'thanakorn@hotmail.com',
    lineUserId: 'U987654321',
    address: '88/9 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม.',
    marketingStatus: 'OPTED_IN',
    createdAt: '2026-08-10T14:30:00Z',
    pets: [
      { id: 'p3', name: 'ลัคกี้ (Lucky)', species: 'DOG', breed: 'Golden Retriever' },
    ],
  },
  {
    id: 'c3333333-3333-4333-a333-333333333333',
    firstName: 'พิมพิศา',
    lastName: 'ว่องวิทย์',
    phone: '086-777-8899',
    email: null,
    lineUserId: null,
    address: '55 หมู่ 4 ต.บางกรวย อ.บางกรวย นนทบุรี',
    marketingStatus: 'OPTED_IN',
    createdAt: '2026-08-15T09:15:00Z',
    pets: [
      { id: 'p4', name: 'ส้มตำ (Somtam)', species: 'CAT', breed: 'Thai Domestic' },
      { id: 'p5', name: 'ข้าวเหนียว (Khao Niew)', species: 'CAT', breed: 'Scottish Fold' },
    ],
  },
  {
    id: 'c4444444-4444-4444-a444-444444444444',
    firstName: 'วิชัย',
    lastName: 'เมธากุล',
    phone: '085-333-2211',
    email: 'wichai.m@gmail.com',
    lineUserId: 'U555666777',
    address: '99/12 ถ.ราชพฤกษ์ ต.บางรักน้อย อ.เมือง นนทบุรี',
    marketingStatus: 'OPTED_OUT',
    createdAt: '2026-08-20T16:00:00Z',
    pets: [
      { id: 'p6', name: 'บัดดี้ (Buddy)', species: 'DOG', breed: 'French Bulldog' },
    ],
  },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');

  const filteredCustomers = INITIAL_CUSTOMERS.filter((customer) => {
    const matchesSearch =
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customer.pets.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecies =
      speciesFilter === 'ALL' ||
      customer.pets.some((p) => p.species === speciesFilter);

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            จัดการข้อมูลลูกค้า (Customers CRM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ค้นหาประวัติเจ้าของ สัตว์เลี้ยง เบอร์โทร และประวัติการรับบริการ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/retention"
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 hover:bg-blue-100/70 text-[#0071e3] dark:text-blue-400 font-medium text-sm px-4 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-[#0071e3]" />
            กลุ่มลูกค้า & RFM (Retention)
          </Link>

          <Link
            href="/customers/import"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium text-sm px-4 py-2.5 rounded-xl shadow-apple transition active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            นำเข้าไฟล์ CSV
          </Link>

          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/25 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            ลงทะเบียนลูกค้าใหม่ (+ Customer)
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar (Apple Segmented Style) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ชื่อสัตว์เลี้ยง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#0071e3] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>ประเภท:</span>
          </div>

          <button
            onClick={() => setSpeciesFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              speciesFilter === 'ALL'
                ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({INITIAL_CUSTOMERS.length})
          </button>

          <button
            onClick={() => setSpeciesFilter('DOG')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              speciesFilter === 'DOG'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            สุนัข (Dog)
          </button>

          <button
            onClick={() => setSpeciesFilter('CAT')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              speciesFilter === 'CAT'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
            }`}
          >
            <Cat className="w-3.5 h-3.5" />
            แมว (Cat)
          </button>
        </div>
      </div>

      {/* Customer List / Table (Apple UI Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#0071e3] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <User className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มลงทะเบียนลูกค้าใหม่</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 sm:p-5 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left info: Customer Profile */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/40 text-[#0071e3] dark:text-blue-300 flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs">
                    {customer.firstName[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#0071e3] transition text-base flex items-center gap-1"
                      >
                        {customer.firstName} {customer.lastName}
                      </Link>

                      {customer.lineUserId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
                          <MessageCircle className="w-3 h-3" />
                          LINE Connect
                        </span>
                      )}

                      {customer.marketingStatus === 'OPTED_IN' && (
                        <Badge variant="default" className="text-[10px]">
                          SMS/Consent
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0071e3] font-medium"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
                        {customer.phone}
                      </a>

                      {customer.email && (
                        <span>• {customer.email}</span>
                      )}

                      {customer.address && (
                        <span className="text-slate-400 truncate max-w-xs">• {customer.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle info: Registered Pets */}
                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  {customer.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      {pet.species === 'DOG' ? (
                        <Dog className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Cat className="w-3.5 h-3.5 text-sky-600" />
                      )}
                      <span>{pet.name}</span>
                      {pet.breed && (
                        <span className="text-[10px] text-slate-400 font-normal">({pet.breed})</span>
                      )}
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition shadow-xs"
                    >
                      ดูประวัติ
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
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

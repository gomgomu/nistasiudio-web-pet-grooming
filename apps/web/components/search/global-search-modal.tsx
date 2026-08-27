'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  User,
  Dog,
  Cat,
  Phone,
  ArrowRight,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';

interface SearchResultCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  lineUserId?: string | null;
  pets: { id: string; name: string; species: 'DOG' | 'CAT' | string; breed?: string | null }[];
}

interface SearchResultPet {
  id: string;
  name: string;
  species: 'DOG' | 'CAT' | string;
  breed?: string | null;
  microchipNumber?: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CUSTOMERS' | 'PETS'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock Database for UI Instant Search
  const mockCustomers: SearchResultCustomer[] = [
    {
      id: 'c1111111-1111-4111-a111-111111111111',
      firstName: 'กนกวรรณ',
      lastName: 'รักดี',
      phone: '089-111-2233',
      lineUserId: 'U123456789',
      pets: [
        { id: 'd1111111-1111-4111-a111-111111111111', name: 'โมจิ (Mochi)', species: 'DOG', breed: 'Pomeranian' },
        { id: 'p2', name: 'ลาเต้ (Latte)', species: 'DOG', breed: 'Golden Retriever' },
      ],
    },
    {
      id: 'c2',
      firstName: 'ธนภัทร',
      lastName: 'สุขสมบูรณ์',
      phone: '081-999-8877',
      pets: [{ id: 'p3', name: 'ชาโคล (Charcoal)', species: 'CAT', breed: 'British Shorthair' }],
    },
    {
      id: 'c3',
      firstName: 'วิภาดา',
      lastName: 'เจริญกิจ',
      phone: '086-555-4433',
      pets: [{ id: 'p4', name: 'บิงซู (Bingsu)', species: 'CAT', breed: 'Persian' }],
    },
  ];

  const mockPets: SearchResultPet[] = [
    {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'โมจิ (Mochi)',
      species: 'DOG',
      breed: 'Pomeranian',
      microchipNumber: '900182001928374',
      customer: {
        id: 'c1111111-1111-4111-a111-111111111111',
        firstName: 'กนกวรรณ',
        lastName: 'รักดี',
        phone: '089-111-2233',
      },
    },
    {
      id: 'p2',
      name: 'ลาเต้ (Latte)',
      species: 'DOG',
      breed: 'Golden Retriever',
      microchipNumber: '900182001928375',
      customer: {
        id: 'c1111111-1111-4111-a111-111111111111',
        firstName: 'กนกวรรณ',
        lastName: 'รักดี',
        phone: '089-111-2233',
      },
    },
    {
      id: 'p3',
      name: 'ชาโคล (Charcoal)',
      species: 'CAT',
      breed: 'British Shorthair',
      microchipNumber: '900182001928376',
      customer: {
        id: 'c2',
        firstName: 'ธนภัทร',
        lastName: 'สุขสมบูรณ์',
        phone: '081-999-8877',
      },
    },
    {
      id: 'p4',
      name: 'บิงซู (Bingsu)',
      species: 'CAT',
      breed: 'Persian',
      microchipNumber: '900182001928377',
      customer: {
        id: 'c3',
        firstName: 'วิภาดา',
        lastName: 'เจริญกิจ',
        phone: '086-555-4433',
      },
    },
  ];

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveCategory('ALL');
    }
  }, [isOpen]);

  // Global shortcut listeners (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Filter Customers
  const filteredCustomers = mockCustomers.filter((c) => {
    if (!normalizedQuery) return true;
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const phoneClean = c.phone.replace(/[^0-9]/g, '');
    const queryClean = normalizedQuery.replace(/[^0-9]/g, '');
    const petMatch = c.pets.some((p) => p.name.toLowerCase().includes(normalizedQuery));

    return (
      fullName.includes(normalizedQuery) ||
      (queryClean.length > 0 && phoneClean.includes(queryClean)) ||
      petMatch
    );
  });

  // Filter Pets
  const filteredPets = mockPets.filter((p) => {
    if (!normalizedQuery) return true;
    const petName = p.name.toLowerCase();
    const breed = (p.breed || '').toLowerCase();
    const chip = (p.microchipNumber || '').toLowerCase();
    const ownerName = `${p.customer.firstName} ${p.customer.lastName}`.toLowerCase();
    const phoneClean = p.customer.phone.replace(/[^0-9]/g, '');
    const queryClean = normalizedQuery.replace(/[^0-9]/g, '');

    return (
      petName.includes(normalizedQuery) ||
      breed.includes(normalizedQuery) ||
      chip.includes(normalizedQuery) ||
      ownerName.includes(normalizedQuery) ||
      (queryClean.length > 0 && phoneClean.includes(queryClean))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop with Apple blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog (Apple Spotlight Style) */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-[#0071e3] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ชื่อสัตว์เลี้ยง, ไมโครชิป..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Apple Segmented Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              activeCategory === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด ({filteredCustomers.length + filteredPets.length})
          </button>
          <button
            onClick={() => setActiveCategory('CUSTOMERS')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              activeCategory === 'CUSTOMERS'
                ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ลูกค้า ({filteredCustomers.length})
          </button>
          <button
            onClick={() => setActiveCategory('PETS')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              activeCategory === 'PETS'
                ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            สัตว์เลี้ยง ({filteredPets.length})
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Customers Group */}
          {(activeCategory === 'ALL' || activeCategory === 'CUSTOMERS') && filteredCustomers.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-[#0071e3]" />
                รายชื่อลูกค้า (Customers)
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all group border border-transparent hover:border-blue-100 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                        {customer.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0071e3] transition-colors">
                            {customer.firstName} {customer.lastName}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#0071e3]" />
                            {customer.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                          <span>สัตว์เลี้ยง:</span>
                          {customer.pets.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0071e3] dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pets Group */}
          {(activeCategory === 'ALL' || activeCategory === 'PETS') && filteredPets.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dog className="w-3 h-3 text-[#0071e3]" />
                สัตว์เลี้ยง (Pets)
              </div>
              <div className="space-y-1">
                {filteredPets.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/pets/${pet.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all group border border-transparent hover:border-blue-100 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-300 flex items-center justify-center">
                        {pet.species === 'DOG' ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5 text-sky-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0071e3] transition-colors">
                            {pet.name}
                          </span>
                          <span className="text-xs text-slate-400">({pet.breed})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          เจ้าของ: <strong className="text-slate-700 dark:text-slate-300">{pet.customer.firstName} {pet.customer.lastName}</strong> • {pet.customer.phone}
                          {pet.microchipNumber && (
                            <span className="ml-2 font-mono text-[10px] text-slate-400">
                              Chip: {pet.microchipNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0071e3] dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredCustomers.length === 0 && filteredPets.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#0071e3] flex items-center justify-center mx-auto shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ไม่พบข้อมูลลูกค้าหรือสัตว์เลี้ยงที่ตรงกับ &quot;{query}&quot;
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ลองค้นหาด้วยเบอร์โทรศัพท์ (เช่น 0891112233) หรือชื่อสัตว์เลี้ยง
                </p>
              </div>
              <Link
                href="/customers/new"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                ลงทะเบียนลูกค้าใหม่ (+ Add Customer)
              </Link>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>กด <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold shadow-xs">↵ Enter</kbd> เพื่อเลือก</span>
            <span>กด <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold shadow-xs">ESC</kbd> เพื่อปิด</span>
          </div>
          <span className="flex items-center gap-1 text-[#0071e3] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Fast Search Enabled
          </span>
        </div>
      </div>
    </div>
  );
}

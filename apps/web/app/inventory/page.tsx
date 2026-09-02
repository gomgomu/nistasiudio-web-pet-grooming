'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Barcode,
  History,
  X,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Syringe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@petflow/ui';
import { InventoryTransactionType } from '@petflow/types';

export interface InventoryItemDisplay {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: 'GROOMING_SUPPLY' | 'MEDICATION' | 'VACCINE' | 'PETSHOP' | 'SPA';
  unit: string;
  costMinor: number;
  salePriceMinor: number;
  taxRate: number;
  reorderPoint: number;
  currentStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isPrescriptionOnly: boolean;
  branchName: string;
}

export interface InventoryTransactionLog {
  id: string;
  createdAt: string;
  productName: string;
  sku: string;
  type: InventoryTransactionType;
  quantity: number;
  branchName: string;
  referenceType?: string;
  user: string;
}

const INITIAL_INVENTORY_ITEMS: InventoryItemDisplay[] = [
  {
    id: 'prod-01',
    sku: 'DOG-SHMP-300',
    barcode: '8850123456789',
    name: 'แชมพูบำรุงขนสุนัข Hypoallergenic (300 ml)',
    category: 'GROOMING_SUPPLY',
    unit: 'ขวด',
    costMinor: 15000,
    salePriceMinor: 35000,
    taxRate: 7.0,
    reorderPoint: 5,
    currentStock: 24,
    stockStatus: 'IN_STOCK',
    isPrescriptionOnly: false,
    branchName: 'สาขาทองหล่อ',
  },
  {
    id: 'prod-02',
    sku: 'TREAT-BEEF-DNT',
    barcode: '8850123456790',
    name: 'ขนมขบเคี้ยวขัดฟันสุนัข กลิ่นเนื้อรมควัน (ถุงใหญ่)',
    category: 'PETSHOP',
    unit: 'ถุง',
    costMinor: 8000,
    salePriceMinor: 15000,
    taxRate: 7.0,
    reorderPoint: 10,
    currentStock: 45,
    stockStatus: 'IN_STOCK',
    isPrescriptionOnly: false,
    branchName: 'สาขาทองหล่อ',
  },
  {
    id: 'prod-03',
    sku: 'MED-DERM-TAB',
    barcode: '8850123456791',
    name: 'ยาปฏิชีวนะรักษาแผลผิวหนังและตุ่มหนอง (14 เม็ด)',
    category: 'MEDICATION',
    unit: 'แผง',
    costMinor: 18000,
    salePriceMinor: 28000,
    taxRate: 0.0, // Tax-exempt
    reorderPoint: 8,
    currentStock: 4,
    stockStatus: 'LOW_STOCK',
    isPrescriptionOnly: true,
    branchName: 'สาขาทองหล่อ',
  },
  {
    id: 'prod-04',
    sku: 'VAC-DOG-5WAY',
    barcode: '8850123456792',
    name: 'วัคซีนรวมสุนัข 5 โรค (แช่เย็น 2-8°C)',
    category: 'VACCINE',
    unit: 'โดส',
    costMinor: 22000,
    salePriceMinor: 45000,
    taxRate: 7.0,
    reorderPoint: 6,
    currentStock: 2,
    stockStatus: 'LOW_STOCK',
    isPrescriptionOnly: true,
    branchName: 'สาขาทองหล่อ',
  },
  {
    id: 'prod-05',
    sku: 'CAT-SPA-OZONE',
    barcode: '8850123456793',
    name: 'น้ำยาอาบน้ำสปาโอโซนสูตรแมวขนยาว (500 ml)',
    category: 'SPA',
    unit: 'ขวด',
    costMinor: 20000,
    salePriceMinor: 45000,
    taxRate: 7.0,
    reorderPoint: 5,
    currentStock: 0,
    stockStatus: 'OUT_OF_STOCK',
    isPrescriptionOnly: false,
    branchName: 'สาขาทองหล่อ',
  },
  {
    id: 'prod-06',
    sku: 'EAR-CLEAN-100',
    barcode: '8850123456794',
    name: 'น้ำยาเช็ดหูกำจัดไรและแบคทีเรียสำหรับสัตว์เลี้ยง (100 ml)',
    category: 'GROOMING_SUPPLY',
    unit: 'ขวด',
    costMinor: 9500,
    salePriceMinor: 22000,
    taxRate: 7.0,
    reorderPoint: 8,
    currentStock: 18,
    stockStatus: 'IN_STOCK',
    isPrescriptionOnly: false,
    branchName: 'สาขาทองหล่อ',
  },
];

const INITIAL_TRANSACTION_LOGS: InventoryTransactionLog[] = [
  {
    id: 'tx-001',
    createdAt: '25 ส.ค. 2026 14:10 น.',
    productName: 'ขนมขบเคี้ยวขัดฟันสุนัข กลิ่นเนื้อรมควัน (ถุงใหญ่)',
    sku: 'TREAT-BEEF-DNT',
    type: 'OUT',
    quantity: -2,
    branchName: 'สาขาทองหล่อ',
    referenceType: 'INVOICE: INV-202608-0008',
    user: 'แคชเชียร์ 01',
  },
  {
    id: 'tx-002',
    createdAt: '25 ส.ค. 2026 11:30 น.',
    productName: 'แชมพูบำรุงขนสุนัข Hypoallergenic (300 ml)',
    sku: 'DOG-SHMP-300',
    type: 'CONSUMPTION',
    quantity: -1,
    branchName: 'สาขาทองหล่อ',
    referenceType: 'GROOMING_QUEUE: #Q04',
    user: 'ช่างเอก',
  },
  {
    id: 'tx-003',
    createdAt: '25 ส.ค. 2026 09:45 น.',
    productName: 'แชมพูบำรุงขนสุนัข Hypoallergenic (300 ml)',
    sku: 'DOG-SHMP-300',
    type: 'IN',
    quantity: 20,
    branchName: 'สาขาทองหล่อ',
    referenceType: 'PURCHASE: PO-202608-019',
    user: 'ผู้จัดการสาขา',
  },
  {
    id: 'tx-004',
    createdAt: '24 ส.ค. 2026 16:20 น.',
    productName: 'ยาปฏิชีวนะรักษาแผลผิวหนังและตุ่มหนอง (14 เม็ด)',
    sku: 'MED-DERM-TAB',
    type: 'TRANSFER',
    quantity: -5,
    branchName: 'สาขาทองหล่อ → สาขาเอกมัย',
    referenceType: 'BRANCH_TRANSFER: TR-0041',
    user: 'ผู้จัดการสาขา',
  },
];

export default function InventoryManagementPage() {
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'TRANSACTIONS' | 'STOCK_TAKE'>('BALANCES');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  const [inventoryItems, setInventoryItems] = useState<InventoryItemDisplay[]>(INITIAL_INVENTORY_ITEMS);
  const [transactionLogs, setTransactionLogs] = useState<InventoryTransactionLog[]>(INITIAL_TRANSACTION_LOGS);

  // Modals state
  const [isStockInModalOpen, setIsStockInModalOpen] = useState<boolean>(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItemDisplay | null>(null);

  // Form Inputs
  const [opQuantity, setOpQuantity] = useState<number>(1);
  const [opReference, setOpReference] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>('สาขาเอกมัย');
  const [stockTakeActual, setStockTakeActual] = useState<number>(0);

  // KPI Calculations
  const kpiSummary = useMemo(() => {
    const totalItems = inventoryItems.length;
    const inStock = inventoryItems.filter((i) => i.stockStatus === 'IN_STOCK').length;
    const lowStock = inventoryItems.filter((i) => i.stockStatus === 'LOW_STOCK').length;
    const outOfStock = inventoryItems.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;
    const totalValuationMinor = inventoryItems.reduce(
      (acc, item) => acc + item.costMinor * item.currentStock,
      0
    );

    return {
      totalItems,
      inStock,
      lowStock,
      outOfStock,
      totalValuationMinor,
    };
  }, [inventoryItems]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (onlyLowStock && item.stockStatus === 'IN_STOCK') {
        return false;
      }
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventoryItems, selectedCategory, searchQuery, onlyLowStock]);

  // Handle Stock-In Action
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || opQuantity <= 0) return;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedProduct.id) {
          const newQty = item.currentStock + opQuantity;
          const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= item.reorderPoint ? 'LOW_STOCK' : 'IN_STOCK';
          return { ...item, currentStock: newQty, stockStatus: newStatus };
        }
        return item;
      })
    );

    setTransactionLogs((prev) => [
      {
        id: `tx-${Date.now()}`,
        createdAt: '25 ส.ค. 2026 16:15 น.',
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: 'IN',
        quantity: opQuantity,
        branchName: 'สาขาทองหล่อ',
        referenceType: opReference || 'PURCHASE / STOCK_IN',
        user: 'ผู้จัดการสาขา',
      },
      ...prev,
    ]);

    setIsStockInModalOpen(false);
    setOpQuantity(1);
    setOpReference('');
  };

  // Handle Consumption Action
  const handleConsumptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || opQuantity <= 0) return;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedProduct.id) {
          const newQty = Math.max(0, item.currentStock - opQuantity);
          const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= item.reorderPoint ? 'LOW_STOCK' : 'IN_STOCK';
          return { ...item, currentStock: newQty, stockStatus: newStatus };
        }
        return item;
      })
    );

    setTransactionLogs((prev) => [
      {
        id: `tx-${Date.now()}`,
        createdAt: '25 ส.ค. 2026 16:15 น.',
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: 'CONSUMPTION',
        quantity: -opQuantity,
        branchName: 'สาขาทองหล่อ',
        referenceType: opReference || 'GROOMING_USE / CLINICAL',
        user: 'สัตวแพทย์ / ช่างกรูมมิ่ง',
      },
      ...prev,
    ]);

    setIsConsumptionModalOpen(false);
    setOpQuantity(1);
    setOpReference('');
  };

  // Handle Transfer Action
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || opQuantity <= 0) return;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedProduct.id) {
          const newQty = Math.max(0, item.currentStock - opQuantity);
          const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= item.reorderPoint ? 'LOW_STOCK' : 'IN_STOCK';
          return { ...item, currentStock: newQty, stockStatus: newStatus };
        }
        return item;
      })
    );

    setTransactionLogs((prev) => [
      {
        id: `tx-${Date.now()}`,
        createdAt: '25 ส.ค. 2026 16:15 น.',
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: 'TRANSFER',
        quantity: -opQuantity,
        branchName: `สาขาทองหล่อ → ${targetBranch}`,
        referenceType: opReference || 'BRANCH_TRANSFER',
        user: 'ผู้จัดการสาขา',
      },
      ...prev,
    ]);

    setIsTransferModalOpen(false);
    setOpQuantity(1);
    setOpReference('');
  };

  // Handle Stock-Take Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const delta = stockTakeActual - selectedProduct.currentStock;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedProduct.id) {
          const newQty = stockTakeActual;
          const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= item.reorderPoint ? 'LOW_STOCK' : 'IN_STOCK';
          return { ...item, currentStock: newQty, stockStatus: newStatus };
        }
        return item;
      })
    );

    setTransactionLogs((prev) => [
      {
        id: `tx-${Date.now()}`,
        createdAt: '25 ส.ค. 2026 16:15 น.',
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: 'ADJUSTMENT',
        quantity: delta,
        branchName: 'สาขาทองหล่อ',
        referenceType: `STOCK_TAKE: นับได้จริง ${stockTakeActual} ${selectedProduct.unit}`,
        user: 'ผู้ตรวจนับสต็อก',
      },
      ...prev,
    ]);

    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Bar with Branch Selector & Top Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  คลังสินค้า ยา & เวชภัณฑ์ (Inventory)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#0071e3] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  สาขาทองหล่อ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ติดตามยอดคงเหลือ สต็อกการใช้ในคลินิกและกรูมมิ่ง แจ้งเตือนสินค้าใกล้หมด และบันทึกการเคลื่อนไหวแบบ Immutable Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('BALANCES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BALANCES'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            สต็อกคงเหลือ (Stock Balances)
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            ประวัติการเคลื่อนไหว (Ledger)
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>รายการสินค้าทั้งหมด</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpiSummary.totalItems} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>สต็อกปกติ พร้อมจำหน่าย</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {kpiSummary.inStock} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-3xl border transition cursor-pointer shadow-apple ${
            onlyLowStock
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-medium">
            <span>สินค้าใกล้หมด (Low Stock)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {kpiSummary.lowStock} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>สินค้าหมด (Out of Stock)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {kpiSummary.outOfStock} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900 shadow-apple col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#0071e3] text-xs font-bold">
            <span>มูลค่าสต็อกรวม (ต้นทุน)</span>
            <ShoppingBag className="w-4 h-4 text-[#0071e3]" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {(kpiSummary.totalValuationMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </p>
        </div>
      </div>

      {activeTab === 'BALANCES' ? (
        /* 3. STOCK BALANCES VIEW & CONTROLS */
        <div className="space-y-4">
          {/* Controls: Search, Category Chips & Quick Action Buttons */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อสินค้า, SKU, บาร์โค้ด..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'ทั้งหมด', icon: Package },
                  { id: 'GROOMING_SUPPLY', label: 'กรูมมิ่ง', icon: Scissors },
                  { id: 'MEDICATION', label: 'ยา', icon: Stethoscope },
                  { id: 'VACCINE', label: 'วัคซีน', icon: Syringe },
                  { id: 'PETSHOP', label: 'เพ็ทช็อป', icon: ShoppingBag },
                  { id: 'SPA', label: 'สปา', icon: Sparkles },
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        selectedCategory === cat.id
                          ? 'bg-[#0071e3] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Header Action Trigger */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setSelectedProduct(inventoryItems[0]);
                  setOpQuantity(10);
                  setIsStockInModalOpen(true);
                }}
                className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-apple"
              >
                <ArrowDownToLine className="w-4 h-4" />
                รับสินค้าเข้า (Stock-In)
              </Button>
            </div>
          </div>

          {/* Stock Balances Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3 px-4">รหัส SKU & บาร์โค้ด</th>
                    <th className="py-3 px-4">ชื่อสินค้า & หมวดหมู่</th>
                    <th className="py-3 px-4">หน่วย</th>
                    <th className="py-3 px-4 text-right">ต้นทุน (Cost)</th>
                    <th className="py-3 px-4 text-right">ราคาขาย</th>
                    <th className="py-3 px-4 text-center">จุดสั่งซื้อ (Min)</th>
                    <th className="py-3 px-4 text-center">สต็อกคงเหลือ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการด่วน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {item.sku}
                        </span>
                        {item.barcode && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            {item.barcode}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white block">
                            {item.name}
                          </strong>
                          {item.isPrescriptionOnly && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                              Rx ยาควบคุม
                            </span>
                          )}
                          {item.taxRate === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                              VAT 0%
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{item.category}</span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {item.unit}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {(item.costMinor / 100).toFixed(2)} ฿
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {(item.salePriceMinor / 100).toFixed(2)} ฿
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {item.reorderPoint} {item.unit}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm font-black font-mono ${
                            item.stockStatus === 'OUT_OF_STOCK'
                              ? 'text-rose-600'
                              : item.stockStatus === 'LOW_STOCK'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{item.unit}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stockStatus === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.stockStatus === 'LOW_STOCK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.stockStatus === 'IN_STOCK'
                            ? 'พร้อมจำหน่าย'
                            : item.stockStatus === 'LOW_STOCK'
                              ? 'ใกล้หมด'
                              : 'สินค้าหมด'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock-In Button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setOpQuantity(5);
                              setIsStockInModalOpen(true);
                            }}
                            title="รับสินค้าเข้า"
                            className="p-1.5 rounded-lg bg-blue-50 text-[#0071e3] hover:bg-blue-100 font-bold transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Consumption Button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setOpQuantity(1);
                              setIsConsumptionModalOpen(true);
                            }}
                            title="ตัดใช้คลินิก/กรูมมิ่ง"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition cursor-pointer"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Transfer Button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setOpQuantity(1);
                              setIsTransferModalOpen(true);
                            }}
                            title="โอนย้ายสาขา"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock-Take Adjust Button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setStockTakeActual(item.currentStock);
                              setIsAdjustModalOpen(true);
                            }}
                            title="ปรับปรุงยอดนับจริง"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 4. TRANSACTIONS AUDIT LOG VIEW */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#0071e3]" />
              บันทึกประวัติการเคลื่อนไหวสต็อก (Immutable Transaction Ledger)
            </h3>
            <span className="text-xs text-slate-400">ตรวจสอบย้อนหลังได้ 100%</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">วันและเวลา</th>
                  <th className="py-3 px-4">รายการสินค้า</th>
                  <th className="py-3 px-4">ประเภทการเคลื่อนไหว</th>
                  <th className="py-3 px-4 text-center">จำนวน</th>
                  <th className="py-3 px-4">สาขา / เส้นทาง</th>
                  <th className="py-3 px-4">เอกสารอ้างอิง</th>
                  <th className="py-3 px-4 text-right">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400">{log.createdAt}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 dark:text-white block">{log.productName}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{log.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'OUT'
                              ? 'bg-blue-100 text-blue-800'
                              : log.type === 'CONSUMPTION'
                                ? 'bg-purple-100 text-purple-800'
                                : log.type === 'TRANSFER'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                      <span className={log.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {log.branchName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.referenceType}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ACTION MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Stock-In */}
      {isStockInModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-[#0071e3]" />
                รับสินค้าเข้าคลัง (Stock-In)
              </h3>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                <strong className="text-xs text-slate-900 dark:text-white block">{selectedProduct.name}</strong>
                <span className="text-[11px] text-slate-500 font-mono">
                  SKU: {selectedProduct.sku} • สต็อกปัจจุบัน: {selectedProduct.currentStock} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  จำนวนที่รับเข้า ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={opQuantity}
                  onChange={(e) => setOpQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  เลขอ้างอิงใบสั่งซื้อ / ใบส่งของ (PO / Invoice Ref)
                </label>
                <input
                  type="text"
                  value={opReference}
                  onChange={(e) => setOpReference(e.target.value)}
                  placeholder="เช่น PO-202608-019 หรือ บิลเงินสด"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-apple"
                >
                  ยืนยันรับเข้า ({opQuantity} {selectedProduct.unit})
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Clinical / Grooming Consumption */}
      {isConsumptionModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                ตัดใช้ภายในคลินิก / กรูมมิ่ง (Consumption)
              </h3>
              <button
                onClick={() => setIsConsumptionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                <strong className="text-xs text-slate-900 dark:text-white block">{selectedProduct.name}</strong>
                <span className="text-[11px] text-slate-500 font-mono">
                  สต็อกคงเหลือ: {selectedProduct.currentStock} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  จำนวนที่เบิกใช้ ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.currentStock}
                  value={opQuantity}
                  onChange={(e) => setOpQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  อ้างอิงคิวกรูมมิ่ง / เคสการรักษา
                </label>
                <input
                  type="text"
                  value={opReference}
                  onChange={(e) => setOpReference(e.target.value)}
                  placeholder="เช่น คิวกรูมมิ่ง #Q06 หรือ ทำแผลน้องโมจิ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConsumptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
                >
                  ยืนยันตัดใช้
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Inter-branch Transfer */}
      {isTransferModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                โอนย้ายสต็อกระหว่างสาขา (Transfer)
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200">
                <strong className="text-xs text-slate-900 dark:text-white block">{selectedProduct.name}</strong>
                <span className="text-[11px] text-slate-500">
                  ต้นทาง: <strong>สาขาทองหล่อ</strong> (คงเหลือ {selectedProduct.currentStock} {selectedProduct.unit})
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  สาขาปลายทาง
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="สาขาเอกมัย">สาขาเอกมัย</option>
                  <option value="สาขาอารีย์">สาขาอารีย์</option>
                  <option value="คลังสินค้ากลาง (Central Warehouse)">คลังสินค้ากลาง (Central Warehouse)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  จำนวนที่โอนย้าย ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.currentStock}
                  value={opQuantity}
                  onChange={(e) => setOpQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
                >
                  ยืนยันโอนย้าย ({opQuantity} {selectedProduct.unit})
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Stock-Take Adjustment */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                ปรับปรุงยอดจากการตรวจนับจริง (Stock-Take)
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 space-y-1">
                <strong className="text-xs text-slate-900 dark:text-white block">{selectedProduct.name}</strong>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>ยอดคงเหลือในระบบ:</span>
                  <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ยอดที่ตรวจนับได้จริงหน้าร้าน ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockTakeActual}
                  onChange={(e) => setStockTakeActual(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base font-black focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  required
                />
              </div>

              {/* Delta preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">ผลต่างการปรับปรุง (Delta):</span>
                <strong
                  className={`text-sm font-mono font-bold ${
                    stockTakeActual - selectedProduct.currentStock > 0
                      ? 'text-emerald-600'
                      : stockTakeActual - selectedProduct.currentStock < 0
                        ? 'text-rose-600'
                        : 'text-slate-500'
                  }`}
                >
                  {stockTakeActual - selectedProduct.currentStock > 0
                    ? `+${stockTakeActual - selectedProduct.currentStock}`
                    : stockTakeActual - selectedProduct.currentStock}{' '}
                  {selectedProduct.unit}
                </strong>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
                >
                  บันทึกยอดนับจริง
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

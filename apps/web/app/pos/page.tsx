'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Dog,
  Cat,
  Receipt,
  QrCode,
  Banknote,
  Building2,
  CheckCircle2,
  X,
  ShoppingBag,
  Printer,
  Tag,
  ArrowRight,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@petflow/ui';
import { PaymentMethodType } from '@petflow/types';
import { ReceiptModal, ReceiptData, defaultMockReceiptData } from '@/components/pos/receipt-modal';

export interface PosCatalogItem {
  id: string;
  name: string;
  category: 'GROOMING' | 'CLINIC' | 'VACCINE' | 'PETSHOP' | 'SPA';
  itemType: 'SERVICE' | 'PRODUCT' | 'MEDICATION';
  priceMinor: number; // satang
  description?: string;
  taxRate: number; // 7.00 or 0
  stock?: number;
}

export interface PosCartItem {
  id: string;
  catalogItemId: string;
  name: string;
  itemType: 'SERVICE' | 'PRODUCT' | 'MEDICATION';
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
  petName?: string;
  staffName?: string;
  commissionRate?: number; // percentage, e.g. 15%
}

export interface PetProfileChoice {
  id: string;
  name: string;
  species: 'DOG' | 'CAT';
  breed: string;
}

export interface CustomerProfileOption {
  id: string;
  name: string;
  phone: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed: string;
  pets: PetProfileChoice[];
}

export interface PosStaffOption {
  id: string;
  name: string;
  role: string;
  commissionRate: number;
}

export const POS_STAFF_OPTIONS: PosStaffOption[] = [
  { id: 'st-1', name: 'ช่างเอก (Groomer)', role: 'ช่างกรูมมิ่ง', commissionRate: 15 },
  { id: 'st-2', name: 'ช่างแนน (Groomer)', role: 'ช่างกรูมมิ่ง', commissionRate: 15 },
  { id: 'st-3', name: 'น.สพ. วรวิทย์ (หมอวิทย์ OPD)', role: 'สัตวแพทย์', commissionRate: 10 },
  { id: 'st-4', name: 'น้องฝน (Reception & Cashier)', role: 'แคชเชียร์ & ต้อนรับ', commissionRate: 2 },
];

const CATALOG_ITEMS: PosCatalogItem[] = [
  // 1. Grooming
  {
    id: 'cat-01',
    name: 'อาบน้ำตัดขน สุนัขพันธุ์เล็ก (ไม่เกิน 5 กก.)',
    category: 'GROOMING',
    itemType: 'SERVICE',
    priceMinor: 55000,
    taxRate: 7.0,
    description: 'อาบน้ำอุ่น ตัดเล็บ เช็ดหู ไถอุ้งเท้า ตัดแต่งทรงขน',
  },
  {
    id: 'cat-02',
    name: 'อาบน้ำตัดขน สุนัขพันธุ์กลาง (5 - 15 กก.)',
    category: 'GROOMING',
    itemType: 'SERVICE',
    priceMinor: 75000,
    taxRate: 7.0,
    description: 'อาบน้ำ ไดร์เป่าขน สางสังกะตัง ตัดแต่งทรงขนตามมาตรฐาน',
  },
  {
    id: 'cat-03',
    name: 'อาบน้ำ สุนัขพันธุ์ใหญ่ (15 กก. ขึ้นไป)',
    category: 'GROOMING',
    itemType: 'SERVICE',
    priceMinor: 85000,
    taxRate: 7.0,
    description: 'อาบน้ำฟองละเอียด เป่าแห้งสนิท สางขนผลัด',
  },
  {
    id: 'cat-04',
    name: 'อาบน้ำสปาโอโซนแมวขนสั้น + ตัดเล็บ',
    category: 'GROOMING',
    itemType: 'SERVICE',
    priceMinor: 45000,
    taxRate: 7.0,
    description: 'ฟองโอโซนขจัดกลิ่น อ่อนโยนต่อผิวแมว',
  },

  // 2. Clinic & Medications
  {
    id: 'cat-05',
    name: 'ค่าตรวจสุขภาพทั่วไปโดยสัตวแพทย์',
    category: 'CLINIC',
    itemType: 'SERVICE',
    priceMinor: 30000,
    taxRate: 7.0,
    description: 'ตรวจร่างกายทั่วไป ชั่งน้ำหนัก ตรวจตา หู ฟังเสียงหัวใจ',
  },
  {
    id: 'cat-06',
    name: 'ยาปฏิชีวนะรักษาแผลผิวหนัง (ยกเว้น VAT)',
    category: 'CLINIC',
    itemType: 'MEDICATION',
    priceMinor: 28000,
    taxRate: 0.0,
    description: 'ยาเม็ดสำหรับสัตว์เลี้ยง 14 วัน (Tax-Exempt 0%)',
  },
  {
    id: 'cat-07',
    name: 'ตรวจเลือด Complete Blood Count (CBC)',
    category: 'CLINIC',
    itemType: 'SERVICE',
    priceMinor: 60000,
    taxRate: 7.0,
    description: 'ตรวจความสมบูรณ์ของเม็ดเลือดและเกล็ดเลือด',
  },

  // 3. Vaccines
  {
    id: 'cat-08',
    name: 'วัคซีนรวมสุนัข 5 โรค + พิษสุนัขบ้า',
    category: 'VACCINE',
    itemType: 'SERVICE',
    priceMinor: 45000,
    taxRate: 7.0,
    description: 'พร้อมสมุดบันทึกวัคซีนและสติกเกอร์ล็อตยา',
  },
  {
    id: 'cat-09',
    name: 'วัคซีนรวมแมว 3 โรค + พิษสุนัขบ้า',
    category: 'VACCINE',
    itemType: 'SERVICE',
    priceMinor: 40000,
    taxRate: 7.0,
    description: 'ป้องกันโรคไข้หัด หวัดแมว และลิวคีเมีย',
  },

  // 4. Pet Shop & Retail
  {
    id: 'cat-10',
    name: 'แชมพูบำรุงขนสุนัข Hypoallergenic (300 ml)',
    category: 'PETSHOP',
    itemType: 'PRODUCT',
    priceMinor: 35000,
    taxRate: 7.0,
    description: 'แชมพูสูตรอ่อนโยนสำหรับผิวแพ้ง่าย',
    stock: 24,
  },
  {
    id: 'cat-11',
    name: 'ขนมขบเคี้ยวขัดฟันสุนัข กลิ่นเนื้อรมควัน',
    category: 'PETSHOP',
    itemType: 'PRODUCT',
    priceMinor: 15000,
    taxRate: 7.0,
    description: 'ช่วยลดคราบหินปูน กลิ่นปากหอมสดชื่น',
    stock: 45,
  },
  {
    id: 'cat-12',
    name: 'สเปรย์ดับกลิ่นและบำรุงขนกลิ่นลาเวนเดอร์',
    category: 'SPA',
    itemType: 'PRODUCT',
    priceMinor: 22000,
    taxRate: 7.0,
    description: 'ช่วยให้ขนนุ่มลื่น หวีง่าย ไม่พันกัน',
    stock: 18,
  },
];

const CUSTOMER_OPTIONS: CustomerProfileOption[] = [
  {
    id: 'c-01',
    name: 'คุณสุภาพร ใจดี',
    phone: '081-234-5678',
    petName: 'น้องโมจิ',
    petSpecies: 'DOG',
    petBreed: 'ปอมเมอเรเนียน',
    pets: [
      { id: 'p-01', name: 'น้องโมจิ', species: 'DOG', breed: 'ปอมเมอเรเนียน' },
      { id: 'p-02', name: 'น้องถ้วยฟู', species: 'DOG', breed: 'บิชอง ฟริเซ่' },
    ],
  },
  {
    id: 'c-02',
    name: 'คุณวิชัย รัตนศิลป์',
    phone: '089-876-5432',
    petName: 'น้องบะหมี่',
    petSpecies: 'DOG',
    petBreed: 'พุดเดิ้ล ทอย',
    pets: [
      { id: 'p-03', name: 'น้องบะหมี่', species: 'DOG', breed: 'พุดเดิ้ล ทอย' },
    ],
  },
  {
    id: 'c-03',
    name: 'คุณณัฐพล เกียรติสกุล',
    phone: '086-555-1234',
    petName: 'น้องส้มตำ',
    petSpecies: 'CAT',
    petBreed: 'สก็อตติช โฟลด์',
    pets: [
      { id: 'p-04', name: 'น้องส้มตำ', species: 'CAT', breed: 'สก็อตติช โฟลด์' },
      { id: 'p-05', name: 'น้องชาเขียว', species: 'CAT', breed: 'บริติช ช็อตแฮร์' },
    ],
  },
  {
    id: 'c-04',
    name: 'คุณอรทัย สิทธิชัย',
    phone: '084-777-6655',
    petName: 'น้องไข่ตุ๋น',
    petSpecies: 'DOG',
    petBreed: 'ชิสุ',
    pets: [
      { id: 'p-06', name: 'น้องไข่ตุ๋น', species: 'DOG', breed: 'ชิสุ' },
    ],
  },
];

export default function PosCashierPage() {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'INVOICES'>('REGISTER');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchCatalogQuery, setSearchCatalogQuery] = useState<string>('');

  // Active Cart State
  const [cart, setCart] = useState<PosCartItem[]>([
    {
      id: 'cart-01',
      catalogItemId: 'cat-01',
      name: 'อาบน้ำตัดขน สุนัขพันธุ์เล็ก (ไม่เกิน 5 กก.)',
      itemType: 'SERVICE',
      quantity: 1,
      unitPriceMinor: 55000,
      discountMinor: 0,
      taxRate: 7.0,
      staffName: 'ช่างเอก',
    },
    {
      id: 'cart-02',
      catalogItemId: 'cat-11',
      name: 'ขนมขบเคี้ยวขัดฟันสุนัข กลิ่นเนื้อรมควัน',
      itemType: 'PRODUCT',
      quantity: 2,
      unitPriceMinor: 15000,
      discountMinor: 0,
      taxRate: 7.0,
    },
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileOption | null>(
    CUSTOMER_OPTIONS[0]
  );
  const [invoiceDiscountMinor, setInvoiceDiscountMinor] = useState<number>(0);
  const [discountCode, setDiscountCode] = useState<string>('');

  // Pending Clinical OPD Order State (Item 5)
  const [pendingClinicalBill, setPendingClinicalBill] = useState<{
    doctorName: string;
    patientName: string;
    customerName: string;
    customerId: string;
    diagnosis: string;
    items: PosCartItem[];
  } | null>({
    doctorName: 'น.สพ. วรวิทย์ (หมอวิทย์ OPD)',
    patientName: 'น้องโมจิ (ปอมเมอเรเนียน)',
    customerName: 'คุณสุภาพร ใจดี',
    customerId: 'c-01',
    diagnosis: 'ตรวจโรคผิวหนังอักเสบ + สั่งจ่ายยารักษา',
    items: [
      {
        id: 'clin-01',
        catalogItemId: 'cat-05',
        name: '[OPD] ค่าตรวจสุขภาพทั่วไปโดยสัตวแพทย์',
        itemType: 'SERVICE',
        quantity: 1,
        unitPriceMinor: 30000,
        discountMinor: 0,
        taxRate: 7.0,
        petName: 'น้องโมจิ',
        staffName: 'น.สพ. วรวิทย์ (หมอวิทย์ OPD)',
        commissionRate: 10,
      },
      {
        id: 'clin-02',
        catalogItemId: 'cat-06',
        name: '[OPD] ยาปฏิชีวนะรักษาแผลผิวหนัง (14 เม็ด)',
        itemType: 'MEDICATION',
        quantity: 1,
        unitPriceMinor: 28000,
        discountMinor: 0,
        taxRate: 0.0,
        petName: 'น้องโมจิ',
        staffName: 'น.สพ. วรวิทย์ (หมอวิทย์ OPD)',
        commissionRate: 5,
      },
    ],
  });

  // Payment Checkout Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodType>('PROMPTPAY');
  const [cashTendered, setCashTendered] = useState<string>('1000');
  const paymentReference = 'PP-20260825-44910';
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [completedInvoiceNo, setCompletedInvoiceNo] = useState<string>('INV-202608-0008');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [activeReceiptData, setActiveReceiptData] = useState<ReceiptData | null>(null);

  // Split Payment State (Item 7)
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitMethod1, setSplitMethod1] = useState<PaymentMethodType>('CASH');
  const [splitAmount1, setSplitAmount1] = useState<string>('500');
  const [splitMethod2, setSplitMethod2] = useState<PaymentMethodType>('PROMPTPAY');

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return CATALOG_ITEMS.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchCatalogQuery.trim()) {
        const q = searchCatalogQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchCatalogQuery]);

  // Financial Calculations (Satang Precision)
  const financialTotals = useMemo(() => {
    // 1. Raw Subtotal
    const rawSubtotalMinor = cart.reduce(
      (acc, item) => acc + item.unitPriceMinor * item.quantity,
      0
    );

    // 2. Item Discounts
    const itemDiscountMinor = cart.reduce(
      (acc, item) => acc + item.discountMinor * item.quantity,
      0
    );

    // 3. Subtotal after item discounts
    const subtotalMinor = Math.max(0, rawSubtotalMinor - itemDiscountMinor);

    // 4. Invoice Discount
    const totalDiscountMinor = itemDiscountMinor + invoiceDiscountMinor;
    const netTaxableSubtotal = Math.max(0, subtotalMinor - invoiceDiscountMinor);

    // 5. VAT 7% Calculation
    const taxMinor = Math.round((netTaxableSubtotal * 7.0) / 100);

    // 6. Total Payable
    const totalMinor = netTaxableSubtotal + taxMinor;

    // 7. Staff Commission Calculation (Item 3)
    const totalCommissionMinor = cart.reduce((acc, item) => {
      const itemSubtotal = item.unitPriceMinor * item.quantity;
      const rate = item.commissionRate || (item.staffName?.includes('ช่าง') ? 15 : item.staffName?.includes('หมอ') ? 10 : 0);
      return acc + Math.round((itemSubtotal * rate) / 100);
    }, 0);

    return {
      rawSubtotalMinor,
      itemDiscountMinor,
      subtotalMinor,
      invoiceDiscountMinor,
      totalDiscountMinor,
      netTaxableSubtotal,
      taxMinor,
      totalMinor,
      totalCommissionMinor,
    };
  }, [cart, invoiceDiscountMinor]);

  // Cash Change Calculation
  const cashChangeMinor = useMemo(() => {
    const tendered = parseFloat(cashTendered) * 100 || 0;
    return Math.max(0, tendered - financialTotals.totalMinor);
  }, [cashTendered, financialTotals.totalMinor]);

  // Add Item to Cart
  const handleAddToCart = (catalogItem: PosCatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.catalogItemId === catalogItem.id);
      if (existing) {
        return prev.map((i) =>
          i.catalogItemId === catalogItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}`,
          catalogItemId: catalogItem.id,
          name: catalogItem.name,
          itemType: catalogItem.itemType,
          quantity: 1,
          unitPriceMinor: catalogItem.priceMinor,
          discountMinor: 0,
          taxRate: catalogItem.taxRate,
          petName: selectedCustomer ? selectedCustomer.petName : undefined,
          staffName: catalogItem.category === 'GROOMING' ? 'ช่างเอก (Groomer)' : 'หมอวิทย์ (OPD)',
          commissionRate: catalogItem.category === 'GROOMING' ? 15 : 10,
        },
      ];
    });
  };

  // Update Item Pet assignment (Item 4)
  const handleUpdateItemPet = (cartItemId: string, petName: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, petName } : i))
    );
  };

  // Update Item Staff assignment & Commission (Item 3)
  const handleUpdateItemStaff = (cartItemId: string, staffName: string, commissionRate: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, staffName, commissionRate } : i))
    );
  };

  // Import Pending Clinical Bill (Item 5)
  const handleImportClinicalBill = () => {
    if (!pendingClinicalBill) return;
    const targetCust = CUSTOMER_OPTIONS.find((c) => c.id === pendingClinicalBill.customerId);
    if (targetCust) {
      setSelectedCustomer(targetCust);
    }
    setCart((prev) => [...prev, ...pendingClinicalBill.items]);
    setPendingClinicalBill(null);
  };

  // Deduct Inventory Stock in Real-time (Item 1)
  const handleDeductInventoryStock = (soldItems: PosCartItem[], invNo: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('petflow_inventory_items');
      let items = raw ? JSON.parse(raw) : null;
      if (items && Array.isArray(items)) {
        soldItems.forEach((sold) => {
          if (sold.itemType === 'PRODUCT' || sold.itemType === 'MEDICATION') {
            const idx = items.findIndex(
              (inv: any) =>
                inv.name.toLowerCase().includes(sold.name.toLowerCase().slice(0, 8)) ||
                inv.id === sold.catalogItemId
            );
            if (idx !== -1) {
              items[idx].currentStock = Math.max(0, items[idx].currentStock - sold.quantity);
              if (items[idx].currentStock === 0) {
                items[idx].stockStatus = 'OUT_OF_STOCK';
              } else if (items[idx].currentStock <= items[idx].reorderPoint) {
                items[idx].stockStatus = 'LOW_STOCK';
              }
            }
          }
        });
        localStorage.setItem('petflow_inventory_items', JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to deduct inventory stock', e);
    }
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  // Remove Item
  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  // Apply Coupon Discount
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountCode.toUpperCase() === 'VIP50') {
      setInvoiceDiscountMinor(5000); // 50.00 THB
    } else if (discountCode.toUpperCase() === 'PROMO100') {
      setInvoiceDiscountMinor(10000); // 100.00 THB
    } else {
      setInvoiceDiscountMinor(0);
    }
  };

  // Quick Queue Import
  const handleImportQueueItem = (qCode: string, name: string, price: number) => {
    setCart((prev) => [
      ...prev,
      {
        id: `cart-${Date.now()}`,
        catalogItemId: 'cat-01',
        name: `[คิว #${qCode}] อาบน้ำตัดขน (${name})`,
        itemType: 'SERVICE',
        quantity: 1,
        unitPriceMinor: price * 100,
        discountMinor: 0,
        taxRate: 7.0,
        petName: name,
        staffName: 'ช่างแนน (Groomer)',
        commissionRate: 15,
      },
    ]);
  };

  // Finalize Payment
  const handleCompletePayment = () => {
    const nextInvoiceNo = `INV-202608-00${Math.floor(Math.random() * 90 + 10)}`;
    setCompletedInvoiceNo(nextInvoiceNo);
    handleDeductInventoryStock(cart, nextInvoiceNo);
    setIsPaymentSuccess(true);
  };

  const handlePrintCurrentReceipt = () => {
    const splitDetails = isSplitPayment
      ? {
          method1: splitMethod1 === 'CASH' ? 'เงินสด' : splitMethod1,
          amount1: parseFloat(splitAmount1) || 0,
          method2: splitMethod2 === 'PROMPTPAY' ? 'PromptPay' : splitMethod2,
          amount2: Math.max(0, financialTotals.totalMinor / 100 - (parseFloat(splitAmount1) || 0)),
        }
      : undefined;

    setActiveReceiptData({
      ...defaultMockReceiptData,
      invoiceNo: completedInvoiceNo,
      customerName: selectedCustomer ? selectedCustomer.name : 'ลูกค้าทั่วไป',
      customerPhone: selectedCustomer ? selectedCustomer.phone : '-',
      petName: selectedCustomer ? selectedCustomer.petName : '-',
      petBreed: selectedCustomer ? selectedCustomer.petBreed : '-',
      items: cart.map((i) => ({
        description: i.petName ? `[${i.petName}] ${i.name}` : i.name,
        quantity: i.quantity,
        unitPrice: i.unitPriceMinor / 100,
        discount: i.discountMinor / 100,
        total: (i.unitPriceMinor * i.quantity - i.discountMinor) / 100,
        taxRate: i.taxRate,
        petName: i.petName,
        staffName: i.staffName,
      })),
      subtotal: financialTotals.subtotalMinor / 100,
      discount: financialTotals.totalDiscountMinor / 100,
      netTaxable: financialTotals.netTaxableSubtotal / 100,
      tax: financialTotals.taxMinor / 100,
      total: financialTotals.totalMinor / 100,
      paymentMethod: isSplitPayment ? 'SPLIT (แบ่งชำระ)' : selectedPaymentMethod,
      splitDetails,
      receivedAmount: isSplitPayment
        ? financialTotals.totalMinor / 100
        : selectedPaymentMethod === 'CASH'
          ? parseFloat(cashTendered) || financialTotals.totalMinor / 100
          : financialTotals.totalMinor / 100,
      change: isSplitPayment ? 0 : cashChangeMinor / 100,
      reference: isSplitPayment ? `SPLIT-${Date.now().toString().slice(-6)}` : paymentReference,
    });
    setIsReceiptModalOpen(true);
  };

  // Reset Cart for Next Transaction
  const handleNewSale = () => {
    setCart([]);
    setIsPaymentSuccess(false);
    setIsPaymentModalOpen(false);
    setInvoiceDiscountMinor(0);
    setDiscountCode('');
    setCashTendered('1000');
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Bar with Tabs & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0058b8] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  จุดขายหน้าร้าน & ออกใบเสร็จ (POS)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#0071e3]">
                  สาขาทองหล่อ (แคชเชียร์ 01)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                รองรับการคิดเงินค่าตรวจรักษา ค่ายา กรูมมิ่ง สินค้าเพ็ทช็อป พร้อมเงินทอนและ PromptPay QR
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REGISTER'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            เครื่องคิดเงิน (Register)
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INVOICES'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            ประวัติใบเสร็จ & บิลค้างชำระ
          </button>
        </div>
      </div>

      {activeTab === 'REGISTER' ? (
        /* 2. DUAL-PANE POS CASHIER INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: Product & Service Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Import Banners: Clinical OPD Orders & Grooming Queue */}
            <div className="space-y-2.5">
              {pendingClinicalBill && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/40 border border-teal-200/90 dark:border-teal-800 flex items-center justify-between gap-3 text-xs shadow-apple">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                    <span>🏥 ใบสั่งยา/ส่งตรวจจาก <strong>{pendingClinicalBill.doctorName}</strong>: {pendingClinicalBill.patientName} ({pendingClinicalBill.diagnosis})</span>
                  </div>
                  <button
                    onClick={handleImportClinicalBill}
                    className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <span>ดึงเข้าบิลชำระเงิน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Queue Import Alert Bar */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between gap-3 text-xs shadow-apple">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>✂️ มีคิวกรูมมิ่งพร้อมชำระเงิน: <strong>#Q06 (น้องไข่ตุ๋น)</strong></span>
                </div>
                <button
                  onClick={() => handleImportQueueItem('Q06', 'น้องไข่ตุ๋น', 450)}
                  className="px-3 py-1 rounded-xl bg-[#0071e3] text-white hover:bg-blue-700 font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>ดึงบิลเข้า POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Catalog Controls: Search & Category Chips */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchCatalogQuery}
                  onChange={(e) => setSearchCatalogQuery(e.target.value)}
                  placeholder="ค้นหาบริการ, ยา, แชมพู, อาหารสัตว์, หรือสแกนบาร์โค้ด..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'ทั้งหมด (All)' },
                  { id: 'GROOMING', label: '✂️ กรูมมิ่ง' },
                  { id: 'CLINIC', label: '🏥 คลินิก & ยา' },
                  { id: 'VACCINE', label: '💉 วัคซีน' },
                  { id: 'PETSHOP', label: '🛍️ เพ็ทช็อป' },
                  { id: 'SPA', label: '🧴 สปา' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#0071e3] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3] transition-all cursor-pointer shadow-apple hover:shadow-md flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          item.category === 'GROOMING'
                            ? 'bg-blue-100 text-[#0071e3]'
                            : item.category === 'CLINIC'
                              ? 'bg-teal-100 text-teal-700'
                              : item.category === 'VACCINE'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.category}
                      </span>

                      {item.taxRate === 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                          VAT 0%
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2 group-hover:text-[#0071e3] transition line-clamp-2">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {(item.priceMinor / 100).toLocaleString('th-TH')} ฿
                    </span>
                    <button className="w-7 h-7 rounded-xl bg-blue-50 group-hover:bg-[#0071e3] text-[#0071e3] group-hover:text-white flex items-center justify-center transition">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANE: Cart & Checkout Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer & Pet Selection Card */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#0071e3]" />
                  ลูกค้า & สัตว์เลี้ยงประจำบิล
                </span>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[11px] font-bold text-[#0071e3] hover:underline"
                >
                  {selectedCustomer ? 'เปลี่ยนเป็น Walk-in' : 'เลือกลูกค้า'}
                </button>
              </div>

              {selectedCustomer ? (
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 text-[#0071e3] flex items-center justify-center">
                      {selectedCustomer.petSpecies === 'DOG' ? (
                        <Dog className="w-5 h-5" />
                      ) : (
                        <Cat className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 dark:text-white block">
                        {selectedCustomer.name}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {selectedCustomer.petName} ({selectedCustomer.petBreed}) • {selectedCustomer.phone}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs flex items-center justify-between">
                  <span>ลูกค้าทั่วไป (Walk-in Customer)</span>
                  <select
                    onChange={(e) => {
                      const found = CUSTOMER_OPTIONS.find((c) => c.id === e.target.value);
                      if (found) setSelectedCustomer(found);
                    }}
                    className="text-xs bg-white dark:bg-slate-700 border border-slate-300 rounded-lg p-1"
                  >
                    <option value="">เลือกลูกค้าในระบบ...</option>
                    {CUSTOMER_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.petName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Active Cart Box */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ตะกร้าสินค้า & บริการ</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} ชิ้น
                  </span>
                </h3>

                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ล้างตะกร้า
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-8 h-8 stroke-1 text-slate-300" />
                    <p className="text-xs">ยังไม่มีรายการในตะกร้า</p>
                    <span className="text-[11px] text-slate-400">
                      คลิกเลือกบริการหรือสินค้าจากเมนูด้านซ้าย
                    </span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            {(item.unitPriceMinor / 100).toLocaleString('th-TH')} ฿ / หน่วย
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-bold w-4 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Total Item Price */}
                        <div className="text-right min-w-[65px] shrink-0">
                          <span className="font-black text-slate-900 dark:text-white block text-xs">
                            {((item.unitPriceMinor * item.quantity) / 100).toLocaleString('th-TH')} ฿
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-[10px] text-rose-500 hover:underline"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>

                      {/* Multi-Pet & Staff Commission Controls (Item 3 & Item 4) */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        {/* Pet Selection */}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">🐾 สัตว์เลี้ยง:</span>
                          <select
                            value={item.petName || (selectedCustomer ? selectedCustomer.petName : 'ทั่วไป')}
                            onChange={(e) => handleUpdateItemPet(item.id, e.target.value)}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-200 font-semibold"
                          >
                            {selectedCustomer && selectedCustomer.pets.length > 0 ? (
                              selectedCustomer.pets.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name} ({p.breed})
                                </option>
                              ))
                            ) : (
                              <option value="ทั่วไป / ไม่ระบุ">ทั่วไป / ไม่ระบุ</option>
                            )}
                          </select>
                        </div>

                        {/* Staff Commission Selection */}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">👤 ช่าง/หมอ:</span>
                          <select
                            value={item.staffName || ''}
                            onChange={(e) => {
                              const foundSt = POS_STAFF_OPTIONS.find((s) => s.name === e.target.value);
                              handleUpdateItemStaff(item.id, e.target.value, foundSt ? foundSt.commissionRate : 10);
                            }}
                            className="bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5 text-[#0071e3] dark:text-blue-300 font-semibold"
                          >
                            {POS_STAFF_OPTIONS.map((st) => (
                              <option key={st.id} value={st.name}>
                                {st.name} ({st.commissionRate}%)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Coupon / Voucher Input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2 pt-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="ใส่โค้ดส่วนลด เช่น VIP50, PROMO100"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
                >
                  ใช้โค้ด
                </button>
              </form>

              {/* Financial Calculation Breakdown */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>ยอดรวม (Subtotal)</span>
                  <span>{(financialTotals.subtotalMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                </div>

                {financialTotals.invoiceDiscountMinor > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>ส่วนลดท้ายบิล</span>
                    <span>-{(financialTotals.invoiceDiscountMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7.00%)</span>
                  <span>{(financialTotals.taxMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                </div>

                {financialTotals.totalCommissionMinor > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold text-[11px] bg-blue-50/70 dark:bg-blue-950/40 p-1.5 rounded-lg">
                    <span>💰 ค่ามือ/คอมมิชชั่นพนักงานรวม</span>
                    <span>+{(financialTotals.totalCommissionMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    ยอดสุทธิ (Total)
                  </span>
                  <span className="text-2xl font-black text-[#0071e3]">
                    {(financialTotals.totalMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Button
                disabled={cart.length === 0}
                onClick={() => {
                  setIsPaymentSuccess(false);
                  setIsPaymentModalOpen(true);
                }}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold py-3.5 rounded-2xl shadow-apple text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                ชำระเงิน ({(financialTotals.totalMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. INVOICES & HISTORY LIST */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ประวัติใบเสร็จ & บิลประจำวัน
            </h3>
            <span className="text-xs text-slate-400">วันที่ 25 ส.ค. 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">เลขที่ใบเสร็จ</th>
                  <th className="py-3 px-4">ลูกค้า & สัตว์เลี้ยง</th>
                  <th className="py-3 px-4">วิธีชำระ</th>
                  <th className="py-3 px-4">ยอดเงิน</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  {
                    no: 'INV-202608-0007',
                    cust: 'คุณอรทัย สิทธิชัย',
                    pet: 'น้องไข่ตุ๋น',
                    method: 'PROMPTPAY',
                    total: '481.50',
                    status: 'PAID',
                    time: '14:20 น.',
                  },
                  {
                    no: 'INV-202608-0006',
                    cust: 'คุณณัฐพล เกียรติสกุล',
                    pet: 'น้องส้มตำ',
                    method: 'CASH',
                    total: '481.50',
                    status: 'PAID',
                    time: '13:45 น.',
                  },
                  {
                    no: 'INV-202608-0005',
                    cust: 'คุณวิชัย รัตนศิลป์',
                    pet: 'น้องบะหมี่',
                    method: 'CREDIT_CARD',
                    total: '535.00',
                    status: 'PAID',
                    time: '11:10 น.',
                  },
                  {
                    no: 'INV-202608-0004',
                    cust: 'คุณสุภาพร ใจดี',
                    pet: 'น้องโมจิ',
                    method: 'PROMPTPAY',
                    total: '588.50',
                    status: 'PAID',
                    time: '10:05 น.',
                  },
                ].map((row) => (
                  <tr key={row.no} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-[#0071e3]">{row.no}</td>
                    <td className="py-3 px-4">
                      <strong>{row.cust}</strong>
                      <span className="text-slate-400 block">({row.pet})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                        {row.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {row.total} ฿
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{row.time}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveReceiptData({
                            ...defaultMockReceiptData,
                            invoiceNo: row.no,
                            customerName: row.cust,
                            petName: row.pet,
                            paymentMethod: row.method,
                            total: parseFloat(row.total),
                          });
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0071e3] hover:bg-blue-100 font-bold transition cursor-pointer"
                      >
                        พิมพ์ใบเสร็จ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PAYMENT CHECKOUT MODAL (PF-037 & PF-036) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {isPaymentSuccess ? (
              /* Success Confirmation Screen */
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    ชำระเงินสำเร็จเรียบร้อย!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    เลขที่ใบเสร็จ: <strong className="font-mono text-slate-800 dark:text-slate-200">{completedInvoiceNo}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ยอดที่ชำระ</span>
                    <strong className="text-slate-900 dark:text-white">
                      {(financialTotals.totalMinor / 100).toFixed(2)} บาท
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วิธีชำระเงิน</span>
                    <span className="font-bold text-[#0071e3]">{selectedPaymentMethod}</span>
                  </div>
                  {selectedPaymentMethod === 'CASH' && (
                    <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>เงินทอน</span>
                      <span>{(cashChangeMinor / 100).toFixed(2)} บาท</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={handlePrintCurrentReceipt}
                    className="bg-slate-900 hover:bg-black text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    พิมพ์ใบเสร็จ (Receipt)
                  </Button>
                  <Button
                    onClick={handleNewSale}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    เริ่มการขายใหม่
                  </Button>
                </div>
              </div>
            ) : (
              /* Payment Selection & Input Screen */
              <div>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      ชำระเงิน (Checkout)
                    </h3>
                    <p className="text-xs text-slate-400">เลือกรูปแบบการชำระเงินของลูกค้า</p>
                  </div>

                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 text-xs">
                  {/* Total Payable Banner */}
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">ยอดสุทธิที่ต้องชำระ</span>
                      <span className="text-2xl font-black text-[#0071e3]">
                        {(financialTotals.totalMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-900 text-[#0071e3] font-bold text-xs">
                      รวม VAT 7% แล้ว
                    </span>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'PROMPTPAY', label: 'PromptPay', icon: <QrCode className="w-4 h-4" /> },
                      { id: 'CASH', label: 'เงินสด', icon: <Banknote className="w-4 h-4" /> },
                      { id: 'CREDIT_CARD', label: 'บัตรเครดิต', icon: <CreditCard className="w-4 h-4" /> },
                      { id: 'BANK_TRANSFER', label: 'โอนเงิน', icon: <Building2 className="w-4 h-4" /> },
                      { id: 'SPLIT', label: 'แบ่งชำระ (Split)', icon: <ArrowRightLeft className="w-4 h-4" /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (m.id === 'SPLIT') {
                            setIsSplitPayment(true);
                          } else {
                            setIsSplitPayment(false);
                            setSelectedPaymentMethod(m.id as PaymentMethodType);
                          }
                        }}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer font-bold ${
                          (isSplitPayment && m.id === 'SPLIT') || (!isSplitPayment && selectedPaymentMethod === m.id)
                            ? 'border-[#0071e3] bg-blue-50 dark:bg-blue-950 text-[#0071e3] shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.icon}
                        <span className="text-[10px] truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Method-Specific Inputs */}
                  {isSplitPayment ? (
                    <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
                      <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                          ชำระเงินแบบแบ่งจ่าย 2 ช่องทาง (Split Payment)
                        </span>
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold">
                          ยอดรวม: {(financialTotals.totalMinor / 100).toFixed(2)} ฿
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Split 1 */}
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ช่องทางที่ 1 (เงินสด)</label>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">ชำระแล้ว</span>
                          </div>
                          <input
                            type="number"
                            value={splitAmount1}
                            onChange={(e) => setSplitAmount1(e.target.value)}
                            className="w-full text-base font-black text-slate-900 dark:text-white p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"
                            placeholder="ระบุยอดเงินสด"
                          />
                        </div>

                        {/* Split 2 */}
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">ช่องทางที่ 2 (PromptPay QR)</label>
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1 rounded">สแกนจ่าย</span>
                          </div>
                          <div className="w-full text-base font-black text-indigo-600 dark:text-indigo-400 p-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/40 flex items-center justify-between">
                            <span>{Math.max(0, financialTotals.totalMinor / 100 - (parseFloat(splitAmount1) || 0)).toFixed(2)} ฿</span>
                            <QrCode className="w-4 h-4 text-indigo-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedPaymentMethod === 'PROMPTPAY' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                      <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                        <QrCode className="w-28 h-28 text-slate-900" />
                      </div>
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white block">
                          สแกนชำระผ่าน PromptPay QR Code
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          ยอดเงิน {(financialTotals.totalMinor / 100).toFixed(2)} บาท • อ้างอิง {paymentReference}
                        </span>
                      </div>
                    </div>
                  ) : selectedPaymentMethod === 'CASH' ? (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          จำนวนเงินที่รับจากลูกค้า (บาท)
                        </label>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full text-lg font-black text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                        />
                      </div>

                      {/* Quick Tender Buttons */}
                      <div className="flex items-center gap-2">
                        {[
                          { label: 'พอดีบิล', val: (financialTotals.totalMinor / 100).toString() },
                          { label: '+500', val: '500' },
                          { label: '+1,000', val: '1000' },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => setCashTendered(btn.val)}
                            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Change Calculation Display */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          เงินทอน (Change Due):
                        </span>
                        <span className="text-xl font-black text-emerald-600">
                          {(cashChangeMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </span>
                      </div>
                    </div>
                  ) : selectedPaymentMethod === 'CREDIT_CARD' ? (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          เลขอ้างอิงสลิปเครื่องรูดบัตร (EDC Approval Code)
                        </label>
                        <input
                          type="text"
                          defaultValue="TXN-998821-VISA"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        รองรับ Visa, Mastercard, JCB, และ UnionPay
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          บัญชีธนาคารรับโอน: กสิกรไทย (098-2-33445-1)
                        </label>
                        <input
                          type="text"
                          defaultValue="โอนเงินผ่าน K-Plus"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0071e3] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/60 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <Button
                    onClick={handleCompletePayment}
                    className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                  >
                    ยืนยันรับชำระเงิน (Confirm)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PRINTABLE RECEIPT MODAL (PF-038) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        data={activeReceiptData || defaultMockReceiptData}
      />
    </div>
  );
}

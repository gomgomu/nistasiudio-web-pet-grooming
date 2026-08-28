'use client';

import React, { useState } from 'react';
import {
  Printer,
  X,
  Send,
  QrCode,
  FileText,
  Receipt as ReceiptIcon,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@petflow/ui';

export interface ReceiptItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  taxRate?: number;
  petName?: string;
  staffName?: string;
}

export interface ReceiptData {
  invoiceNo: string;
  queueCode?: string;
  issuedAt: string;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerTaxId?: string;
  petName?: string;
  petBreed?: string;
  items: ReceiptItemData[];
  subtotal: number;
  discount: number;
  netTaxable: number;
  tax: number;
  total: number;
  paymentMethod: string;
  receivedAmount?: number;
  change?: number;
  reference?: string;
  splitDetails?: {
    method1: string;
    amount1: number;
    method2: string;
    amount2: number;
  };
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  branchTaxId?: string;
}

export const defaultMockReceiptData: ReceiptData = {
  invoiceNo: 'INV-202608-0008',
  queueCode: 'Q06',
  issuedAt: '25 ส.ค. 2026 14:25 น.',
  cashierName: 'แคชเชียร์ 01 (คุณพิมพ์ใจ)',
  customerName: 'คุณสุภาพร ใจดี',
  customerPhone: '081-234-5678',
  customerAddress: '88/12 สุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  customerTaxId: '1100500123456',
  petName: 'น้องโมจิ',
  petBreed: 'ปอมเมอเรเนียน (สุนัข)',
  items: [
    {
      description: 'อาบน้ำตัดขน สุนัขพันธุ์เล็ก (Teddy Cut)',
      quantity: 1,
      unitPrice: 550.0,
      discount: 0,
      total: 550.0,
      taxRate: 7.0,
    },
    {
      description: 'ขนมขบเคี้ยวขัดฟันสุนัข กลิ่นเนื้อรมควัน',
      quantity: 2,
      unitPrice: 150.0,
      discount: 0,
      total: 300.0,
      taxRate: 7.0,
    },
  ],
  subtotal: 850.0,
  discount: 50.0,
  netTaxable: 800.0,
  tax: 56.0,
  total: 856.0,
  paymentMethod: 'PROMPTPAY',
  receivedAmount: 856.0,
  change: 0.0,
  reference: 'PP-20260825-44910',
  branchName: 'คลินิกและกรูมมิ่งสัตว์เลี้ยง เพ็ทโฟลว์ (สาขาทองหล่อ)',
  branchAddress: '555 ซอยสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110',
  branchPhone: '02-712-9988',
  branchTaxId: '0105566099881 (สำนักงานใหญ่)',
};

export function ReceiptModal({
  isOpen,
  onClose,
  data = defaultMockReceiptData,
}: {
  isOpen: boolean;
  onClose: () => void;
  data?: ReceiptData;
}) {
  const [layoutFormat, setLayoutFormat] = useState<'THERMAL_80' | 'A4_FULL'>('THERMAL_80');
  const [isLineSent, setIsLineSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendLine = () => {
    setIsLineSent(true);
    setTimeout(() => {
      setIsLineSent(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0071e3] flex items-center justify-center font-bold">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                พิมพ์ใบเสร็จรับเงิน (Receipt Preview)
              </h3>
              <p className="text-[11px] text-slate-400">
                เลขที่ {data.invoiceNo} • {data.customerName}
              </p>
            </div>
          </div>

          {/* Format Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-700 p-1 rounded-xl">
            <button
              onClick={() => setLayoutFormat('THERMAL_80')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                layoutFormat === 'THERMAL_80'
                  ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ReceiptIcon className="w-3.5 h-3.5" />
              <span>สลิป 80mm</span>
            </button>
            <button
              onClick={() => setLayoutFormat('A4_FULL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                layoutFormat === 'A4_FULL'
                  ? 'bg-white dark:bg-slate-900 text-[#0071e3] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>เต็มรูป A4</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Printable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100/60 dark:bg-slate-950/60">
          {layoutFormat === 'THERMAL_80' ? (
            /* ========================================================================= */
            /* 1. THERMAL 80MM SLIP FORMAT */
            /* ========================================================================= */
            <div className="w-[320px] bg-white text-slate-900 p-5 rounded-2xl shadow-md border border-slate-200 font-mono text-[11px] leading-relaxed space-y-3 print:border-none print:shadow-none print:w-full print:p-0">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto mb-1">
                  PF
                </div>
                <h4 className="font-bold text-xs tracking-tight text-slate-900">
                  {data.branchName}
                </h4>
                <p className="text-[10px] text-slate-500">{data.branchAddress}</p>
                <p className="text-[10px] text-slate-500">
                  โทร: {data.branchPhone} • เลขภาษี: {data.branchTaxId}
                </p>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Metadata */}
              <div className="text-[10px] space-y-0.5 text-slate-600">
                <div className="flex justify-between">
                  <span>เลขที่ใบเสร็จ:</span>
                  <strong className="text-slate-900">{data.invoiceNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span>วันที่/เวลา:</span>
                  <span>{data.issuedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>ผู้ให้บริการ:</span>
                  <span>{data.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>ลูกค้า:</span>
                  <strong className="text-slate-900">{data.customerName}</strong>
                </div>
                {data.petName && (
                  <div className="flex justify-between">
                    <span>น้องสัตว์เลี้ยง:</span>
                    <span>{data.petName} ({data.petBreed})</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>รายการ</span>
                  <span>จำนวนเงิน (บาท)</span>
                </div>

                {data.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start font-medium text-slate-800">
                      <span className="max-w-[190px] leading-tight">
                        {item.description}
                      </span>
                      <span>{item.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>{item.quantity} x {item.unitPrice.toFixed(2)}</span>
                      {item.discount && item.discount > 0 ? (
                        <span className="text-rose-500">-{(item.discount).toFixed(2)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Totals */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span>{data.subtotal.toFixed(2)}</span>
                </div>

                {data.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ส่วนลด (Discount):</span>
                    <span>-{data.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>มูลค่าก่อนภาษี (Taxable):</span>
                  <span>{data.netTaxable.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                  <span>{data.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-300 pt-1.5 mt-1">
                  <span>ยอดสุทธิ (TOTAL):</span>
                  <span className="text-sm">{data.total.toFixed(2)} ฿</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Payment Details */}
              <div className="text-[10px] space-y-0.5 text-slate-600">
                <div className="flex justify-between">
                  <span>วิธีชำระเงิน:</span>
                  <strong className="text-slate-900">{data.paymentMethod}</strong>
                </div>
                {data.splitDetails && (
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200 my-1 space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>• {data.splitDetails.method1}:</span>
                      <span className="font-bold">{data.splitDetails.amount1.toFixed(2)} ฿</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>• {data.splitDetails.method2}:</span>
                      <span className="font-bold">{data.splitDetails.amount2.toFixed(2)} ฿</span>
                    </div>
                  </div>
                )}
                {data.reference && (
                  <div className="flex justify-between text-[9px]">
                    <span>รหัสอ้างอิง:</span>
                    <span>{data.reference}</span>
                  </div>
                )}
                {data.receivedAmount !== undefined && (
                  <div className="flex justify-between">
                    <span>จำนวนเงินที่รับ:</span>
                    <span>{data.receivedAmount.toFixed(2)}</span>
                  </div>
                )}
                {data.change !== undefined && data.change > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>เงินทอน:</span>
                    <span>{data.change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* QR Code & Footer */}
              <div className="pt-2 text-center space-y-2">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl mx-auto flex items-center justify-center p-1">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <p className="text-[9px] text-slate-400">
                  สแกนเพื่อรับ e-Receipt หรือติดตามผลการรักษา/นัดหมาย
                </p>
                <p className="text-[10px] font-bold text-slate-700">
                  ขอบคุณที่ไว้วางใจให้เราดูแลน้อง 🐾
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. FULL A4 TAX INVOICE FORMAT */
            /* ========================================================================= */
            <div className="w-full max-w-xl bg-white text-slate-900 p-8 rounded-2xl shadow-md border border-slate-200 text-xs leading-relaxed space-y-5 print:border-none print:shadow-none print:w-full print:p-0">
              {/* Top Company & Title */}
              <div className="flex items-start justify-between border-b pb-4 border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      PF
                    </div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      บริษัท เพ็ทโฟลว์ เทคโนโลยี (ประเทศไทย) จำกัด
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{data.branchAddress}</p>
                  <p className="text-[11px] text-slate-500">
                    โทร: {data.branchPhone} • เลขประจำตัวผู้เสียภาษี: {data.branchTaxId}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#0071e3] font-bold text-xs border border-blue-200 inline-block">
                    ใบเสร็จรับเงิน / ใบกำกับภาษี
                  </span>
                  <p className="text-xs font-mono font-bold mt-2 text-slate-900">
                    {data.invoiceNo}
                  </p>
                  <p className="text-[11px] text-slate-400">{data.issuedAt}</p>
                </div>
              </div>

              {/* Customer & Patient Info */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    ข้อมูลผู้ซื้อ / ผู้รับบริการ
                  </span>
                  <strong className="text-slate-900 block mt-0.5">{data.customerName}</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">{data.customerAddress || 'ลูกค้าทั่วไป'}</p>
                  <p className="text-[11px] text-slate-500">โทร: {data.customerPhone}</p>
                  {data.customerTaxId && (
                    <p className="text-[11px] text-slate-500">เลขผู้เสียภาษี: {data.customerTaxId}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    ข้อมูลสัตว์เลี้ยง (Patient)
                  </span>
                  <strong className="text-slate-900 block mt-0.5">{data.petName}</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">สายพันธุ์: {data.petBreed}</p>
                  <p className="text-[11px] text-slate-500">ผู้รับเงิน: {data.cashierName}</p>
                </div>
              </div>

              {/* Table of Items */}
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                      <th className="py-2.5 px-3">รายการสินค้า / บริการ</th>
                      <th className="py-2.5 px-3 text-center w-16">จำนวน</th>
                      <th className="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-24">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary Table */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>รวมเงิน (Subtotal):</span>
                    <span>{data.subtotal.toFixed(2)} บาท</span>
                  </div>

                  {data.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>หักส่วนลด (Discount):</span>
                      <span>-{data.discount.toFixed(2)} บาท</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500">
                    <span>มูลค่าก่อนภาษี (Taxable):</span>
                    <span>{data.netTaxable.toFixed(2)} บาท</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                    <span>{data.tax.toFixed(2)} บาท</span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2 mt-1">
                    <span>จำนวนเงินรวมทั้งสิ้น:</span>
                    <span className="text-blue-600">{data.total.toFixed(2)} บาท</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
                <div className="space-y-8">
                  <div className="border-b border-dashed border-slate-300 w-40 mx-auto" />
                  <p>ลงชื่อผู้รับบริการ / ผู้ชำระเงิน</p>
                </div>

                <div className="space-y-8">
                  <div className="border-b border-dashed border-slate-300 w-40 mx-auto" />
                  <p>ลงชื่อผู้มีอำนาจลงนาม / ผู้รับเงิน</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            {isLineSent ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                ส่งสลิปเข้า LINE ลูกค้าเรียบร้อย
              </span>
            ) : (
              <button
                onClick={handleSendLine}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                ส่งสลิปเข้า LINE
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-4 py-2"
            >
              ปิดหน้าต่าง
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow-apple cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ใบเสร็จ (Print)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

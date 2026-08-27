'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { Button } from '@petflow/ui';
import { defaultMockReceiptData, ReceiptData } from '@/components/pos/receipt-modal';

export default function StandaloneReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const data: ReceiptData = {
    ...defaultMockReceiptData,
    invoiceNo: invoiceId.startsWith('INV-') ? invoiceId : `INV-202608-${invoiceId}`,
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 flex flex-col items-center justify-start">
      {/* Top Action Bar (Hidden on print) */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/pos"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0071e3] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้า POS
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-apple cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ใบเสร็จ (Print 80mm)
          </Button>
        </div>
      </div>

      {/* 80mm Thermal Receipt Layout */}
      <div className="w-[340px] bg-white text-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 font-mono text-[11px] leading-relaxed space-y-3 print:border-none print:shadow-none print:w-full print:p-0 print:m-0">
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
                <span className="max-w-[200px] leading-tight">{item.description}</span>
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
    </div>
  );
}

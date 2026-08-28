'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Users,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  DollarSign,
  Search,
  Eye,
  X,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Button } from '@petflow/ui';

interface StaffCommissionSummary {
  id: string;
  name: string;
  role: 'GROOMER' | 'VETERINARIAN' | 'RECEPTIONIST';
  roleLabel: string;
  branchName: string;
  totalCases: number;
  totalGrossSalesMinor: number;
  commissionRate: number;
  commissionEarnedMinor: number;
  bonusMinor: number;
  netPayableMinor: number;
  breakdown: {
    date: string;
    invoiceNo: string;
    petName: string;
    serviceName: string;
    salePriceMinor: number;
    rate: number;
    commissionMinor: number;
  }[];
}

const MOCK_COMMISSION_DATA: StaffCommissionSummary[] = [
  {
    id: 'st-01',
    name: 'ช่างเอก สกิลทอง',
    role: 'GROOMER',
    roleLabel: 'ช่างกรูมมิ่งอาวุโส',
    branchName: 'สาขาทองหล่อ',
    totalCases: 48,
    totalGrossSalesMinor: 2850000, // 28,500.00 THB
    commissionRate: 15,
    commissionEarnedMinor: 427500, // 4,275.00 THB
    bonusMinor: 50000, // 500.00 THB
    netPayableMinor: 477500, // 4,775.00 THB
    breakdown: [
      {
        date: '28 ส.ค. 2026 10:15',
        invoiceNo: 'INV-202608-0008',
        petName: 'น้องโมจิ (ปอม)',
        serviceName: 'อาบน้ำ + ตัดขนทรงหมี (Teddy Cut)',
        salePriceMinor: 55000,
        rate: 15,
        commissionMinor: 8250,
      },
      {
        date: '28 ส.ค. 2026 11:30',
        invoiceNo: 'INV-202608-0012',
        petName: 'น้องถ้วยฟู (บิชอง)',
        serviceName: 'อาบน้ำ + ตัดขนทรงหัวฟูกลม',
        salePriceMinor: 70000,
        rate: 15,
        commissionMinor: 10500,
      },
      {
        date: '27 ส.ค. 2026 14:00',
        invoiceNo: 'INV-202608-0004',
        petName: 'น้องบะหมี่ (พุดเดิ้ล)',
        serviceName: 'อาบน้ำสปาโอโซน + ไถสั้น',
        salePriceMinor: 65000,
        rate: 15,
        commissionMinor: 9750,
      },
    ],
  },
  {
    id: 'st-02',
    name: 'ช่างแนน พรปวีณ์',
    role: 'GROOMER',
    roleLabel: 'ช่างกรูมมิ่ง',
    branchName: 'สาขาทองหล่อ',
    totalCases: 42,
    totalGrossSalesMinor: 2310000,
    commissionRate: 15,
    commissionEarnedMinor: 346500,
    bonusMinor: 30000,
    netPayableMinor: 376500,
    breakdown: [
      {
        date: '28 ส.ค. 2026 09:30',
        invoiceNo: 'INV-202608-0006',
        petName: 'น้องไข่ตุ๋น (ชิสุ)',
        serviceName: 'อาบน้ำตัดขนสั้นเบอร์ 2',
        salePriceMinor: 45000,
        rate: 15,
        commissionMinor: 6750,
      },
    ],
  },
  {
    id: 'st-03',
    name: 'น.สพ. วรวิทย์ (หมอวิทย์)',
    role: 'VETERINARIAN',
    roleLabel: 'สัตวแพทย์ประจำคลินิก',
    branchName: 'สาขาทองหล่อ',
    totalCases: 36,
    totalGrossSalesMinor: 3200000,
    commissionRate: 10,
    commissionEarnedMinor: 320000,
    bonusMinor: 0,
    netPayableMinor: 320000,
    breakdown: [
      {
        date: '28 ส.ค. 2026 13:00',
        invoiceNo: 'INV-202608-0015',
        petName: 'น้องโมจิ',
        serviceName: 'ตรวจสุขภาพ OPD + ตรวจผิวหนัง',
        salePriceMinor: 30000,
        rate: 10,
        commissionMinor: 3000,
      },
      {
        date: '27 ส.ค. 2026 16:30',
        invoiceNo: 'INV-202608-0007',
        petName: 'น้องส้มตำ',
        serviceName: 'ฉีดวัคซีนรวมแมว + พิษสุนัขบ้า',
        salePriceMinor: 40000,
        rate: 10,
        commissionMinor: 4000,
      },
    ],
  },
  {
    id: 'st-04',
    name: 'น้องฝน สุพัตรา',
    role: 'RECEPTIONIST',
    roleLabel: 'แคชเชียร์ & ต้อนรับ',
    branchName: 'สาขาทองหล่อ',
    totalCases: 120,
    totalGrossSalesMinor: 6500000,
    commissionRate: 2,
    commissionEarnedMinor: 130000,
    bonusMinor: 20000,
    netPayableMinor: 150000,
    breakdown: [
      {
        date: '28 ส.ค. 2026 10:15',
        invoiceNo: 'INV-202608-0008',
        petName: 'น้องโมจิ',
        serviceName: 'ขายหน้าร้าน + ขนมขัดฟัน',
        salePriceMinor: 85000,
        rate: 2,
        commissionMinor: 1700,
      },
    ],
  },
];

export default function StaffCommissionReportPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingStaff, setViewingStaff] = useState<StaffCommissionSummary | null>(null);

  const filteredStaff = MOCK_COMMISSION_DATA.filter((s) => {
    if (selectedRole !== 'ALL' && s.role !== selectedRole) return false;
    if (searchQuery.trim() && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totals = {
    totalGrossSalesMinor: filteredStaff.reduce((a, b) => a + b.totalGrossSalesMinor, 0),
    totalCommissionMinor: filteredStaff.reduce((a, b) => a + b.netPayableMinor, 0),
    totalCases: filteredStaff.reduce((a, b) => a + b.totalCases, 0),
  };

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* Breadcrumb & Top Bar */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
          <Link href="/reports" className="hover:text-slate-900">
            รายงาน (Reports)
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0071e3] font-bold">รายงานค่าคอมมิชชั่น & ค่ามือพนักงาน</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Scissors className="w-6 h-6 text-[#0071e3]" />
              ระบบคำนวณค่ามือ & คอมมิชชั่นพนักงาน (Staff Commission Engine)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปส่วนแบ่งค่ามือช่างกรูมมิ่ง ค่าตรวจสัตวแพทย์ และยอดขายหน้าร้านรายบุคคลเพื่อจ่ายเงินเดือน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน</span>
            </Button>
            <Button
              onClick={() => alert('ส่งออกไฟล์ Excel สำเร็จ!')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">
            💰 ยอดจ่ายค่ามือ/คอมมิชชั่นรวม (Net Commission Pool)
          </span>
          <p className="text-2xl font-black text-[#0071e3]">
            {(totals.totalCommissionMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </p>
          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block">
            ● คำนวณอัตโนมัติจากระบบ POS
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">
            🐾 จำนวนเคส/บริการที่ทำสำเร็จทั้งหมด
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totals.totalCases} เคส
          </p>
          <span className="text-[11px] text-slate-500">
            เฉลี่ย ฿{Math.round((totals.totalGrossSalesMinor / 100) / (totals.totalCases || 1))} ต่อเคส
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">
            📈 ยอดขายรวมที่สร้างได้ (Gross Revenue)
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {(totals.totalGrossSalesMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </p>
          <span className="text-[11px] text-slate-500">
            อัตราค่ามือเฉลี่ยทั้งร้าน: <strong>14.2%</strong>
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-apple flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
          >
            <option value="2026-08">รอบเดือน สิงหาคม 2569</option>
            <option value="2026-07">รอบเดือน กรกฎาคม 2569</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
          >
            <option value="ALL">ทุกตำแหน่งพนักงาน</option>
            <option value="GROOMER">✂️ ช่างกรูมมิ่ง</option>
            <option value="VETERINARIAN">🏥 สัตวแพทย์</option>
            <option value="RECEPTIONIST">🛎️ แคชเชียร์ & ต้อนรับ</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อช่าง, แพทย์..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      {/* Staff Commission Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-apple">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">ชื่อพนักงาน & ตำแหน่ง</th>
                <th className="py-3 px-4 text-center">จำนวนเคส</th>
                <th className="py-3 px-4 text-right">ยอดขายที่ทำได้</th>
                <th className="py-3 px-4 text-center">อัตราส่วนแบ่ง</th>
                <th className="py-3 px-4 text-right">ค่าคอมมิชชั่น</th>
                <th className="py-3 px-4 text-right">เบี้ยขยัน/โบนัส</th>
                <th className="py-3 px-4 text-right font-black text-[#0071e3]">รวมยอดจ่ายสุทธิ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0071e3] flex items-center justify-center font-bold text-xs">
                        {staff.role === 'GROOMER' ? <Scissors className="w-4 h-4" /> : staff.role === 'VETERINARIAN' ? <Stethoscope className="w-4 h-4 text-purple-600" /> : <Users className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-bold">
                          {staff.name}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          {staff.roleLabel} • {staff.branchName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {staff.totalCases} เคส
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                    {(staff.totalGrossSalesMinor / 100).toLocaleString('th-TH')} ฿
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0071e3] border border-blue-200">
                      {staff.commissionRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {(staff.commissionEarnedMinor / 100).toLocaleString('th-TH')} ฿
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                    +{(staff.bonusMinor / 100).toLocaleString('th-TH')} ฿
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-sm text-[#0071e3]">
                    {(staff.netPayableMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setViewingStaff(staff)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูใบงาน</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Detailed Breakdown Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  ใบงานและยอดคำนวณค่ามือ: {viewingStaff.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {viewingStaff.roleLabel} • รอบบิลเดือน {selectedMonth}
                </p>
              </div>
              <button
                onClick={() => setViewingStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">ยอดค่าคอมมิชชั่นสุทธิที่ได้รับ</span>
                  <span className="text-2xl font-black text-[#0071e3]">
                    {(viewingStaff.netPayableMinor / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {viewingStaff.totalCases} รายการบริการ
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2.5">วัน/เวลา</th>
                      <th className="p-2.5">สัตว์เลี้ยง</th>
                      <th className="p-2.5">รายการบริการ</th>
                      <th className="p-2.5 text-right">ยอดบิล</th>
                      <th className="p-2.5 text-right">ค่ามือ ({viewingStaff.commissionRate}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingStaff.breakdown.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{row.date}</td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.petName}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.serviceName}</td>
                        <td className="p-2.5 text-right">{(row.salePriceMinor / 100).toFixed(2)} ฿</td>
                        <td className="p-2.5 text-right font-black text-emerald-600">
                          +{(row.commissionMinor / 100).toFixed(2)} ฿
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/40">
              <Button
                onClick={() => setViewingStaff(null)}
                className="bg-[#0071e3] text-white text-xs px-4 py-2 cursor-pointer"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
} from 'lucide-react';

interface ParsedRow {
  rowNum: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  petName: string;
  species: string;
  breed: string;
  allergies: string;
  behavioralNotes: string;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_CSV = `firstName,lastName,phone,email,petName,species,breed,allergies,behavioralNotes
กนกวรรณ,รักดี,089-111-2233,kanokwan@example.com,โมจิ,DOG,Pomeranian,แพ้ยา Amoxicillin,กลัวไดร์เป่าขน
ธนภัทร,สุขสมบูรณ์,081-999-8877,tanapat@example.com,ชาโคล,CAT,British Shorthair,,
วิภาดา,เจริญกิจ,086-555-4433,vipada@example.com,บิงซู,CAT,Persian,แพ้อาหารทะเล,ดุเวลาตัดเล็บ
สมพงษ์,,084-333-2211,,ทองเอก,DOG,Golden Retriever,,`;

export default function CustomerImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCustomers: number;
    importedPets: number;
    failedCount: number;
  } | null>(null);

  const handleParse = (text: string) => {
    setCsvText(text);
    setImportResult(null);

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length === 0 || parts.every((p) => p === '')) continue;

      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        const val = parts[idx] || '';
        if (h === 'firstname' || h === 'first_name' || h === 'ชื่อ') obj.firstName = val;
        else if (h === 'lastname' || h === 'last_name' || h === 'นามสกุล') obj.lastName = val;
        else if (h === 'phone' || h === 'tel' || h === 'เบอร์โทร') obj.phone = val;
        else if (h === 'email' || h === 'อีเมล') obj.email = val;
        else if (h === 'petname' || h === 'pet_name' || h === 'ชื่อสัตว์เลี้ยง') obj.petName = val;
        else if (h === 'species' || h === 'ประเภทสัตว์') obj.species = val;
        else if (h === 'breed' || h === 'สายพันธุ์') obj.breed = val;
        else if (h === 'allergies' || h === 'แพ้ยา') obj.allergies = val;
        else if (h === 'behavioralnotes' || h === 'behavioral_notes' || h === 'พฤติกรรม') obj.behavioralNotes = val;
      });

      const rowErrors: string[] = [];
      if (!obj.firstName || obj.firstName.trim().length === 0) {
        rowErrors.push('กรุณาระบุชื่อลูกค้า (First Name)');
      }
      if (!obj.phone || obj.phone.trim().length === 0) {
        rowErrors.push('กรุณาระบุเบอร์โทรศัพท์ (Phone)');
      } else if (obj.phone.replace(/\D/g, '').length < 9) {
        rowErrors.push('เบอร์โทรศัพท์ต้องมีอย่างน้อย 9-10 หลัก');
      }

      if (obj.species) {
        const validSpecies = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'];
        if (!validSpecies.includes(obj.species.toUpperCase())) {
          rowErrors.push(`ประเภทสัตว์ไม่ถูกต้อง (เลือกได้: DOG, CAT, BIRD, RABBIT, OTHER)`);
        }
      }

      rows.push({
        rowNum: i,
        firstName: obj.firstName || '',
        lastName: obj.lastName || '',
        phone: obj.phone || '',
        email: obj.email || '',
        petName: obj.petName || '',
        species: obj.species || 'DOG',
        breed: obj.breed || '',
        allergies: obj.allergies || '',
        behavioralNotes: obj.behavioralNotes || '',
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    setParsedRows(rows);
  };

  // Initial parse
  React.useEffect(() => {
    handleParse(SAMPLE_CSV);
  }, []);

  const handleDownloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = 'petflow_customer_import_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const validRows = parsedRows.filter((r) => r.isValid);
      const petCount = validRows.filter((r) => r.petName).length;

      setImportResult({
        success: true,
        importedCustomers: validRows.length,
        importedPets: petCount,
        failedCount: parsedRows.length - validRows.length,
      });
      setIsProcessing(false);
    }, 800);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              นำเข้าข้อมูลลูกค้า & สัตว์เลี้ยง (CSV Import)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ย้ายข้อมูลจากระบบเดิมหรือ Excel เข้าสู่ระบบ PetFlow แบบรวดเร็วและปลอดภัย
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          ดาวน์โหลดไฟล์ตัวอย่าง (.CSV)
        </button>
      </div>

      {/* Success / Result Alert */}
      {importResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-900">
                นำเข้าข้อมูลสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                สร้างโปรไฟล์ลูกค้าใหม่ <strong>{importResult.importedCustomers} ราย</strong> และสัตว์เลี้ยง <strong>{importResult.importedPets} ตัว</strong>
                {importResult.failedCount > 0 && ` (ข้าม ${importResult.failedCount} แถวที่มีข้อผิดพลาด)`}
              </p>
            </div>
          </div>

          <Link
            href="/customers"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            ไปยังรายชื่อลูกค้า
          </Link>
        </div>
      )}

      {/* Upload Zone & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Upload Drag/Drop */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">เลือกไฟล์ CSV</h2>
          </div>

          <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-emerald-50/20 transition group">
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition" />
            <span className="text-xs font-semibold text-slate-700">คลิกเพื่ออัปโหลดไฟล์ .CSV</span>
            <span className="text-[10px] text-slate-400">รองรับ UTF-8 encoding</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <p className="font-semibold text-slate-700">คอลัมน์ที่รองรับ:</p>
            <p>• firstName, lastName, phone (จำเป็น)</p>
            <p>• email, petName, species, breed</p>
            <p>• allergies, behavioralNotes</p>
          </div>
        </div>

        {/* Right: Paste / Edit CSV Text */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">หรือวางข้อความ CSV โดยตรง (Paste CSV Data)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {parsedRows.length} แถว
              </span>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => handleParse(e.target.value)}
              rows={6}
              className="w-full mt-3 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              placeholder="วางข้อมูล CSV ที่นี่..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                ถูกต้อง: {validCount} แถว
              </span>
              {invalidCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  มีข้อผิดพลาด: {invalidCount} แถว
                </span>
              )}
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isProcessing ? 'กำลังนำเข้า...' : `ยืนยันนำเข้าข้อมูล (${validCount} รายการ)`}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            ตรวจสอบข้อมูลก่อนนำเข้า (Data Validation Preview)
          </h3>
          <span className="text-xs text-slate-400">
            ระบบตรวจสอบความถูกต้องและข้อผิดพลาดให้อัตโนมัติ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">แถว</th>
                <th className="py-2.5 px-4">สถานะ</th>
                <th className="py-2.5 px-4">ชื่อ-นามสกุล</th>
                <th className="py-2.5 px-4">เบอร์โทรศัพท์</th>
                <th className="py-2.5 px-4">สัตว์เลี้ยง</th>
                <th className="py-2.5 px-4">ประเภท/สายพันธุ์</th>
                <th className="py-2.5 px-4">ข้อควรระวัง/แพ้ยา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parsedRows.map((row) => (
                <tr
                  key={row.rowNum}
                  className={`hover:bg-slate-50/80 transition ${
                    !row.isValid ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-400">#{row.rowNum}</td>
                  <td className="py-3 px-4">
                    {row.isValid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        พร้อมนำเข้า
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          พบข้อผิดพลาด
                        </span>
                        {row.errors.map((err, idx) => (
                          <p key={idx} className="text-[10px] text-rose-600 font-medium">
                            • {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {row.firstName} {row.lastName}
                    {row.email && <span className="block text-[10px] font-normal text-slate-400">{row.email}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {row.phone || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {row.petName ? (
                      <span className="font-semibold text-slate-800">{row.petName}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {row.petName ? (
                      <span>{row.species} {row.breed ? `(${row.breed})` : ''}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    {row.allergies && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium mr-1">
                        แพ้: {row.allergies}
                      </span>
                    )}
                    {row.behavioralNotes && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                        ระวัง: {row.behavioralNotes}
                      </span>
                    )}
                    {!row.allergies && !row.behavioralNotes && (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Scissors,
  Calendar,
  Package,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  CheckCheck,
  ChevronRight,
  X,
  Building2,
  Zap,
  ShieldCheck,
  Activity,
  Server,
} from 'lucide-react';
import { Badge } from '@petflow/ui';
import { useAuth } from '../../contexts/auth-context';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'GROOMING' | 'APPOINTMENT' | 'STOCK' | 'PAYMENT' | 'LINE' | 'TENANT' | 'SYSTEM' | 'QUOTA' | 'AUDIT';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// 1. Clinic & Store Level Notifications (For Owner, Groomer, Vet, Cashier)
const STORE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: '✂️ กรูมมิ่ง: อาบน้ำเสร็จแล้ว',
    message: 'น้องโมจิ (ชิสุ) กำลังเป่าขนและไดร์ขน โดย ช่างเอก',
    category: 'GROOMING',
    timestamp: '5 นาทีที่แล้ว',
    isRead: false,
    actionUrl: '/grooming/queue',
  },
  {
    id: 'n-2',
    title: '📅 นัดหมายใหม่: ตรวจสุขภาพ',
    message: 'คุณพิมพ์ใจ จองนัดตรวจสุขภาพ น้องทองเอก เวลา 14:30 น. (หมอน้ำใส)',
    category: 'APPOINTMENT',
    timestamp: '15 นาทีที่แล้ว',
    isRead: false,
    actionUrl: '/appointments',
  },
  {
    id: 'n-3',
    title: '💬 LINE OA: ส่งแจ้งเตือนสำเร็จ',
    message: 'ส่งข้อความเตือนนัดฉีดวัคซีนพิษสุนัขบ้าให้ คุณกานดา เรียบร้อยแล้ว',
    category: 'LINE',
    timestamp: '1 ชม. ที่แล้ว',
    isRead: false,
    actionUrl: '/customers',
  },
  {
    id: 'n-4',
    title: '📦 สต็อกสินค้า: สินค้าใกล้หมด',
    message: 'แชมพูสูตรออร์แกนิค (Oatmeal 500ml) คงเหลือ 2 ขวด (ต่ำกว่าเกณฑ์)',
    category: 'STOCK',
    timestamp: '3 ชม. ที่แล้ว',
    isRead: true,
    actionUrl: '/inventory',
  },
  {
    id: 'n-5',
    title: '💳 POS: รับชำระเงินสำเร็จ',
    message: 'บิล #INV-2026-088 ยอด 1,250 บาท (PromptPay QR)',
    category: 'PAYMENT',
    timestamp: '5 ชม. ที่แล้ว',
    isRead: true,
    actionUrl: '/pos',
  },
];

// 2. Platform HQ Super Admin Notifications (For SaaS Super Admin)
const SUPER_ADMIN_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'sa-1',
    title: '🚀 ร้านค้าใหม่: Happy Paws Grooming',
    message: 'ลงทะเบียนเปิดร้านใหม่ในระบบ และเลือกแพ็กเกจ Professional Plan (2,990฿/ด.)',
    category: 'TENANT',
    timestamp: '10 นาทีที่แล้ว',
    isRead: false,
    actionUrl: '/admin',
  },
  {
    id: 'sa-2',
    title: '💰 รายรับค่าบริการ SaaS: 2,990 บาท',
    message: 'ได้รับชำระเงินค่าต่ออายุสมาชิกรายเดือนจากร้าน "Demo Pet Care Clinic & Grooming"',
    category: 'PAYMENT',
    timestamp: '45 นาทีที่แล้ว',
    isRead: false,
    actionUrl: '/admin',
  },
  {
    id: 'sa-3',
    title: '⚡ โควต้า LINE OA: ใกล้หมด 85%',
    message: 'ร้าน "Pet Grooming Express" ใช้โควต้าส่งข้อความไปแล้ว 850/1,000 ข้อความ',
    category: 'QUOTA',
    timestamp: '2 ชม. ที่แล้ว',
    isRead: false,
    actionUrl: '/admin',
  },
  {
    id: 'sa-4',
    title: '☁️ สถานะระบบ Cloud & Redis: ปกติ 100%',
    message: 'PostgreSQL Neon & Upstash Redis Cloud เชื่อมต่อสมบูรณ์ Uptime 99.99%',
    category: 'SYSTEM',
    timestamp: '3 ชม. ที่แล้ว',
    isRead: true,
    actionUrl: '/admin',
  },
  {
    id: 'sa-5',
    title: '🛡️ Audit Security: อัปเดต Feature Flags',
    message: 'มีการเปิดใช้งานโมดูล AI Smart Reminders สำหรับสมาชิกระดับ Enterprise',
    category: 'AUDIT',
    timestamp: '5 ชม. ที่แล้ว',
    isRead: true,
    actionUrl: '/admin/feature-flags',
  },
];

export function NotificationPopover() {
  const { user } = useAuth();
  const isSuperAdmin = user.role === 'SAAS_ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    isSuperAdmin ? SUPER_ADMIN_NOTIFICATIONS : STORE_NOTIFICATIONS
  );
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SPECIAL'>('ALL');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync notifications when user role changes
  useEffect(() => {
    setNotifications(isSuperAdmin ? SUPER_ADMIN_NOTIFICATIONS : STORE_NOTIFICATIONS);
  }, [isSuperAdmin]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Filtered list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'SPECIAL') {
      return isSuperAdmin ? n.category === 'TENANT' || n.category === 'PAYMENT' : n.category === 'LINE';
    }
    return true;
  });

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'TENANT':
        return <Building2 className="w-3.5 h-3.5 text-violet-600" />;
      case 'SYSTEM':
        return <Activity className="w-3.5 h-3.5 text-emerald-600" />;
      case 'QUOTA':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'AUDIT':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'GROOMING':
        return <Scissors className="w-3.5 h-3.5 text-teal-600" />;
      case 'APPOINTMENT':
        return <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />;
      case 'LINE':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'STOCK':
        return <Package className="w-3.5 h-3.5 text-amber-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all shrink-0 cursor-pointer ${
          isOpen
            ? 'border-[#0071e3] bg-blue-50/90 text-[#0071e3] shadow-md dark:border-blue-700 dark:bg-slate-800'
            : 'border-slate-200/80 bg-white/90 text-slate-600 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 shadow-apple'
        }`}
        aria-label="การแจ้งเตือน"
        title={isSuperAdmin ? 'การแจ้งเตือนระดับแพลตฟอร์ม SaaS HQ' : 'การแจ้งเตือนประจำร้าน'}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50 ${
              isSuperAdmin ? 'bg-violet-600' : 'bg-[#0071e3]'
            }`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[390px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                {isSuperAdmin ? '👑 SaaS Platform Alerts' : '🔔 การแจ้งเตือนร้านค้า'}
              </h3>
              {unreadCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSuperAdmin
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      : 'bg-blue-500/15 text-[#0071e3] dark:text-blue-400'
                  }`}
                >
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071e3] hover:underline px-1.5 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="อ่านทั้งหมดแล้ว"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>อ่านทั้งหมด</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 bg-slate-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-[#0071e3] text-white'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
              }`}
            >
              ยังไม่ได้อ่าน ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('SPECIAL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filter === 'SPECIAL'
                  ? isSuperAdmin ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
              }`}
            >
              {isSuperAdmin ? 'ร้านค้า & รายได้' : 'LINE OA'}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold">ไม่มีการแจ้งเตือนใหม่ในขณะนี้</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3.5 transition flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer relative ${
                    !notif.isRead
                      ? isSuperAdmin
                        ? 'bg-violet-50/20 dark:bg-violet-950/10'
                        : 'bg-blue-50/30 dark:bg-blue-950/15'
                      : ''
                  }`}
                >
                  {/* Unread blue dot */}
                  {!notif.isRead && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        isSuperAdmin ? 'bg-violet-600' : 'bg-[#0071e3]'
                      }`}
                    />
                  )}

                  {/* Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                      !notif.isRead
                        ? 'bg-white dark:bg-slate-800 border-slate-200/80 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-transparent'
                    }`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? 'font-extrabold text-slate-900 dark:text-white'
                            : 'font-semibold text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center text-[10px] font-bold text-[#0071e3] hover:underline pt-0.5"
                      >
                        ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 px-2 text-[10px]">
                {isSuperAdmin ? 'ศูนย์ควบคุม Platform SaaS HQ' : 'ระบบแจ้งเตือนอัตโนมัติ'}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

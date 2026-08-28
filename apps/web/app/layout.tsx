import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '../components/layout/app-shell';

export const metadata: Metadata = {
  title: 'PetFlow — Thai Pet Business OS & Management SaaS',
  description:
    'ระบบบริหารจัดการคลินิกและร้านกรูมมิ่งสัตว์เลี้ยงครบวงจร นัดหมาย คิวกรูมมิ่ง POS สต็อก และแจ้งเตือน LINE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] font-sans selection:bg-blue-500 selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

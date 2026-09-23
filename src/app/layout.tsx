import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AdminShell from '@/components/AdminShell';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SkyRush Aviator - Next.js Admin Portal',
  description: 'Enterprise deposit approvals and real-time player balance operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans antialiased bg-[#080c14] text-gray-100 min-h-screen">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

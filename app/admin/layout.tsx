import React from 'react';
import { AuthProvider } from '@/components/admin/providers/AuthProvider';
import { BusinessProvider } from '@/components/admin/providers/BusinessProvider';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import '../globals.css';

export const metadata = {
  title: 'Sparovia Business Operating Workspace',
  description: 'Manage business digital presence, website, media, and leads.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <BusinessProvider>
            <AdminShell>{children}</AdminShell>
          </BusinessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import React from 'react';
import { AuthProvider } from '@/components/admin/providers/AuthProvider';
import { BusinessProvider } from '@/components/admin/providers/BusinessProvider';
import { AdminShell } from '@/components/admin/layout/AdminShell';

export const metadata = {
  title: 'Sparovia Business Operating Workspace',
  description: 'Manage business digital presence, website, media, and leads.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AdminShell>{children}</AdminShell>
      </BusinessProvider>
    </AuthProvider>
  );
}

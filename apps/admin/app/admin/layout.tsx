import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: {
    template: '%s | Sparovia Admin',
    default: 'Sparovia Admin',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

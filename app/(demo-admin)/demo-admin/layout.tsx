import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DemoAdminShell } from '@/components/demo-admin/demo-admin-shell';

export const metadata: Metadata = {
  title: {
    default: 'Demo Admin · Evironn',
    template: '%s · Demo Admin · Evironn',
  },
  robots: { index: false, follow: false },
};

export default function DemoAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root font-admin-body">
      <DemoAdminShell>{children}</DemoAdminShell>
    </div>
  );
}

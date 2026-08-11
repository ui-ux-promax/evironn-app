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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
      />
      <DemoAdminShell>{children}</DemoAdminShell>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_CATALOG_TABS, isActiveAdminHref } from '@/lib/admin/nav';

export function CatalogTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-admin-outline-variant">
      {ADMIN_CATALOG_TABS.map((tab) => {
        const active = isActiveAdminHref(tab, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors',
              active
                ? 'border-admin-primary text-admin-on-surface'
                : 'border-transparent text-admin-on-surface-variant hover:text-admin-on-surface',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_CATALOG_TABS, isActiveAdminHref } from '@/lib/admin/nav';

export function CatalogTabs({ embedded = false, productCount }: { embedded?: boolean; productCount?: number }) {
  const pathname = usePathname();
  if (pathname === '/admin/catalog') return null;
  if (pathname === '/admin/catalog/products' && !embedded) return null;

  return (
    <nav
      aria-label="Разделы каталога"
      className="flex gap-1 overflow-x-auto border-t border-admin-outline-variant pt-4"
    >
      {ADMIN_CATALOG_TABS.map((tab) => {
        const active = isActiveAdminHref(tab, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-testid={`admin-catalog-tab-${tab.href.split('/').pop()}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[14px] px-4 text-sm font-medium transition-colors',
              active
                ? 'bg-admin-primary font-bold text-white'
                : 'text-admin-on-surface-variant hover:bg-admin-surface-low hover:text-admin-on-surface',
            )}
          >
            {tab.label}
            {tab.href === '/admin/catalog/products' && productCount !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums',
                  active ? 'bg-white text-admin-primary' : 'bg-admin-surface-low text-admin-on-surface-variant',
                )}
              >
                {productCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

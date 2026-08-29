'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminReady } from './admin-ready';
import { DashboardSkeleton, ListPageSkeleton, DetailPageSkeleton, FormPageSkeleton } from '@/components/admin/skeleton';
import { OrderRegisterSkeleton } from '@/app/(admin)/admin/orders/_components/order-register-skeleton';

function PageSkeleton({ pathname }: { pathname: string }) {
  if (/^\/admin\/orders\/[^/]+$/.test(pathname))
    return <DetailPageSkeleton leftSections={2} rightSections={3} leftVariant="list" />;
  if (/^\/admin\/customers\/[^/]+$/.test(pathname))
    return <DetailPageSkeleton leftSections={1} leftVariant="table" rightSections={3} />;

  if (/^\/admin\/marketing\/(new|[^/]+\/edit)$/.test(pathname)) return <FormPageSkeleton fields={4} />;
  if (/^\/admin\/catalog\/products\/(new|[^/]+\/edit)$/.test(pathname)) return <FormPageSkeleton fields={6} complex />;
  if (/^\/admin\/catalog\/categories\/(new|[^/]+\/edit)$/.test(pathname))
    return <FormPageSkeleton fields={3} headingSmall />;

  if (pathname === '/admin/orders') return <OrderRegisterSkeleton />;
  if (pathname === '/admin/customers') return <ListPageSkeleton filterCount={3} tableCols={5} />;
  if (pathname === '/admin/marketing') return <ListPageSkeleton withAction filterCount={2} tableCols={5} />;
  if (pathname === '/admin/catalog/categories')
    return <ListPageSkeleton withAction withFilter={false} tableCols={4} withThumb headingSmall />;
  if (pathname === '/admin/catalog' || pathname === '/admin/catalog/products')
    return (
      <ListPageSkeleton
        withAction
        withViewToggle
        withStatCards
        statCardCount={3}
        filterCount={5}
        tableCols={6}
        withThumb
      />
    );

  if (pathname === '/admin') return <DashboardSkeleton />;
  return <ListPageSkeleton />;
}

export function ContentReadyGate({ children }: { children: ReactNode }) {
  const ready = useAdminReady();
  const pathname = usePathname();

  return (
    <div className="relative min-w-0">
      {!ready && (
        <div aria-hidden="true" className="absolute inset-0 z-20 overflow-hidden bg-admin-bg">
          <PageSkeleton pathname={pathname} />
        </div>
      )}
      {children}
    </div>
  );
}

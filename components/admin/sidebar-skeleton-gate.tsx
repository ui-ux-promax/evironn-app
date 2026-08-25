'use client';

import { cn } from '@/lib/utils';
import { useAdminReady } from './admin-ready';

/** Covers the narrow rail until Material Symbols are ready, without changing its geometry. */
export default function SidebarSkeletonGate(): JSX.Element | null {
  const ready = useAdminReady();
  if (ready) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-10 grid place-items-center bg-[var(--admin-sidebar)]">
      <div className="grid gap-3">
        <div className="sk sk-circle mx-auto h-9 w-9" />
        {['d1', 'd2', 'd3', 'd4', 'd5'].map((delay) => (
          <div key={delay} className={cn('sk sk-circle h-11 w-11', delay)} />
        ))}
      </div>
    </div>
  );
}

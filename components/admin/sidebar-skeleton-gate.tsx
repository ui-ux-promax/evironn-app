'use client';

import { cn } from '@/lib/utils';
import { useAdminReady } from './admin-ready';

/** Covers the labelled sidebar until Material Symbols are ready, without changing its geometry. */
export default function SidebarSkeletonGate(): JSX.Element | null {
  const ready = useAdminReady();
  if (ready) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-10 bg-admin-surface px-4 py-7">
      <div className="grid gap-3">
        <div className="sk sk-line mb-8 h-10 w-36 rounded-[14px]" />
        {['d1', 'd2', 'd3', 'd4', 'd5'].map((delay) => (
          <div key={delay} className={cn('sk h-[46px] w-full rounded-[14px]', delay)} />
        ))}
      </div>
    </div>
  );
}

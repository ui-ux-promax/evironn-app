'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import type { StatusSegment } from '@/lib/admin/analytics';

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'hsl(var(--color-warning))',
  PROCESSING: 'hsl(var(--color-info))',
  SHIPPED: 'hsl(205 60% 40%)',
  DELIVERED: 'hsl(var(--color-success))',
  CANCELLED: 'hsl(var(--color-border))',
};

export function StatusDonut({ segments, total }: { segments: StatusSegment[]; total: number }) {
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const segmentKey = segments.map((segment) => `${segment.status}:${segment.count}`).join('|');
  const safeTotal = Math.max(total, 1);

  const stops = useMemo(() => {
    let cursor = 0;
    const segmentStops = segments.map((segment) => {
      const start = cursor;
      const width = (segment.count / safeTotal) * 100 * progress;
      cursor += width;
      return `${STATUS_COLOR[segment.status]} ${start}% ${cursor}%`;
    });

    return [...segmentStops, `hsl(var(--color-border)/.45) ${cursor}% 100%`];
  }, [progress, safeTotal, segments]);

  useEffect(() => {
    setProgress(0);
    setEntered(false);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      setEntered(true);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const duration = 650;

    const tick = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      setProgress(1 - (1 - elapsed) ** 3);
      if (elapsed < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    const enterFrame = requestAnimationFrame(() => setEntered(true));

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(enterFrame);
    };
  }, [segmentKey, total]);

  if (total === 0) {
    return (
      <p className="text-sm text-admin-on-surface-variant">
        {'\u0417\u0430\u043a\u0430\u0437\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[192px_minmax(0,1fr)] items-center gap-[22px] max-[640px]:grid-cols-1">
      <div
        className={cn(
          'grid aspect-square w-48 place-items-center rounded-full shadow-[inset_0_0_0_1px_hsl(var(--color-border)/.6)] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
          entered ? 'scale-100 opacity-100' : 'scale-[.88] opacity-0',
        )}
        style={{
          background: `radial-gradient(circle, var(--admin-surface) 0 48%, transparent 49%), conic-gradient(from -90deg, ${stops.join(', ')})`,
        }}
        aria-label={
          '\u0414\u0438\u0430\u0433\u0440\u0430\u043c\u043c\u0430 \u0441\u0442\u0430\u0442\u0443\u0441\u043e\u0432 \u0437\u0430\u043a\u0430\u0437\u043e\u0432'
        }
      >
        <div className="text-center">
          <strong className="block font-admin-head text-[34px] font-extrabold leading-[.95] tracking-[-.05em] text-admin-on-surface tabular-nums">
            {Math.round(total * progress)}
          </strong>
          <span className="mt-1 block text-[12px] font-bold text-admin-on-surface-variant">
            {'\u0437\u0430\u043a\u0430\u0437\u043e\u0432'}
          </span>
        </div>
      </div>
      <div className="grid gap-[11px]">
        {segments.map((segment, index) => (
          <div
            key={segment.status}
            className={cn(
              'grid grid-cols-[11px_1fr_auto] items-center gap-[10px] text-[13px] text-admin-on-surface-variant transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
              entered ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0',
            )}
            style={{ transitionDelay: entered ? `${180 + index * 80}ms` : '0ms' }}
          >
            <span className="h-[11px] w-[11px] rounded-full" style={{ background: STATUS_COLOR[segment.status] }} />
            <span>{segment.label}</span>
            <strong className="font-mono text-[12px] text-admin-on-surface tabular-nums">
              {Math.round((segment.count / total) * 100)}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PriceTag({
  price,
  compareAtPrice,
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
}) {
  const showOld = compareAtPrice != null && compareAtPrice > price;
  return (
    <p className={cn('tnum flex flex-col items-end gap-0.5 font-bold leading-none', className)}>
      <span className="text-[1.12em]">{formatPrice(price)}</span>
      {showOld && (
        <span className="self-end text-ink-muted text-xs font-medium leading-none line-through">
          {formatPrice(compareAtPrice!)}
        </span>
      )}
    </p>
  );
}

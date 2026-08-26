import type { AriaAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  'aria-hidden'?: AriaAttributes['aria-hidden'];
}

// Material Symbols wrapper. CSS для .material-symbols-outlined и .fill — в globals.css
export function Icon({ name, filled, className, ...props }: IconProps) {
  return (
    <span className={cn('material-symbols-outlined', filled && 'fill', className)} {...props}>
      {name}
    </span>
  );
}

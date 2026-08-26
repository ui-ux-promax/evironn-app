import * as React from 'react';
import { cn } from '@/lib/utils';

// Admin text input — forwardRef, lime focus ring, без dark: вариантов
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'admin-control admin-input flex min-h-9 w-full rounded-[10px] border border-admin-outline-variant bg-admin-surface',
          'px-3 py-2 text-[13px] text-admin-on-surface transition-[border-color,box-shadow]',
          'placeholder:text-admin-on-surface-variant',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

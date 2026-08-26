'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin-кнопка: токены через CSS-переменные .admin-root, dark: варианты НЕ используются
const buttonVariants = cva(
  'admin-control admin-button inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] text-xs font-bold transition-[background-color,color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-admin-primary text-admin-on-primary hover:bg-admin-on-surface',
        secondary: 'border border-admin-outline bg-admin-surface text-admin-on-surface hover:bg-admin-surface-high',
        ghost: 'bg-transparent text-admin-on-surface hover:bg-admin-surface-high',
        outline: 'border border-admin-outline-variant bg-transparent text-admin-on-surface hover:bg-admin-surface-high',
        danger: 'border border-transparent text-admin-error hover:border-admin-error/30 hover:bg-admin-error/10',
      },
      size: {
        sm: 'min-h-8 px-3 text-xs',
        md: 'min-h-9 px-3.5',
        lg: 'min-h-10 px-4 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, disabled, loading, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

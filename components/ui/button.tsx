'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { FadeArc } from '@/components/loading-ui/fade-arc';
import { cn } from '@/lib/utils';

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      dark: 'btn-dark',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      link: 'btn-link',
    },
    size: { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

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
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {loading && <FadeArc className="h-5 w-5 shrink-0" aria-hidden="true" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

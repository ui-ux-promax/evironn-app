# Shared UI components

## `components/admin/ui/button.tsx` — Button

Primary, secondary, outline, ghost, and danger action button. Uses admin CSS variables and supports loading and `asChild`.

```tsx
'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'admin-control admin-button inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] text-xs font-bold transition-[background-color,color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface disabled:pointer-events-none disabled:opacity-50',
  { variants: { variant: { primary: 'bg-admin-primary text-admin-on-primary hover:bg-admin-on-surface', secondary: 'border border-admin-outline bg-admin-surface text-admin-on-surface hover:bg-admin-surface-high', ghost: 'bg-transparent text-admin-on-surface hover:bg-admin-surface-high', outline: 'border border-admin-outline-variant bg-transparent text-admin-on-surface hover:bg-admin-surface-high', danger: 'border border-transparent text-admin-error hover:border-admin-error/30 hover:bg-admin-error/10' }, size: { sm: 'min-h-8 px-3 text-xs', md: 'min-h-9 px-3.5', lg: 'min-h-10 px-4 text-sm' } },
  { defaultVariants: { variant: 'primary', size: 'md' } },
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; loading?: boolean; }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, children, disabled, loading, ...props }, ref) => { const Comp = asChild ? Slot : 'button'; return <Comp ref={ref} disabled={disabled || loading} className={cn(buttonVariants({ variant, size }), className)} {...props}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}</Comp>; });
Button.displayName = 'Button';
export { Button, buttonVariants };
```

## `components/admin/ui/input.tsx` — Input

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'admin-control admin-input flex min-h-9 w-full rounded-[10px] border border-admin-outline-variant bg-admin-surface px-3 py-2 text-[13px] text-admin-on-surface transition-[border-color,box-shadow] placeholder:text-admin-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
```

## `components/admin/ui/status.tsx` — Status badges

`AdminToneBadge` and `AdminStatusPill` render Russian order states as compact, color-independent badges. Valid states are `pending`, `processing`, `shipped`, `delivered`, and `cancelled`; tones are `neutral`, `info`, `success`, `warning`, and `danger`.

## Other relevant primitives

- `components/admin/ui/select.tsx` — Radix Select with `.admin-select-*` semantic hooks.
- `components/admin/ui/data-table.tsx` and `components/admin/ui/table.tsx` — accessible table wrappers.
- `components/admin/ui/dropdown-menu.tsx` — row action menu.
- `components/admin/admin-panel.tsx` — titled white operational surface.
- `components/admin/admin-page-header.tsx` — kicker, page title, subtitle, and actions.
- `components/admin/admin-tab-bar.tsx` — horizontal tab navigation.
- `components/admin/icon.tsx` — Material Symbol icon adapter; preserve the existing icon language.

'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

// Admin Switch: checked = lime (bg-admin-primary), unchecked = admin-surface-high
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-admin-outline-variant shadow-inner transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-admin-primary data-[state=checked]:bg-admin-primary data-[state=unchecked]:bg-admin-outline',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-admin-on-primary shadow-[0_2px_5px_hsl(220_12%_10%_/_0.2)] ring-0 transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        // в unchecked-состоянии thumb нужен нейтральный цвет
        'data-[state=unchecked]:bg-admin-surface',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

type Props = Omit<React.ComponentProps<'input'>, 'type'> & { error?: boolean };

// Поле пароля с переключателем показать/скрыть. forwardRef — чтобы работать с register() из RHF.
export const PasswordInput = React.forwardRef<HTMLInputElement, Props>(({ className, error, ...props }, ref) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn(
          'w-full h-12 pl-[42px] pr-11 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-[34px] h-[34px] grid place-items-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {show ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

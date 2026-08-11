'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const SIZE_ROWS = [
  ['XS', '82–86', '64–68', '88–92'],
  ['S', '86–90', '68–72', '92–96'],
  ['M', '90–96', '72–78', '96–102'],
  ['L', '96–102', '78–84', '102–108'],
  ['XL', '102–108', '84–90', '108–114'],
  ['XXL', '108–114', '90–96', '114–120'],
] as const;

export function SizeGuideDialog({ className }: { className?: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className={cn('text-ink-muted text-xs hover:text-ink', className)}>
          Таблица размеров
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(calc(100%-32px),620px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-line bg-surface p-5 shadow-[0_24px_80px_hsl(var(--color-text)/.2)] outline-none sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[26px] font-bold leading-none tracking-tight sm:text-[32px]">
                Таблица размеров
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-ink-muted">
                Все измерения указаны в сантиметрах.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              aria-label="Закрыть таблицу размеров"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink/30 hover:bg-surface-soft hover:text-ink"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </Dialog.Close>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[16px] border border-line">
            <table className="w-full min-w-[500px] border-collapse text-left text-sm">
              <thead className="bg-surface-soft text-xs font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Размер</th>
                  <th className="px-4 py-3">Обхват груди, см</th>
                  <th className="px-4 py-3">Обхват талии, см</th>
                  <th className="px-4 py-3">Обхват бёдер, см</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_ROWS.map(([size, chest, waist, hips]) => (
                  <tr key={size} className="border-t border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-bold">
                      {size}
                    </th>
                    <td className="px-4 py-3 tnum">{chest}</td>
                    <td className="px-4 py-3 tnum">{waist}</td>
                    <td className="px-4 py-3 tnum">{hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
            Если ваши параметры находятся между двумя размерами, выбирайте размер больше для более свободной посадки.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

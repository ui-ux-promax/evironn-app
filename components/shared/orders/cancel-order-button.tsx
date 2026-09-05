'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui';
import { cancelOrder } from '@/app/actions/order';

export function CancelOrderButton({
  orderId,
  className,
  children = 'Отменить заказ',
}: {
  orderId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCancellation = () => {
    setError(null);
    setConfirmOpen(true);
  };

  const confirmCancellation = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await cancelOrder(orderId);
      if (!res.ok) {
        setError(res.error);
        return;
      }

      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось отменить заказ');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="danger" size="md" className={className} onClick={requestCancellation} disabled={busy}>
        {children}
      </Button>

      <Dialog.Root open={confirmOpen} onOpenChange={(open) => !busy && setConfirmOpen(open)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(calc(100%-32px),480px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-line bg-surface p-5 shadow-[0_24px_80px_hsl(var(--color-text)/.2)] outline-none sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"
                aria-hidden="true"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="m10.3 3.8-8 13.9A2 2 0 0 0 4 20.7h16a2 2 0 0 0 1.7-3l-8-13.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </span>
              <Dialog.Close
                type="button"
                aria-label="Закрыть окно отмены заказа"
                disabled={busy}
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink/30 hover:bg-surface-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="mt-5">
              <Dialog.Title className="font-display text-[28px] font-bold leading-none tracking-tight sm:text-[32px]">
                Отменить заказ?
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-relaxed text-ink-muted">
                Заказ будет отменён, а товары вернутся в наличие. Это действие нельзя отменить.
              </Dialog.Description>
              {error && (
                <p className="mt-4 rounded-[14px] bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={busy}>
                Не отменять
              </Button>
              <Button variant="danger" onClick={confirmCancellation} loading={busy}>
                Отменить заказ
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {error && !confirmOpen && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

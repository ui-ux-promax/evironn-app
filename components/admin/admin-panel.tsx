import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  title?: string;
  note?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminPanel({ title, note, actions, children, className }: AdminPanelProps) {
  return (
    <section
      className={cn(
        'admin-panel rounded-2xl border border-admin-outline-variant bg-admin-surface p-[22px] shadow-[var(--admin-shadow-tight)]',
        className,
      )}
    >
      {(title || note || actions) && (
        <div className="admin-panel__head mb-[18px] flex flex-wrap items-start justify-between gap-3.5">
          <div>
            {title && (
              <h2 className="admin-panel__title font-admin-head text-base font-medium tracking-[-.005em] text-admin-on-surface">
                {title}
              </h2>
            )}
            {note && (
              <p className="admin-panel__note mt-[5px] max-w-[72ch] text-xs text-admin-on-surface-variant">{note}</p>
            )}
          </div>
          {actions && <div className="admin-panel__actions flex flex-wrap items-center gap-2.5">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

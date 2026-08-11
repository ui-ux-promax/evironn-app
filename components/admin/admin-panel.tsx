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
        'rounded-[24px] border border-admin-outline-variant bg-admin-surface p-[22px] shadow-[var(--admin-shadow-tight)]',
        className,
      )}
    >
      {(title || note || actions) && (
        <div className="mb-[18px] flex items-start justify-between gap-4 max-[760px]:grid">
          <div>
            {title && (
              <h2 className="font-admin-head text-[22px] font-extrabold leading-none tracking-[-.035em] text-admin-on-surface">
                {title}
              </h2>
            )}
            {note && <p className="mt-[7px] max-w-[72ch] text-[13px] text-admin-on-surface-variant">{note}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

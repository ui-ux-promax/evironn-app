import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const ADMIN_STATUS_VALUES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type AdminStatus = (typeof ADMIN_STATUS_VALUES)[number];

export const ADMIN_TONE_VALUES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
export type AdminTone = (typeof ADMIN_TONE_VALUES)[number];

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  pending: 'Ожидает',
  processing: 'В сборке',
  shipped: 'В доставке',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const TONE_CLASS: Record<AdminTone, string> = {
  neutral: 'border-admin-outline-variant bg-admin-surface-low text-admin-on-surface-variant',
  info: 'border-[color-mix(in_srgb,var(--admin-info)_24%,transparent)] bg-[color-mix(in_srgb,var(--admin-info)_12%,transparent)] text-[var(--admin-info)]',
  success:
    'border-[color-mix(in_srgb,var(--admin-money)_24%,transparent)] bg-[color-mix(in_srgb,var(--admin-money)_12%,transparent)] text-[var(--admin-money)]',
  warning:
    'border-[color-mix(in_srgb,var(--admin-warning)_34%,transparent)] bg-[color-mix(in_srgb,var(--admin-warning)_16%,transparent)] text-[hsl(38_62%_34%)]',
  danger:
    'border-[color-mix(in_srgb,var(--admin-error)_24%,transparent)] bg-[color-mix(in_srgb,var(--admin-error)_12%,transparent)] text-admin-error',
};

const STATUS_TONE: Record<AdminStatus, AdminTone> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
};

export interface AdminToneBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: AdminTone;
  children: ReactNode;
}

export function AdminToneBadge({ tone, className, children, ...props }: AdminToneBadgeProps) {
  return (
    <span
      className={cn(
        'admin-status-badge inline-flex min-h-[29px] w-fit items-center rounded-full border px-[10px] text-[12px] font-bold leading-none',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AdminStatusPillProps extends Omit<AdminToneBadgeProps, 'tone' | 'children'> {
  status: AdminStatus;
  label?: ReactNode;
}

export function AdminStatusPill({ status, label = ADMIN_STATUS_LABELS[status], ...props }: AdminStatusPillProps) {
  return (
    <AdminToneBadge tone={STATUS_TONE[status]} {...props}>
      {label}
    </AdminToneBadge>
  );
}

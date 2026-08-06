import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  'dark' | 'light' | 'warm' | 'success' | 'warning' | 'danger' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
}

export function Badge({
  tone = 'dark',
  className,
  children,
  ...props
}: BadgeProps) {
  const classes = ['evp-badge', `evp-badge--${tone}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span {...props} className={classes}>
      {children}
    </span>
  );
}

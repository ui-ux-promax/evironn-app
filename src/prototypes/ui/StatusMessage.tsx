import type { ReactNode } from 'react';

export type StatusKind = 'loading' | 'success' | 'error' | 'empty';

export interface StatusMessageProps {
  readonly kind: StatusKind;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function StatusMessage({
  kind,
  title,
  description,
  action,
}: StatusMessageProps) {
  const role = kind === 'error' ? 'alert' : 'status';

  return (
    <div className={`evp-status evp-status--${kind}`} role={role}>
      <strong className="evp-status__title">{title}</strong>
      {description ? (
        <p className="evp-status__description">{description}</p>
      ) : null}
      {action ? <div className="evp-status__action">{action}</div> : null}
    </div>
  );
}

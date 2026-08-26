import type { ReactNode } from 'react';

export type DemoDataTableColumn = Readonly<{ key: string; label: string }>;
export type DemoDataTableRow = Readonly<Record<string, string | number | null>>;

export function DemoPanel({
  title,
  note,
  children,
  className = '',
}: {
  title?: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  const classes = ['demo-admin-panel', className].filter(Boolean).join(' ');
  return (
    <section className={classes}>
      {(title || note) && (
        <div className="demo-admin-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {note && <p>{note}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

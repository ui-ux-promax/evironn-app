import type { ReactNode } from 'react';

export function DemoPageHeader({
  kicker,
  title,
  subtitle,
  aside,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="demo-admin-page-header">
      <div>
        <p className="demo-admin-kicker">{kicker}</p>
        <h1>{title}</h1>
        {subtitle && <p className="demo-admin-page-subtitle">{subtitle}</p>}
      </div>
      {aside && <div className="demo-admin-page-aside">{aside}</div>}
    </header>
  );
}

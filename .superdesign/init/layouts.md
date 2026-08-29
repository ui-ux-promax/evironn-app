# Shared layouts

## `app/(admin)/layout.tsx` — protected admin layout

```tsx
import type { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = { title: { default: 'Админка · Evironn', template: '%s · Админка' } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();
  return (
    <div className="admin-root font-admin-body min-h-screen overflow-visible">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
      />
      <AdminShell user={session.user}>{children}</AdminShell>
    </div>
  );
}
```

## `components/admin/admin-shell.tsx` — primary shell

The protected shell owns the fixed labelled sidebar, top utility bar, authenticated user block, mobile navigation and page frame. It uses the actual Evironn logo at `/assets/evironn-logo.svg`, maps `ADMIN_NAV`, and renders `children` inside `main > .inner`. Its desktop shell has a 186 px labelled sidebar; the top bar contains the visual search utility and profile/sign-out actions. Do not replace it with an invented sidebar or logo.

## `app/(admin)/admin/catalog/layout.tsx` — catalog sub-navigation

```tsx
import { CatalogTabs } from './_components/catalog-tabs';
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <CatalogTabs />
      {children}
    </div>
  );
}
```

## `app/(admin)/admin/catalog/_components/catalog-tabs.tsx` — tab shell

It maps the canonical `ADMIN_CATALOG_TABS` to `Товары`, `Категории`, `Опции`, `Комнаты`, and `Остатки`. The active tab has a forest-green underline; keep those five destinations present in every catalog design.

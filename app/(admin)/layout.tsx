/**
 * Layout для маршрутной группы (admin).
 * SERVER component — можно использовать async/await, cookies(), requireAdminPage().
 * Не содержит <html>/<body> — они принадлежат корневому layout.tsx.
 */

import type { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = {
  title: {
    default: 'Админка · Evironn',
    template: '%s · Админка',
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Гейт: перенаправляет не-админов до рендера — получаем сессию
  const session = await requireAdminPage();

  return (
    <div className="admin-root font-admin-body min-h-screen overflow-visible">
      {/* Material Symbols icon font — нужен только в админке, поэтому здесь, а не в корне.
          display=block: пока шрифт не пришёл, глиф не рендерится текстом лигатуры
          (никаких «dashboard», «inventory_2» в сайдбаре) — «невидимый период» ~3s,
          который к тому же перекрыт скелетон-оверлеем сайдбара. preconnect ускоряет CDN. */}
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

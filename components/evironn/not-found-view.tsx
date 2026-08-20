import Link from 'next/link';

import { PUBLIC_ROUTES } from '@/components/evironn/public-routes';

export function NotFoundView() {
  return (
    <main className="not-found-page" id="main-content">
      <section className="not-found-page__shell" aria-labelledby="not-found-title">
        <p className="not-found-page__eyebrow">404</p>
        <h1 id="not-found-title">Страница не найдена</h1>
        <p className="not-found-page__copy">
          Похоже, ссылка устарела или адрес был введен с ошибкой. Вернитесь на понятный публичный маршрут и продолжите
          просмотр.
        </p>
        <nav className="not-found-page__actions" aria-label="Основные маршруты">
          <Link className="not-found-page__action not-found-page__action--primary" href={PUBLIC_ROUTES.home}>
            На главную
          </Link>
          <Link className="not-found-page__action" href={PUBLIC_ROUTES.catalog}>
            Открыть каталог
          </Link>
          <Link className="not-found-page__action" href={PUBLIC_ROUTES.cart}>
            Перейти в корзину
          </Link>
        </nav>
      </section>
    </main>
  );
}

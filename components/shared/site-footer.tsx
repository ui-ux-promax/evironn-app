import Link from 'next/link';
import { RevealObserver } from './motion/reveal-observer';

type FooterLinkItem = { label: string; href: string };

const columns: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: 'Магазин',
    links: [
      { label: 'Каталог', href: '/catalog' },
      { label: 'Новинки', href: '/catalog?sort=new' },
      { label: 'Корзина', href: '/cart' },
      { label: 'Избранное', href: '/wishlist' },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { label: 'Профиль', href: '/profile' },
      { label: 'Заказы', href: '/profile' },
      { label: 'Войти', href: '/login' },
      { label: 'Регистрация', href: '/register' },
    ],
  },
  {
    title: 'Проект',
    links: [
      { label: 'Главная', href: '/' },
      { label: 'Демо админ-панели', href: '/demo-admin' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-[70px] overflow-hidden bg-footer pb-px text-white">
      <RevealObserver className="footer-motion">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-[52px] pb-9 min-[640px]:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div data-reveal="left" className="col-span-2 min-[640px]:col-span-1">
              <Link href="/" className="font-display text-2xl font-bold tracking-[-0.05em]">
                Evironn
              </Link>
              <p className="mt-2.5 max-w-[320px] text-sm text-white/60">
                Мебельный интернет-магазин. Перенос каталога и интерфейса выполняется поэтапно.
              </p>
            </div>
            {columns.map((column, index) => (
              <div key={column.title} data-reveal="up" data-reveal-delay={index + 1}>
                <h4 className="mb-2 text-sm font-bold">{column.title}</h4>
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block py-[5px] text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div
            data-reveal="up"
            data-reveal-delay="4"
            className="flex flex-wrap justify-between gap-4 border-t border-white/[0.12] py-[18px] text-xs text-white/45"
          >
            <span>© 2026 Evironn</span>
            <span>Furniture commerce · RU</span>
          </div>
        </div>
      </RevealObserver>
    </footer>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { CategoryCountdown } from './category-countdown';

export interface BentoCategory {
  slug: string;
  name: string;
  tagline: string | null;
  count: number;
}

interface Tile {
  key: string;
  slug: string | null;
  href: string;
  image: string;
  gradient: string;
  badge: string;
  title: string;
  subtitle: string;
  span: string;
  ariaLabel: string;
}

const TILES: Tile[] = [
  {
    key: 'tees',
    slug: 'tees',
    href: '/catalog?category=tees',
    image: '/products/product-white-tee.png',
    gradient: 'linear-gradient(135deg, hsl(var(--color-accent)/.28) 0%, hsl(var(--color-surface-soft)) 100%)',
    badge: 'TEES',
    title: 'Футболки',
    subtitle: 'Плотная база на каждый день',
    span: 'col-span-2 row-span-2',
    ariaLabel: 'Диваны Evironn',
  },
  {
    key: 'hoodies',
    slug: 'hoodies',
    href: '/catalog?category=hoodies',
    image: '/products/product-soft-hoodie.png',
    gradient: 'linear-gradient(135deg, hsl(var(--color-warm-accent)/.28) 0%, hsl(var(--color-surface-soft)) 100%)',
    badge: 'HOODIES',
    title: 'Худи и слои',
    subtitle: 'Мягкий футер, спокойный объем',
    span: 'col-span-2 row-span-1',
    ariaLabel: 'Кресла Evironn',
  },
  {
    key: 'limited',
    slug: null,
    href: '/catalog?sort=discount',
    image: '/products/product-pink-outer.png',
    gradient: 'linear-gradient(135deg, hsl(var(--color-danger)) 0%, hsl(var(--color-danger)/.82) 100%)',
    badge: 'DROP',
    title: 'Сезонный дроп',
    subtitle: '',
    span: 'col-span-1 row-span-1',
    ariaLabel: 'Новая коллекция Evironn',
  },
  {
    key: 'outerwear',
    slug: 'outerwear',
    href: '/catalog?category=outerwear',
    image: '/products/product-pink-outer.png',
    gradient: 'linear-gradient(135deg, hsl(var(--color-info)/.18) 0%, hsl(var(--color-surface-soft)) 100%)',
    badge: 'OUTER',
    title: 'Верхняя одежда',
    subtitle: 'Легкие куртки на межсезонье',
    span: 'col-span-1 row-span-1',
    ariaLabel: 'Мебель Evironn',
  },
];

export function CategoryBento({ categories }: { categories: BentoCategory[] }) {
  const countBySlug = new Map(categories.map((c) => [c.slug, c.count]));
  const count = (slug: string | null) => (slug ? (countBySlug.get(slug) ?? 0) : 0);

  const tees = TILES[0];
  const hoodies = TILES[1];
  const limited = TILES[2];
  const outerwear = TILES[3];

  return (
    <section id="cats" className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-16 sm:pt-20">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="label mb-1.5">Категории</p>
          <h2 className="font-display font-bold text-[28px] sm:text-[40px] leading-tight">Под твой темп</h2>
        </div>
        <Link href="/catalog" className="btn btn-md btn-ghost hidden sm:inline-flex">
          Весь каталог →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[180px]">
        <Link
          href={tees.href}
          className={`${tees.span} rounded-2xl overflow-hidden group relative transition-transform duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          style={{ background: tees.gradient }}
          aria-label={`${tees.ariaLabel} - ${count(tees.slug)} моделей`}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all duration-500 z-10" />
          <Image
            src={tees.image}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end z-20">
            <div className="transform group-hover:translate-y-[-8px] transition-transform duration-500">
              <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-[11px] font-semibold rounded-full mb-2 sm:mb-3 uppercase tracking-wide">
                {tees.badge}
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-1 sm:mb-2 drop-shadow-lg">
                {tees.title}
              </h3>
              <p className="text-ink/80 text-xs sm:text-sm mb-3 sm:mb-4 drop-shadow">{tees.subtitle}</p>
              <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 bg-ink text-surface rounded-full font-semibold text-sm group-hover:bg-ink/90 transition-colors">
                <span className="hidden sm:inline">Смотреть подборку</span>
                <span className="sm:hidden tnum">{count(tees.slug)} моделей</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </Link>

        <Link
          href={hoodies.href}
          className={`${hoodies.span} rounded-2xl overflow-hidden group relative transition-transform duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          style={{ background: hoodies.gradient }}
          aria-label={`${hoodies.ariaLabel} - ${count(hoodies.slug)} моделей`}
        >
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500 z-10" />
          <Image
            src={hoodies.image}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 p-4 sm:p-6 flex items-center justify-between z-20">
            <div className="transform group-hover:translate-x-2 transition-transform duration-500">
              <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-[11px] font-semibold rounded-full mb-2 uppercase tracking-wide">
                {hoodies.badge}
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-ink drop-shadow-lg">{hoodies.title}</h3>
              <p className="text-ink/70 text-xs sm:text-sm drop-shadow hidden sm:block">{hoodies.subtitle}</p>
              <p className="text-ink/70 text-xs tnum mt-1 sm:hidden">{count(hoodies.slug)} моделей</p>
            </div>
          </div>
        </Link>

        <Link
          href={limited.href}
          className={`${limited.span} rounded-2xl overflow-hidden group relative transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 animate-pulse-glow`}
          style={{ background: limited.gradient }}
          aria-label={limited.ariaLabel}
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500 z-10" />
          <Image
            src={limited.image}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover group-hover:scale-110 transition-all duration-700"
          />
          <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-20">
            <span className="inline-block w-fit px-2 py-1 bg-white text-danger text-[10px] sm:text-xs font-bold rounded-full uppercase">
              {limited.badge}
            </span>
            <div className="transform group-hover:translate-y-[-4px] transition-transform duration-500">
              <h3 className="font-display font-bold text-base sm:text-lg text-white drop-shadow-lg mb-2">
                {limited.title}
              </h3>
              <CategoryCountdown />
            </div>
          </div>
        </Link>

        <Link
          href={outerwear.href}
          className={`${outerwear.span} rounded-2xl overflow-hidden group relative transition-transform duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          style={{ background: outerwear.gradient }}
          aria-label={`${outerwear.ariaLabel} - ${count(outerwear.slug)} моделей, в тренде`}
        >
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500 z-10" />
          <Image
            src={outerwear.image}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-warning text-ink px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
              {outerwear.badge}
            </div>
          </div>
          <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end z-20">
            <div className="transform group-hover:translate-y-[-4px] transition-transform duration-500">
              <h3 className="font-display font-bold text-lg sm:text-xl text-white drop-shadow-lg mb-1">
                {outerwear.title}
              </h3>
              <p className="text-white/90 text-xs drop-shadow">{outerwear.subtitle}</p>
              <p className="text-white/80 text-[10px] tnum mt-1">{count(outerwear.slug)} моделей</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4 sm:hidden">
        <Link href="/catalog" className="btn btn-md btn-ghost w-full">
          Весь каталог →
        </Link>
      </div>
    </section>
  );
}

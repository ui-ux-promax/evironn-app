import Link from 'next/link';
import { ProductCard } from '@/components/shared/product-card';
import type { ProductCardData } from '@/lib/product-summary';

const FILTER_TABS = [
  { label: 'Все', filter: 'all' },
  { label: 'Верхняя одежда', filter: 'outerwear' },
  { label: 'Низ', filter: 'bottom' },
  { label: 'Топы', filter: 'tops' },
  { label: 'Loungewear', filter: 'loungewear' },
  { label: 'Кроссовки', filter: 'sneakers' },
];

export function BestsellersSection({
  products,
  wishlistedIds,
}: {
  products: ProductCardData[];
  wishlistedIds: Set<string>;
}) {
  return (
    <section id="products" className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-14 md:pt-[78px]">
      {/* Heading */}
      <div data-reveal="up" className="grid justify-items-center gap-5 mb-9">
        <h2 className="font-display font-bold text-[28px] md:text-[38px] leading-[1.05] text-center">
          Просмотрите все, что нужно.
        </h2>
        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2" aria-label="Фильтр товаров">
          {FILTER_TABS.map((tab, i) => (
            <Link
              key={tab.filter}
              href={tab.filter === 'all' ? '/catalog' : `/catalog?category=${tab.filter}`}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-line bg-surface text-ink hover:border-ink'
              }`}
              aria-pressed={i === 0}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      {/* Product grid — 3 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p, index) => (
          <div key={p.slug} data-reveal="up" data-reveal-delay={Math.min(index + 1, 6)}>
            <ProductCard data={p} wishlisted={wishlistedIds.has(p.id)} landingMotion />
          </div>
        ))}
      </div>
      {/* View more */}
      <div data-reveal="up" data-reveal-delay="2" className="flex justify-center mt-10">
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground min-h-[48px] px-7 font-bold transition-transform duration-200 [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-px active:scale-[.97] motion-reduce:transform-none"
        >
          Смотреть больше
        </Link>
      </div>
    </section>
  );
}

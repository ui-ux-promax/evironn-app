import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { findProducts } from '@/lib/find-products';
import { buildCatalogItemListJsonLd, catalogSeoDescription } from '@/lib/seo';
import { CatalogProductCard } from '@/components/shared/catalog/catalog-product-card';
import { FilterSidebar } from '@/components/shared/catalog/filter-sidebar';
import { MobileFilterDrawer } from '@/components/shared/catalog/mobile-filter-drawer';
import { SortSelect } from '@/components/shared/catalog/sort-select';
import { ActiveFilterChips } from '@/components/shared/catalog/active-filter-chips';
import { Pagination } from '@/components/shared/catalog/pagination';
import { CatalogHero } from '@/components/shared/catalog/catalog-hero';
import { EmptyCatalog } from '@/components/shared/catalog/catalog-states';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Каталог мебели | Evironn',
  description: catalogSeoDescription,
  alternates: { canonical: '/catalog' },
  openGraph: {
    title: 'Каталог мебели Evironn',
    description: catalogSeoDescription,
    url: '/catalog',
    images: [{ url: '/assets/products/03-ivory-lounge-idle.webp', alt: 'Каталог мебели Evironn' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Каталог мебели Evironn',
    description: catalogSeoDescription,
    images: ['/assets/products/03-ivory-lounge-idle.webp'],
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { products, total, page, totalPages, facets } = await findProducts(sp);
  const itemListJsonLd = buildCatalogItemListJsonLd(products);

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <CatalogHero total={total} />
      <nav className="flex items-center gap-2 text-xs text-ink-muted mt-4 mb-2" aria-label="Хлебные крошки">
        <Link href="/" className="hover:text-ink">
          Главная
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
        <span className="text-ink font-semibold">Каталог</span>
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <FilterSidebar facets={facets} />
        <div>
          <div className="sticky top-[56px] z-30 -mx-4 mb-4 flex min-w-0 items-center gap-2 border-b border-line px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:gap-3 sm:px-6 md:static md:mx-0 md:border-0 md:px-0 md:py-0 md:backdrop-blur-0">
            <Suspense>
              <MobileFilterDrawer facets={facets} total={total} />
            </Suspense>
            <p className="text-sm text-ink-muted hidden sm:block">
              Найдено <span className="font-semibold text-ink tnum">{total}</span>
            </p>
            <div className="flex-1" />
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          <Suspense>
            <ActiveFilterChips facets={facets} />
          </Suspense>
          {products.length === 0 ? (
            <EmptyCatalog />
          ) : (
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {products.map((product) => (
                <CatalogProductCard key={product.slug} data={product} />
              ))}
            </div>
          )}
          <Suspense>
            <Pagination page={page} totalPages={totalPages} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

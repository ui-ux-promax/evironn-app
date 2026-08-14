import type { Metadata } from 'next';
import { findProducts } from '@/lib/find-products';
import { buildCatalogItemListJsonLd, catalogSeoDescription } from '@/lib/seo';
import { buildCatalogBModel } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { CatalogVariantB } from '@/components/evironn/catalog/catalog-variant-b';

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
  const result = await findProducts(sp);
  const itemListJsonLd = buildCatalogItemListJsonLd(result.products);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <CatalogVariantB model={buildCatalogBModel(result)} />
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductView } from '@/components/shared/product/product-view';
import { getFurnitureProductBySlug } from '@/lib/get-furniture-product';
import {
  parseOptionParam,
  resolveSelectedSku,
  serializeOptionParam,
  type ResolvedProductSelection,
} from '@/lib/product-selection';
import { absoluteUrl, buildBreadcrumbListJsonLd, buildProductJsonLd, siteName } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type RawSearchParams = { option?: string | string[] };
type ProductPageParams = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function normalizeSpecs(value: unknown): Record<string, string> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function resolveSelection(
  product: Awaited<ReturnType<typeof getFurnitureProductBySlug>>,
  rawOption: string | undefined,
): ResolvedProductSelection {
  if (!product) notFound();

  try {
    return resolveSelectedSku(product, parseOptionParam(rawOption));
  } catch {
    notFound();
  }
}

function canonicalMedia(selection: ResolvedProductSelection): string[] {
  const media = selection.images.map((image) => image.url);
  const fallback = selection.turntable?.fallbackUrl;
  return fallback && !media.includes(fallback) ? [...media, fallback] : media;
}

export async function generateMetadata({ params, searchParams }: ProductPageParams): Promise<Metadata> {
  const { slug } = await params;
  const { option } = await searchParams;
  const product = await getFurnitureProductBySlug(slug);
  if (!product) return { title: 'Товар не найден', robots: { index: false, follow: false } };

  const selection = resolveSelection(product, first(option));
  const canonicalOption = serializeOptionParam(selection.canonicalSelection);
  const canonicalPath = `/product/${slug}?option=${encodeURIComponent(canonicalOption)}`;
  const primaryImage = selection.images[0];
  const socialImage =
    primaryImage ??
    (selection.turntable ? { url: selection.turntable.fallbackUrl, alt: selection.turntable.alt } : null);
  const description = product.description ?? undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: product.name,
      description,
      url: canonicalPath,
      siteName,
      type: 'website',
      ...(socialImage ? { images: [{ url: absoluteUrl(socialImage.url), alt: socialImage.alt }] } : {}),
    },
    ...(socialImage
      ? {
          twitter: {
            card: 'summary_large_image' as const,
            title: product.name,
            description,
            images: [absoluteUrl(socialImage.url)],
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageParams): Promise<React.JSX.Element> {
  const { slug } = await params;
  const { option } = await searchParams;
  const product = await getFurnitureProductBySlug(slug);
  if (!product) notFound();

  const selection = resolveSelection(product, first(option));
  const specs = normalizeSpecs(product.specs);
  const canonicalOption = serializeOptionParam(selection.canonicalSelection);
  const canonicalPath = `/product/${slug}?option=${encodeURIComponent(canonicalOption)}`;
  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    images: canonicalMedia(selection),
    variants: product.skus.map(({ price, stock }) => ({ price, stock, active: true })),
    url: canonicalPath,
  });
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Каталог', url: '/catalog' },
    { name: product.category.name, url: `/catalog?category=${product.category.slug}` },
    { name: product.name, url: canonicalPath },
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductView
        product={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          specs,
          category: product.category,
        }}
        selection={selection}
      />
    </div>
  );
}

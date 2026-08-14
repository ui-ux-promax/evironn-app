import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ProductPage from '@/components/evironn/product/ProductPage';
import { getFurnitureProductBySlug } from '@/lib/get-furniture-product';
import { buildShowcaseProductPageDto, SHOWCASE_PRODUCT_SLUG } from '@/lib/showcase-product';
import { absoluteUrl, buildBreadcrumbListJsonLd, buildProductJsonLd, siteName } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type RawSearchParams = { option?: string | string[] };
type ProductPageParams = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const supportedOptionGroups = new Set(['finish', 'upholstery']);

function hasUnsupportedOptionGroup(rawOption: string | undefined): boolean {
  if (!rawOption) return false;

  return rawOption.split(',').some((token) => {
    const parts = token.split(':');
    if (parts.length !== 2) return false;
    const group = parts[0].trim().toLowerCase();
    return Boolean(group) && !supportedOptionGroups.has(group);
  });
}

async function getShowcaseModel(rawOption: string | undefined) {
  const product = await getFurnitureProductBySlug(SHOWCASE_PRODUCT_SLUG);
  if (!product) notFound();

  try {
    return buildShowcaseProductPageDto({ ...product, description: product.description ?? undefined }, rawOption);
  } catch {
    notFound();
  }
}

export async function generateMetadata({ searchParams }: ProductPageParams): Promise<Metadata> {
  const { option } = await searchParams;
  const rawOption = first(option);
  const model = await getShowcaseModel(hasUnsupportedOptionGroup(rawOption) ? undefined : rawOption);
  const canonicalPath = model.selected.canonicalPath;
  const socialImage = absoluteUrl(model.turntable.posterUrl);

  return {
    title: model.product.name,
    description: model.product.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: model.product.name,
      description: model.product.description,
      url: canonicalPath,
      siteName,
      type: 'website',
      images: [{ url: socialImage, alt: model.turntable.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: model.product.name,
      description: model.product.description,
      images: [socialImage],
    },
  };
}

export default async function ProductRoute({ params, searchParams }: ProductPageParams): Promise<React.JSX.Element> {
  const { slug } = await params;
  const { option } = await searchParams;
  const rawOption = first(option);

  if (slug !== SHOWCASE_PRODUCT_SLUG) {
    const defaultModel = await getShowcaseModel(undefined);
    redirect(defaultModel.selected.canonicalPath);
  }

  const model = await getShowcaseModel(hasUnsupportedOptionGroup(rawOption) ? undefined : rawOption);
  if (rawOption !== model.selected.canonicalOption) redirect(model.selected.canonicalPath);

  const canonicalPath = model.selected.canonicalPath;
  const productJsonLd = buildProductJsonLd({
    name: model.product.name,
    description: model.product.description,
    images: [model.turntable.posterUrl],
    variants: model.combinations.map(({ sku }) => ({ price: sku.price, stock: sku.stock, active: true })),
    url: canonicalPath,
  });
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f', url: '/' },
    { name: '\u041a\u0430\u0442\u0430\u043b\u043e\u0433', url: '/catalog' },
    { name: model.product.categoryName, url: `/catalog?category=${model.product.categorySlug}` },
    { name: model.product.name, url: canonicalPath },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductPage model={model} />
    </>
  );
}

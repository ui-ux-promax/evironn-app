import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { prisma } from '@/lib/prisma-client';
import { getProductBySlug } from '@/lib/get-product';
import { absoluteUrl, buildBreadcrumbListJsonLd, buildProductJsonLd, defaultOgImage, siteName } from '@/lib/seo';
import { productCardInclude, buildProductCardData } from '@/lib/product-summary';
import { normalizeSize } from '@/lib/format';
import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';
import { isNewByDate } from '@/lib/product-badges';
import { ProductCard } from '@/components/shared/product-card';
import { Breadcrumbs } from '@/components/shared/product/breadcrumbs';
import { ProductGallery } from '@/components/shared/product/product-gallery';
import { PurchasePanel } from '@/components/shared/product/purchase-panel';
import { ProductView } from '@/components/shared/product/product-view';
import { auth } from '@/auth';
import { getReviewEligibility } from '@/lib/review';
import { getWishlistProductIds } from '@/lib/wishlist';
import { wishlistCookieName } from '@/lib/wishlist-cookie';
import { RatingStars } from '@/components/shared/product/rating-stars';
import { ReviewsSection } from '@/components/shared/product/reviews-section';
import type { ReviewItem } from '@/components/shared/product/review-list';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ color?: string }> };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    select: {
      name: true,
      description: true,
      colorways: {
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
        take: 1,
        select: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  });
  if (!product) return { title: 'Товар не найден', robots: { index: false, follow: false } };
  const description = product.description ?? undefined;
  const primaryImage = product.colorways[0]?.images[0];
  const image = absoluteUrl(primaryImage?.url ?? defaultOgImage);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/product/${slug}`,
      siteName,
      type: 'website',
      images: [{ url: image, alt: primaryImage?.alt ?? product.name }],
    },
    twitter: { card: 'summary_large_image', title: product.name, description, images: [image] },
  };
}

export default async function ProductPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { color } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const active =
    product.colorways.find((c) => c.slug === color) ??
    product.colorways.find((c) => c.isDefault) ??
    product.colorways[0];
  if (!active) notFound();

  const now = new Date();
  const relatedRaw = await prisma.product.findMany({
    where: { active: true, categoryId: product.categoryId, NOT: { id: product.id } },
    take: 4,
    orderBy: { sortOrder: 'asc' },
    include: productCardInclude,
  });
  const related = relatedRaw.map((p) =>
    buildProductCardData(p, now, { newWindowDays: NEW_PRODUCT_WINDOW_DAYS, lowStock: LOW_STOCK_THRESHOLD }),
  );

  const [agg, reviewRows, session] = await Promise.all([
    prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true }),
    prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, rating: true, body: true, createdAt: true, user: { select: { name: true } } },
    }),
    auth(),
  ]);
  const reviews: ReviewItem[] = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt,
    authorName: r.user.name?.trim() ? r.user.name : 'Покупатель',
  }));
  const avg = agg._avg.rating ?? 0;
  const count = agg._count;

  // TEMP: mock reviews if none exist, to preview review layout
  const hasMockReviews = reviews.length === 0;
  const mockReviews: ReviewItem[] = hasMockReviews
    ? [
        {
          id: 'mock-1',
          rating: 5,
          body: 'Очень мягкий и плотный материал, держит форму после стирки. Размер M сел свободно, как и ожидал. Цвет в жизни приятнее, чем на фото.',
          createdAt: new Date('2025-12-12'),
          authorName: 'Александр Стрелков',
        },
        {
          id: 'mock-2',
          rating: 4,
          body: 'Беру второй цвет — нравится посадка. Сняла бы балл только за длину шнурков, в остальном отличное худи на каждый день.',
          createdAt: new Date('2025-12-02'),
          authorName: 'Марина Котова',
        },
        {
          id: 'mock-3',
          rating: 5,
          body: 'Заказывал в подарок, доставили за два дня. Упаковано аккуратно, бирки на месте. Брат доволен, размер угадали.',
          createdAt: new Date('2025-11-24'),
          authorName: 'Дмитрий Власов',
        },
      ]
    : [];
  const displayReviews = hasMockReviews ? mockReviews : reviews;
  const displayAvg = hasMockReviews ? 4.7 : avg;
  const displayCount = hasMockReviews ? 3 : count;
  const reviewState: 'eligible' | 'guest' | 'not-purchased' | 'already-reviewed' = session?.user?.id
    ? await getReviewEligibility(session.user.id, product.id)
    : 'guest';

  const wlStore = await cookies();
  const wishlistedIds = await getWishlistProductIds(session, wlStore.get(wishlistCookieName)?.value);

  const fallbackImages = [
    '/products/product-white-tee.png',
    '/products/product-black-tee.png',
    '/products/product-soft-hoodie.png',
  ];
  const colorwaysForView = product.colorways.map((colorway) => {
    const galleryImages = colorway.images.map((image) => ({ url: image.url, alt: image.alt ?? product.name }));
    while (galleryImages.length < 3) {
      galleryImages.push({
        url: fallbackImages[galleryImages.length % fallbackImages.length],
        alt: `${product.name} — фото ${galleryImages.length + 1}`,
      });
    }
    return {
      slug: colorway.slug,
      name: colorway.name,
      swatchHex: colorway.swatchHex,
      thumbUrl: colorway.images[0]?.url ?? null,
      galleryImages,
      variants: colorway.variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        stock: variant.stock,
        active: variant.active,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
      })),
    };
  });
  const galleryImages = colorwaysForView.find((colorway) => colorway.slug === active.slug)?.galleryImages ?? [];
  const soldOut = !active.variants.some((v) => v.active && v.stock > 0);
  const galleryIsNew = !soldOut && isNewByDate(product.createdAt, now, NEW_PRODUCT_WINDOW_DAYS);
  const specs = (product.specs ?? null) as Record<string, string> | null;
  const productUrl = `/product/${product.slug}${active.slug ? `?color=${active.slug}` : ''}`;
  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    images: galleryImages.map((g) => g.url),
    variants: product.colorways.flatMap((colorway) => colorway.variants),
    url: productUrl,
    rating: count > 0 ? { value: avg, count } : null,
  });
  const breadcrumbItems = [
    { name: 'Главная', url: '/' },
    { name: 'Каталог', url: '/catalog' },
    { name: product.category.name, url: `/catalog?category=${product.category.slug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ];
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(breadcrumbItems);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <ProductView
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          fitNote: product.fitNote,
          description: product.description,
          specs,
          category: product.category,
        }}
        isNew={galleryIsNew}
        colorways={colorwaysForView}
        initialColorwaySlug={active.slug}
        ratingAvg={displayCount > 0 ? displayAvg : null}
        ratingCount={displayCount}
        reviews={displayReviews}
        reviewState={reviewState}
        related={related}
        wishlistedIds={wishlistedIds}
        wishlisted={wishlistedIds.has(product.id)}
        productId={product.id}
      />
    </div>
  );
}

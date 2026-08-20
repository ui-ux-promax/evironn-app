'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PurchasePanel } from './purchase-panel';
import { WishlistHeart } from '@/components/shared/wishlist/wishlist-heart';
import { ReviewsSection } from './reviews-section';
import { Breadcrumbs } from './breadcrumbs';
import { ProductCard } from '@/components/shared/product-card';
import { PriceTag } from '@/components/shared/price-tag';
import type { ReviewItem } from './review-list';
import type { PanelColorway, PanelVariant } from './purchase-panel';
import type { ProductCardData } from '@/lib/product-summary';
import { cn } from '@/lib/utils';

interface GalleryImage {
  url: string;
  alt: string;
}
interface ProductColorwayView extends PanelColorway {
  galleryImages: GalleryImage[];
  variants: PanelVariant[];
}

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    fitNote: string | null;
    description: string | null;
    specs: Record<string, string> | null;
    category: { name: string; slug: string };
  };
  isNew: boolean;
  colorways: ProductColorwayView[];
  initialColorwaySlug: string;
  ratingAvg: number | null;
  ratingCount: number;
  reviews: ReviewItem[];
  reviewState: 'eligible' | 'guest' | 'not-purchased' | 'already-reviewed';
  related: ProductCardData[];
  wishlistedIds: Set<string>;
  wishlisted: boolean;
  productId: string;
}

export function ProductView({
  product,
  isNew,
  colorways,
  initialColorwaySlug,
  ratingAvg,
  ratingCount,
  reviews,
  reviewState,
  related,
  wishlistedIds,
  wishlisted,
  productId,
}: Props) {
  const router = useRouter();
  const [isBuyNowPending, startBuyNowTransition] = useTransition();
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeColorwaySlug, setActiveColorwaySlug] = useState(initialColorwaySlug);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const activeColorway = colorways.find((colorway) => colorway.slug === activeColorwaySlug) ?? colorways[0];
  if (!activeColorway) return null;

  const { galleryImages, variants: panelVariants } = activeColorway;
  const main = galleryImages[activeIdx] ?? galleryImages[0];
  const activeImageUrls = new Set(galleryImages.map((image) => image.url));
  const preloadImages = colorways
    .flatMap((colorway) => colorway.galleryImages)
    .filter(
      (image, index, images) =>
        !activeImageUrls.has(image.url) && images.findIndex(({ url }) => url === image.url) === index,
    );
  const availableVariants = panelVariants.filter((variant) => variant.active && variant.stock > 0);
  const cheapestVariant = availableVariants.reduce<PanelVariant | null>(
    (cheapest, variant) => (cheapest === null || variant.price < cheapest.price ? variant : cheapest),
    null,
  );
  const minPrice = cheapestVariant?.price ?? 0;
  const minCompareAtPrice = cheapestVariant?.compareAtPrice ?? null;

  const handleColorChange = (slug: string) => {
    if (slug === activeColorwaySlug) return;
    setActiveColorwaySlug(slug);
    setActiveIdx(0);
    setSelectedVariantId(null);

    const url = new URL(window.location.href);
    url.searchParams.set('color', slug);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <>
      <div className="mt-[26px]">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Каталог', href: '/catalog' },
            { label: product.category.name, href: '/catalog?category=' + product.category.slug },
            { label: product.name },
          ]}
        />
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-[30px]">
        <div className="relative aspect-[1/1.04] overflow-hidden rounded-[24px] border border-line bg-surface-soft lg:col-start-1 lg:row-start-1">
          <div className="absolute left-4 top-4 z-10">
            <WishlistHeart productId={productId} initialActive={wishlisted} variant="pdp" />
          </div>
          <span className="absolute right-4 top-4 z-10 rounded-full bg-surface/90 px-4 py-2 text-[13px] font-bold backdrop-blur">
            {product.category.name}
          </span>
          {main && (
            <Image
              src={main.url}
              alt={main.alt}
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          )}
          <div aria-hidden className="sr-only">
            {preloadImages.map((image) => (
              <Image
                key={image.url}
                src={image.url}
                alt=""
                data-preload-image={image.url}
                width={1}
                height={1}
                loading="eager"
                sizes="(min-width: 1024px) 600px, 100vw"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:col-start-2 lg:row-start-1 lg:grid-cols-2 lg:gap-3">
          {galleryImages.map((img, index) => {
            const isWide = index === 2;
            return (
              <button
                key={img.url}
                type="button"
                onClick={() => setActiveIdx(index)}
                aria-label={'Фото ' + (index + 1)}
                aria-current={activeIdx === index}
                className={cn(
                  'group relative aspect-[.86/1] overflow-hidden rounded-[12px] border bg-surface-soft transition-all duration-300 lg:rounded-[18px]',
                  isWide && 'lg:col-span-2 lg:aspect-[1.74/1]',
                  !isWide && 'lg:aspect-[1/1.08]',
                  activeIdx === index
                    ? 'border-ink shadow-[0_0_0_1px_hsl(var(--color-text))]'
                    : 'border-line hover:border-ink/30',
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 300px, 30vw"
                  className="object-cover transition-transform duration-400 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <PurchasePanel
            key={activeColorwaySlug}
            productName={product.name}
            productSlug={product.slug}
            colorways={colorways}
            activeColorwaySlug={activeColorwaySlug}
            activeColorwayName={activeColorway.name}
            variants={panelVariants}
            fitNote={product.fitNote}
            description={product.description}
            specs={product.specs}
            ratingAvg={ratingAvg}
            ratingCount={ratingCount}
            onSelectedVariantChange={setSelectedVariantId}
            onColorChange={handleColorChange}
          />
        </div>

        <div className="z-5 grid gap-[22px] self-start lg:sticky lg:top-[128px] lg:col-start-2 lg:row-start-2">
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-[18px] border border-line bg-surface p-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-4">
            <PriceTag
              price={minPrice}
              compareAtPrice={minCompareAtPrice}
              className="font-display text-[30px] leading-none tracking-tight text-accent"
            />
            <button
              type="button"
              disabled={!selectedVariantId || isBuyNowPending}
              aria-busy={isBuyNowPending}
              onClick={() => {
                if (!selectedVariantId) return;
                startBuyNowTransition(() => {
                  router.push(`/checkout?buyNow=${encodeURIComponent(selectedVariantId)}`);
                });
              }}
              className={cn(
                'inline-flex min-h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-footer disabled:cursor-not-allowed disabled:opacity-50',
                isBuyNowPending && 'bg-ink/20 text-surface hover:bg-ink/20',
              )}
            >
              Купить сейчас
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <ReviewsSection
            productId={product.id}
            avg={ratingAvg ?? 0}
            count={ratingCount}
            reviews={reviews}
            state={reviewState}
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-[70px]">
          <h2 className="mb-7 text-center font-display text-[26px] font-bold tracking-tight sm:text-[40px]">
            Вам также подойдёт
          </h2>
          <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} data={item} wishlisted={wishlistedIds.has(item.id)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

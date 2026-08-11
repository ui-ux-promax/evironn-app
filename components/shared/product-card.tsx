import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import { WishlistHeart } from '@/components/shared/wishlist/wishlist-heart';
import type { ProductCardData } from '@/lib/product-summary';
import { cn } from '@/lib/utils';

const BEIGE_BLUR =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='8'%20height='8'%3E%3Crect%20width='8'%20height='8'%20fill='%23f1ece1'/%3E%3C/svg%3E";

export function ProductCard({
  data,
  wishlisted = false,
  landingMotion = false,
}: {
  data: ProductCardData;
  wishlisted?: boolean;
  landingMotion?: boolean;
}) {
  const href = `/product/${data.slug}`;
  return (
    <article
      className={cn(
        'group border border-line bg-surface rounded-[10px] p-2.5 pb-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-ink/20 hover:shadow-[0_18px_45px_hsl(220_12%_10%_/_0.08)]',
        landingMotion && '[transition-timing-function:cubic-bezier(.22,1,.36,1)] motion-reduce:transform-none',
      )}
    >
      {/* Media */}
      <div className="relative aspect-[1.3/1] overflow-hidden rounded-[10px] bg-surface-soft">
        {data.badges[0] && (
          <span className="absolute top-2.5 left-2.5 z-10">
            <Badge tone={data.badges[0].tone}>{data.badges[0].label}</Badge>
          </span>
        )}
        <Link href={href} aria-label={data.name} className="absolute inset-0">
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.imageAlt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BEIGE_BLUR}
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${data.soldOut ? 'opacity-50 grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-muted text-xs">нет фото</div>
          )}
        </Link>
      </div>
      {/* Body */}
      <div className="px-1 pt-4 flex flex-col h-[140px]">
        <h3 className="font-display font-bold text-[21px] leading-[1.12] line-clamp-2 min-h-[47px]">
          <Link href={href} className="hover:underline underline-offset-2">
            {data.name}
          </Link>
        </h3>
        <p className="mt-2 text-ink-muted text-[13px] leading-[1.45] line-clamp-1 min-h-[19px]">{data.categoryName}</p>
        {/* Actions — price pill + tool buttons (heart + cart) */}
        <div className="flex min-w-0 items-center justify-between gap-2.5 pt-[18px] mt-auto max-[560px]:grid max-[560px]:grid-cols-[minmax(0,1fr)_auto] max-[560px]:gap-2">
          {/* Price pill */}
          <span className="inline-flex min-w-[112px] items-center justify-center rounded-full border border-line px-4 h-9 text-ink text-xs font-bold tnum max-[560px]:min-w-0 max-[560px]:px-2">
            {data.minPrice.toLocaleString('ru-RU')} ₽
          </span>
          {/* Tool buttons */}
          <div className="flex shrink-0 items-center gap-2 max-[560px]:gap-1">
            {!data.soldOut && (
              <WishlistHeart
                productId={data.id}
                initialActive={wishlisted}
                variant="card"
                landingMotion={landingMotion}
              />
            )}
            {!data.soldOut && (
              <Link
                href={href}
                aria-label={`Выбрать размер: ${data.name}`}
                className={cn(
                  'w-[34px] h-[34px] rounded-full border border-line bg-surface text-ink grid place-items-center hover:border-ink transition-[transform,border-color] duration-200',
                  landingMotion && 'active:scale-90 motion-reduce:transform-none',
                )}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  aria-hidden="true"
                >
                  <path d="M6 8h14l-2 11H8L6 8Z" />
                  <path d="M6 8 5 4H2" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

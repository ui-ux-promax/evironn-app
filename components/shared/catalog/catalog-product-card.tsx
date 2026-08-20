import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import { PriceTag } from '@/components/shared/price-tag';
import type { FurnitureProductCardData } from '@/lib/furniture-product-summary';

const BEIGE_BLUR =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='8'%20height='8'%3E%3Crect%20width='8'%20height='8'%20fill='%23f1ece1'/%3E%3C/svg%3E";

export function CatalogProductCard({ data }: { data: FurnitureProductCardData }) {
  const href = `/product/${data.slug}`;

  return (
    <article
      data-testid="catalog-product-card"
      className="[container-type:inline-size] flex flex-col border border-line bg-surface rounded-[24px] p-[18px] shadow-[0_18px_44px_hsl(220_12%_10%_/_0.04)] transition-transform duration-200 hover:-translate-y-[3px] hover:border-ink/22 hover:shadow-[0_18px_40px_hsl(220_12%_10%_/_0.07)]"
    >
      <div className="relative aspect-[1.08/1] overflow-hidden rounded-[18px] border border-line bg-surface-soft">
        {data.badges[0] && (
          <span className="absolute left-3 top-3 z-10">
            <Badge tone={data.badges[0].tone}>{data.badges[0].label}</Badge>
          </span>
        )}
        <Link href={href} aria-label={data.name} className="absolute inset-0">
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              placeholder="blur"
              blurDataURL={BEIGE_BLUR}
              className={`object-cover transition-transform duration-500 group-hover:scale-[1.045] ${data.soldOut ? 'opacity-50 grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-muted text-xs">Нет фото</div>
          )}
        </Link>
      </div>

      <div className="grid gap-1.5 pt-3.5">
        <p className="text-xs text-ink-muted">{data.categoryName}</p>
        <h3 className="min-w-0 break-words font-display font-bold text-[clamp(21px,8cqw,26px)] leading-[0.96] tracking-tight">
          <Link href={href} className="hover:underline underline-offset-2">
            {data.name}
          </Link>
        </h3>
        <PriceTag
          price={data.minPrice}
          compareAtPrice={data.minOldPrice}
          className="justify-self-end whitespace-nowrap text-[15px] text-accent"
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
        <span className={`text-sm font-semibold ${data.soldOut ? 'text-ink-muted' : 'text-accent'}`}>
          {data.soldOut ? 'Нет в наличии' : 'В наличии'}
        </span>
        {data.optionSwatches.length > 0 && (
          <div className="flex items-center gap-2" aria-label="Доступные варианты">
            {data.optionSwatches.map((swatch) => (
              <span
                key={`${swatch.groupSlug}:${swatch.valueSlug}`}
                role="img"
                aria-label={swatch.label}
                title={swatch.label}
                className="h-5 w-5 rounded-full border border-line"
                style={{ backgroundColor: swatch.swatchHex ?? 'hsl(0 0% 50%)' }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

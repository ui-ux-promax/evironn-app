import Link from 'next/link';
import type { ResolvedProductSelection } from '@/lib/product-selection';
import { serializeOptionParam } from '@/lib/product-selection';
import { PriceTag } from '@/components/shared/price-tag';

export interface PurchasePanelProps {
  productSlug: string;
  productName: string;
  categoryName: string;
  description: string | null;
  specs: Record<string, string> | null;
  selection: ResolvedProductSelection;
}

export function PurchasePanel({
  productSlug,
  productName,
  categoryName,
  description,
  specs,
  selection,
}: PurchasePanelProps): React.JSX.Element {
  return (
    <section id="buy" className="grid gap-5 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">{categoryName}</p>
        <h1 className="font-display text-[30px] font-bold leading-none tracking-[-0.04em] sm:text-[40px]">
          {productName}
        </h1>
        <p className="text-sm text-ink-muted">
          Артикул: <span>{selection.sku.articleNumber}</span>
        </p>
      </div>

      <div className="flex items-end justify-between gap-4 border-y border-line py-4">
        <div className="grid gap-1 text-sm text-ink-muted">
          <p>{selection.sku.stock > 0 ? `В наличии: ${selection.sku.stock}` : 'Нет в наличии'}</p>
          <p className="text-xs">Выбранная конфигурация</p>
        </div>
        <PriceTag
          price={selection.sku.price}
          compareAtPrice={selection.sku.oldPrice}
          className="font-display text-[30px] text-accent"
        />
      </div>

      <div className="grid gap-5">
        {selection.optionGroups.map((group) => (
          <fieldset key={group.slug} className="grid gap-2">
            <legend className="text-xs font-bold uppercase tracking-[0.16em]">{group.name}</legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const isSelected = selection.canonicalSelection[group.slug] === value.slug;
                if (!value.available) {
                  return (
                    <span
                      key={value.slug}
                      aria-disabled="true"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink-muted line-through opacity-60"
                    >
                      {value.swatchHex && (
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full border border-line"
                          style={{ backgroundColor: value.swatchHex }}
                        />
                      )}
                      {value.name}
                    </span>
                  );
                }

                const nextSelection = { ...selection.canonicalSelection, [group.slug]: value.slug };
                const href = `/product/${productSlug}?option=${encodeURIComponent(serializeOptionParam(nextSelection))}`;
                return (
                  <Link
                    key={value.slug}
                    href={href}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      isSelected ? 'border-ink bg-ink text-surface' : 'border-line hover:border-ink'
                    }`}
                  >
                    {value.swatchHex && (
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 rounded-full border border-line"
                        style={{ backgroundColor: value.swatchHex }}
                      />
                    )}
                    {value.name}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {description && <p className="text-sm leading-6 text-ink-muted">{description}</p>}

      {specs && Object.keys(specs).length > 0 && (
        <dl className="grid gap-2 border-t border-line pt-4 text-sm">
          {Object.entries(specs).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid gap-2 border-t border-line pt-4">
        <button
          type="button"
          disabled
          className="min-h-12 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground opacity-50"
        >
          Добавление в корзину будет доступно после завершения пилота
        </button>
        <p className="text-center text-xs text-ink-muted">
          Добавление в корзину станет доступно после завершения пилота.
        </p>
      </div>
    </section>
  );
}

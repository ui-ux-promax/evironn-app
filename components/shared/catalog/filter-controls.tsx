import { CheckboxFacet } from './checkbox-facet';
import { OptionFacet } from './option-facet';
import { PriceFilter } from './price-filter';
import { InStockToggle } from './in-stock-toggle';
import { ResetButton } from './active-filter-chips';
import type { CatalogResult } from '@/lib/find-products';

export function FilterControls({
  facets,
  showHeading = true,
}: {
  facets: CatalogResult['facets'];
  showHeading?: boolean;
}) {
  return (
    <div className="space-y-5">
      {showHeading && (
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Фильтры</h2>
          <ResetButton className="text-xs font-semibold text-ink-muted underline underline-offset-2 hover:text-ink" />
        </div>
      )}
      <CheckboxFacet title="Категория" paramKey="category" options={facets.categories} />
      <CheckboxFacet title="Комната" paramKey="room" options={facets.rooms} />
      {facets.options.map((group) => (
        <OptionFacet key={group.slug} group={group} paramKey="option" />
      ))}
      <PriceFilter min={facets.price.min} max={facets.price.max} />
      <InStockToggle />
    </div>
  );
}

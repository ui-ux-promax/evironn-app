'use client';

import { useCatalogUrl } from '@/hooks/use-catalog-url';
import type { CatalogResult } from '@/lib/find-products';

export function OptionFacet({
  group,
  paramKey,
}: {
  group: CatalogResult['facets']['options'][number];
  paramKey: string;
}) {
  const { getList, toggleInList } = useCatalogUrl();
  const selected = getList(paramKey);
  if (!group.values.length) return null;

  return (
    <div className="border-t border-line pt-4">
      <p className="font-semibold text-sm mb-2">{group.name}</p>
      <div className="space-y-1.5 text-sm">
        {group.values.map((value) => {
          const token = `${group.slug}:${value.value}`;
          return (
            <label key={token} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-[hsl(var(--color-primary))]"
                checked={selected.includes(token)}
                onChange={() => toggleInList(paramKey, token)}
                aria-label={value.label}
              />
              <span
                data-testid={`swatch-${group.slug}-${value.value}`}
                data-swatch-hex={value.swatchHex ?? ''}
                className="h-4 w-4 rounded-full border border-line"
                style={{ backgroundColor: value.swatchHex ?? 'hsl(0 0% 50%)' }}
                aria-hidden="true"
              />
              <span>{value.label}</span>
              <span className="text-ink-muted ml-auto tnum">{value.count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

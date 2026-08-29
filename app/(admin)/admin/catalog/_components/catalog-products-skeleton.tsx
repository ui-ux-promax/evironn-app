import { Skeleton, type SkeletonProps } from '@/components/admin/skeleton';

const tabWidths = ['w-16', 'w-24', 'w-16', 'w-20', 'w-16'];
const filterWidths = ['w-full', 'w-32', 'w-28', 'w-28', 'w-12'];
const tableWidths = ['w-28', 'w-24', 'w-20', 'w-28', 'w-20', 'w-20', 'w-20', 'w-16', 'w-16'];

function CatalogSkeleton({ style, ...props }: SkeletonProps) {
  return <Skeleton {...props} style={{ backgroundColor: 'var(--admin-surface-low)', ...style }} />;
}

export function CatalogProductsSkeleton({ withTabs = true }: { withTabs?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label="Загрузка каталога товаров" className="space-y-5">
      <header
        data-skeleton="catalog-products-hero"
        className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <CatalogSkeleton rounded="line" delay={1} className="h-2.5 w-48" />
            <CatalogSkeleton rounded="line" delay={2} className="h-10 w-72 max-w-full" />
            <CatalogSkeleton rounded="line" delay={3} className="h-3.5 w-[min(540px,90vw)] max-w-full" />
          </div>
          <CatalogSkeleton rounded="pill" delay={4} className="h-11 w-36 shrink-0" />
        </div>

        {withTabs && (
          <nav
            data-skeleton="catalog-products-tabs"
            aria-hidden="true"
            className="flex gap-1 overflow-hidden border-t border-admin-outline-variant pt-4"
          >
            {tabWidths.map((width, index) => (
              <CatalogSkeleton
                key={index}
                rounded="pill"
                delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                className={`h-10 ${width} shrink-0`}
              />
            ))}
          </nav>
        )}
      </header>

      <section
        data-skeleton="catalog-products-filters"
        aria-hidden="true"
        className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)] sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_180px_180px_auto]">
          {filterWidths.map((width, index) => (
            <CatalogSkeleton
              key={index}
              rounded="pill"
              delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5}
              className={`h-12 ${width} ${index === 4 ? 'lg:w-12' : ''}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-admin-outline-variant pt-4">
          {[72, 64, 80, 88, 72].map((width, index) => (
            <CatalogSkeleton
              key={index}
              rounded="pill"
              delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5}
              style={{ width }}
              className="h-9"
            />
          ))}
        </div>
      </section>

      <section
        data-skeleton="catalog-products-registry"
        aria-hidden="true"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-admin-outline-variant px-5 py-4">
          <div className="space-y-2">
            <CatalogSkeleton rounded="line" delay={2} className="h-4 w-36" />
            <CatalogSkeleton rounded="line" delay={3} className="h-3 w-64 max-w-[60vw]" />
          </div>
          <CatalogSkeleton rounded="pill" delay={4} className="h-9 w-24 shrink-0" />
        </div>

        <div data-skeleton="catalog-products-table" className="overflow-x-auto">
          <table className="w-full min-w-[1110px] border-collapse text-left">
            <thead className="bg-admin-surface-low">
              <tr>
                {tableWidths.map((width, index) => (
                  <th key={index} className="border-b border-admin-outline-variant px-3 py-3.5">
                    <CatalogSkeleton rounded="line" className={`h-2.5 ${width}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, row) => (
                <tr key={row}>
                  {tableWidths.map((width, column) => (
                    <td key={column} className="border-b border-admin-outline-variant px-3 py-3">
                      {column === 0 ? (
                        <div className="flex items-center gap-3">
                          <CatalogSkeleton
                            rounded="box"
                            delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                            className="h-14 w-[72px] shrink-0 rounded-[14px]"
                          />
                          <div className="space-y-2">
                            <CatalogSkeleton
                              rounded="line"
                              delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                              className="h-3 w-32"
                            />
                            <CatalogSkeleton
                              rounded="line"
                              delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                              className="h-2.5 w-20"
                            />
                          </div>
                        </div>
                      ) : (
                        <CatalogSkeleton
                          rounded={column === 2 || column === 7 ? 'pill' : 'line'}
                          delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                          className={`h-3 ${width}`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-admin-outline-variant px-5 py-4">
          <CatalogSkeleton rounded="line" className="h-3 w-32" />
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <CatalogSkeleton
                key={index}
                rounded="box"
                delay={(index + 1) as 1 | 2 | 3}
                className="h-10 w-10 rounded-[12px]"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

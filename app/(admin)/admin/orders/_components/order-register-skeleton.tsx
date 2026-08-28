import { Skeleton, type SkeletonProps } from '@/components/admin/skeleton';

const tableWidths = ['w-20', 'w-28', 'w-32', 'w-24', 'w-20', 'w-24', 'w-24', 'w-16', 'w-16'];

function OrderSkeleton({ style, ...props }: SkeletonProps) {
  return <Skeleton {...props} style={{ backgroundColor: 'var(--admin-surface-low)', ...style }} />;
}

export function OrderRegisterSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Загрузка заказов" className="space-y-5">
      <header
        data-skeleton="orders-hero"
        className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="min-w-0 space-y-3">
          <OrderSkeleton rounded="line" delay={1} className="h-2.5 w-40" />
          <OrderSkeleton rounded="line" delay={2} className="h-10 w-48 max-w-full" />
          <OrderSkeleton rounded="line" delay={3} className="h-3.5 w-[min(470px,90vw)] max-w-full" />
        </div>
        <div className="flex shrink-0 gap-3">
          <OrderSkeleton rounded="pill" delay={4} className="h-11 w-24" />
          <OrderSkeleton rounded="pill" delay={5} className="h-11 w-36" />
        </div>
      </header>

      <section data-skeleton="orders-kpis" aria-hidden="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]"
          >
            <OrderSkeleton rounded="line" delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5} className="h-3 w-28" />
            <OrderSkeleton rounded="line" delay={((index % 5) + 2) as 1 | 2 | 3 | 4 | 5} className="mt-3 h-9 w-24" />
            <OrderSkeleton rounded="pill" delay={((index % 5) + 3) as 1 | 2 | 3 | 4 | 5} className="mt-3 h-6 w-28" />
          </div>
        ))}
      </section>

      <section
        data-skeleton="orders-filters"
        aria-hidden="true"
        className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)] sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
          {[0, 1, 2, 3, 4].map((index) => (
            <OrderSkeleton
              key={index}
              rounded="pill"
              delay={(index + 1) as 1 | 2 | 3 | 4 | 5}
              className={`h-12 ${index === 0 ? 'w-full' : index === 4 ? 'lg:w-12' : 'w-full'}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-outline-variant pt-4">
          <OrderSkeleton rounded="line" className="h-3 w-24" />
          {[72, 64, 92, 72, 80].map((width, index) => (
            <OrderSkeleton
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
        data-skeleton="orders-registry"
        aria-hidden="true"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-admin-outline-variant px-5 py-4">
          <div className="space-y-2">
            <OrderSkeleton rounded="line" delay={2} className="h-4 w-32" />
            <OrderSkeleton rounded="line" delay={3} className="h-3 w-64 max-w-[60vw]" />
          </div>
          <OrderSkeleton rounded="pill" delay={4} className="h-9 w-28 shrink-0" />
        </div>

        <div
          data-skeleton="orders-table"
          className="overflow-hidden border border-admin-outline-variant bg-admin-surface"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="bg-admin-surface-low">
                <tr>
                  {tableWidths.map((width, index) => (
                    <th key={index} className="border-b border-admin-outline-variant px-3 py-3.5">
                      <OrderSkeleton rounded="line" className={`h-2.5 ${width}`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, row) => (
                  <tr key={row}>
                    {tableWidths.map((width, column) => (
                      <td key={column} className="border-b border-admin-outline-variant px-3 py-4">
                        {column === 2 ? (
                          <div className="space-y-2">
                            <OrderSkeleton
                              rounded="line"
                              delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                              className="h-3 w-32"
                            />
                            <OrderSkeleton
                              rounded="line"
                              delay={((row % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                              className="h-2.5 w-24"
                            />
                          </div>
                        ) : (
                          <OrderSkeleton
                            rounded={column >= 5 && column <= 7 ? 'pill' : 'line'}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-outline-variant px-5 py-4">
            <OrderSkeleton rounded="line" className="h-3 w-40" />
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <OrderSkeleton
                  key={index}
                  rounded="box"
                  delay={(index + 1) as 1 | 2 | 3}
                  className="h-10 w-10 rounded-[12px]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

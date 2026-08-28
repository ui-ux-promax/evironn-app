import { Skeleton, type SkeletonProps } from '@/components/admin/skeleton/skeleton';

type Delay = 1 | 2 | 3 | 4 | 5;
type SkeletonKind = 'customer' | 'coupon';

const customerTableWidths = ['w-40', 'w-24', 'w-16', 'w-24', 'w-28'];
const couponTableWidths = ['w-28', 'w-16', 'w-24', 'w-16', 'w-24', 'w-24', 'w-32'];

function ListSkeleton({ style, ...props }: SkeletonProps) {
  return <Skeleton {...props} style={{ backgroundColor: 'var(--admin-surface-low)', ...style }} />;
}

export function CustomerRegisterSkeleton() {
  return <AdminListRegisterSkeleton kind="customer" />;
}

export function CouponRegisterSkeleton() {
  return <AdminListRegisterSkeleton kind="coupon" />;
}

function AdminListRegisterSkeleton({ kind }: { kind: SkeletonKind }) {
  const isCustomer = kind === 'customer';
  const prefix = isCustomer ? 'customer' : 'coupon';
  const label = isCustomer ? 'Загрузка клиентов' : 'Загрузка промокодов';
  const tableWidths = isCustomer ? customerTableWidths : couponTableWidths;

  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-5">
      <header
        data-skeleton={`${prefix}-hero`}
        className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="min-w-0 space-y-3">
          <ListSkeleton rounded="line" delay={1} className="h-2.5 w-40" />
          <ListSkeleton rounded="line" delay={2} className="h-10 w-48 max-w-full" />
          <ListSkeleton rounded="line" delay={3} className="h-3.5 w-[min(470px,90vw)] max-w-full" />
        </div>
        <ListSkeleton rounded="pill" delay={4} className="h-11 w-40 shrink-0" />
      </header>

      <section
        data-skeleton={`${prefix}-kpis`}
        aria-hidden="true"
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={index}
            className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]"
          >
            <ListSkeleton rounded="line" delay={stagger(index)} className="h-3 w-28" />
            <ListSkeleton rounded="line" delay={stagger(index, 1)} className="mt-3 h-9 w-20" />
            <ListSkeleton rounded="pill" delay={stagger(index, 2)} className="mt-3 h-6 w-28" />
          </article>
        ))}
      </section>

      <section
        data-skeleton={`${prefix}-filters`}
        aria-hidden="true"
        className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
          {[0, 1, 2, 3, 4].map((index) => (
            <ListSkeleton
              key={index}
              rounded="pill"
              delay={stagger(index)}
              className={`h-12 ${index === 4 ? 'lg:w-12' : 'w-full'}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-outline-variant pt-4">
          <ListSkeleton rounded="line" className="h-3 w-24" />
          {[56, 72, 88, 68, 96].map((width, index) => (
            <ListSkeleton key={width} rounded="pill" delay={stagger(index)} style={{ width }} className="h-9" />
          ))}
        </div>
      </section>

      <section
        data-skeleton={`${prefix}-registry`}
        aria-hidden="true"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex flex-col gap-3 border-b border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <ListSkeleton rounded="line" delay={2} className="h-4 w-36" />
            <ListSkeleton rounded="line" delay={3} className="h-3 w-64 max-w-[60vw]" />
          </div>
          <ListSkeleton rounded="pill" delay={4} className="h-9 w-24 shrink-0" />
        </div>

        <div data-skeleton={`${prefix}-table`} className="overflow-x-auto">
          <table className={`w-full ${isCustomer ? 'min-w-[880px]' : 'min-w-[980px]'} border-collapse text-left`}>
            <thead className="bg-admin-surface-low">
              <tr>
                {tableWidths.map((width, index) => (
                  <th key={index} className="border-b border-admin-outline-variant px-5 py-3.5 first:px-5">
                    <ListSkeleton rounded="line" className={`h-2.5 ${width}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, row) => (
                <tr key={row} className="border-b border-admin-outline-variant last:border-b-0">
                  {tableWidths.map((width, column) => (
                    <td key={column} className="px-5 py-4">
                      <TableCellSkeleton kind={kind} row={row} column={column} width={width} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-outline-variant px-5 py-4">
          <ListSkeleton rounded="line" className="h-3 w-40" />
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <ListSkeleton key={index} rounded="box" delay={stagger(index)} className="h-10 w-10 rounded-[12px]" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TableCellSkeleton({
  kind,
  row,
  column,
  width,
}: {
  kind: SkeletonKind;
  row: number;
  column: number;
  width: string;
}) {
  const delay = stagger(row);

  if (kind === 'customer' && column === 0) {
    return (
      <div className="space-y-2">
        <ListSkeleton rounded="line" delay={delay} className="h-3 w-32" />
        <ListSkeleton rounded="line" delay={delay} className="h-2.5 w-44" />
        <ListSkeleton rounded="line" delay={delay} className="h-2.5 w-28" />
      </div>
    );
  }

  if ((kind === 'customer' && column === 1) || (kind === 'coupon' && column === 2)) {
    return <ListSkeleton rounded="pill" delay={delay} className="h-7 w-24" />;
  }

  if (kind === 'coupon' && column === 3) {
    return <ListSkeleton rounded="pill" delay={delay} className="h-6 w-11" />;
  }

  if (kind === 'coupon' && column === 6) {
    return (
      <div className="flex justify-end gap-2">
        <ListSkeleton rounded="pill" delay={delay} className="h-8 w-20" />
        <ListSkeleton rounded="pill" delay={delay} className="h-8 w-[72px]" />
      </div>
    );
  }

  return <ListSkeleton rounded="line" delay={delay} className={`h-3 ${width}`} />;
}

function stagger(index: number, offset = 0): Delay {
  return (((index + offset) % 5) + 1) as Delay;
}

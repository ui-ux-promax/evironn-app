import { Skeleton } from '@/components/ui';

function TrackSkeleton() {
  return (
    <div className="ord-loading__track" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="ord-loading__track-item" key={index}>
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      ))}
    </div>
  );
}

function OrderLinesSkeleton() {
  return (
    <div className="ord-loading__lines" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="ord-loading__line" key={index}>
          <Skeleton className="h-24 w-24 rounded-xl" />
          <div className="ord-loading__line-copy">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="ord-a__summary">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-44" />
      <div className="ord-loading__summary-rows" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="ord-loading__address" aria-hidden="true">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}

// Скелетон повторяет реальную раскладку order page: header, две колонки и панели.
export default function OrderLoading() {
  return (
    <main className="ord-a ord-loading" aria-hidden="true">
      <header className="ord-a__head">
        <div className="ord-loading__crumbs" aria-hidden="true">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="ord-a__title">
          <div>
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="mt-2 h-11 w-40 rounded-sm" />
            <Skeleton className="mt-3 h-3 w-52" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </header>

      <div className="ord-a__grid">
        <div className="ord-a__main">
          <section className="ord-panel">
            <header>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-3 w-56" />
            </header>
            <TrackSkeleton />
          </section>

          <section className="ord-panel">
            <header>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-3 w-64" />
            </header>
            <OrderLinesSkeleton />
          </section>

          <section className="ord-panel">
            <header>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-3 w-44" />
            </header>
            <div className="ord-loading__facts" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          </section>

          <section className="ord-panel ord-loading__review" aria-hidden="true">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
          </section>
        </div>

        <aside className="ord-a__side" aria-hidden="true">
          <SummarySkeleton />
        </aside>
      </div>
    </main>
  );
}

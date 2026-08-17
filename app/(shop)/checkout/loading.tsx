import { Skeleton } from '@/components/ui';

export default function CheckoutLoading() {
  return (
    <main className="chk-a" aria-hidden>
      <header className="chk-a__head">
        <Skeleton className="h-8 w-64" />
      </header>
      <div className="chk-a__grid">
        <div className="chk-a__form">
          {Array.from({ length: 3 }).map((_, index) => (
            <section className="chk-a__card space-y-4" key={index}>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
            </section>
          ))}
        </div>
        <aside className="chk-a__side">
          <div className="chk-a__summary space-y-4">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </aside>
      </div>
    </main>
  );
}

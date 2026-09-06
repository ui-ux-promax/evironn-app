import { Steps } from '@/components/evironn/cart/cart-primitives';
import { Skeleton } from '@/components/ui';

export default function CartLoading() {
  return (
    <main className="cart-a cart-loading" aria-hidden>
      <header className="cart-a__head">
        <Steps current="cart" />
        <Skeleton className="mt-6 h-14 w-52 sm:h-16" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      </header>

      <div className="cart-a__grid">
        <section className="cart-a__list">
          <div className="cart-a__list-head">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="cart-a__columns" aria-hidden="true">
            <Skeleton className="col-span-2 h-3 w-16" />
            <Skeleton className="justify-self-center h-3 w-20" />
            <Skeleton className="justify-self-end h-3 w-20" />
          </div>

          <div className="cart-a__lines">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="cart-a__line" key={index}>
                <Skeleton className="aspect-square w-full rounded-[20px]" />
                <div className="cart-a__info">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full max-w-56" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="cart-a__qty">
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
                <div className="cart-a__money">
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="cart-a__line-actions">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="cart-a__side">
          <div className="cart-a__card space-y-5">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </aside>
      </div>

      <div className="cart-a__mobile-bar">
        <span>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </span>
        <Skeleton className="h-[50px] w-40 rounded-full" />
      </div>
    </main>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from './skeleton';

type Delay = 1 | 2 | 3 | 4 | 5;

function Panel({ children, className = '', testId }: { children: ReactNode; className?: string; testId: string }) {
  return (
    <section
      data-skeleton={testId}
      className={`min-w-0 overflow-hidden rounded-[18px] border border-admin-outline-variant bg-admin-surface shadow-[0_7px_24px_hsl(30_10%_25%_/_0.045)] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({ action = false }: { action?: boolean }) {
  return (
    <div className="flex min-h-[34px] items-center justify-between gap-4">
      <Skeleton rounded="line" className="h-[17px] w-40" />
      {action ? <Skeleton rounded="pill" delay={1} className="h-[34px] w-24 shrink-0" /> : null}
    </div>
  );
}

function KpiSkeleton({ delay }: { delay: Delay }) {
  return (
    <div
      data-skeleton="dashboard-kpi"
      className="grid min-h-[76px] grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] bg-admin-surface-low px-3.5 py-3"
    >
      <Skeleton rounded="box" delay={delay} className="h-[34px] w-[34px] rounded-lg" />
      <div className="min-w-0">
        <Skeleton rounded="line" delay={delay} className="h-3 w-20" />
        <Skeleton rounded="line" delay={delay} className="mt-1.5 h-[19px] w-16" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="relative mt-3 h-[228px] overflow-hidden">
      <div className="absolute inset-x-0 top-4 grid gap-10">
        {[1, 2, 3, 4, 5].map((row) => (
          <Skeleton
            key={row}
            rounded="line"
            delay={(((row - 1) % 5) + 1) as Delay}
            className="h-px w-full rounded-none"
          />
        ))}
      </div>
      <div className="absolute inset-x-[7%] bottom-0 flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((label) => (
          <Skeleton key={label} rounded="line" className="h-2.5 w-8" />
        ))}
      </div>
    </div>
  );
}

function SalesSkeleton() {
  return (
    <Panel testId="dashboard-sales" className="min-h-[406px] p-[20px_26px_16px] max-[620px]:p-[18px]">
      <PanelHeader action />
      <div className="mt-4 grid grid-cols-[190px_minmax(0,1fr)] items-end gap-5 max-[1180px]:grid-cols-[160px_minmax(0,1fr)] max-[620px]:grid-cols-1">
        <div className="grid min-h-[78px] content-end gap-1">
          <Skeleton rounded="line" className="h-3 w-20" />
          <Skeleton rounded="line" className="h-7 w-32" />
          <Skeleton rounded="line" className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-3 gap-3.5 max-[1180px]:gap-2 max-[620px]:grid-cols-1">
          {[1, 2, 3].map((delay) => (
            <KpiSkeleton key={delay} delay={delay as Delay} />
          ))}
        </div>
      </div>
      <ChartSkeleton />
    </Panel>
  );
}

function FunnelSkeleton() {
  const widths = ['100%', '93%', '86%', '79%', '72%'];

  return (
    <Panel testId="dashboard-funnel" className="flex min-h-[406px] flex-col p-[20px_24px_14px] max-[620px]:p-[18px]">
      <PanelHeader />
      <div className="mt-2 grid">
        {widths.map((width, index) => (
          <div key={width} className="grid justify-items-center">
            <div
              data-skeleton="dashboard-funnel-stage"
              style={{ '--stage-width': width } as CSSProperties}
              className="relative grid min-h-[49px] w-[var(--stage-width)] grid-cols-[25px_minmax(0,1fr)_auto] items-center gap-2.5 px-6 max-[620px]:px-4"
            >
              <Skeleton rounded="box" delay={((index % 5) + 1) as Delay} className="h-5 w-5 rounded-md" />
              <Skeleton rounded="line" delay={((index % 5) + 1) as Delay} className="h-3 w-24" />
              <Skeleton rounded="line" delay={((index % 5) + 1) as Delay} className="h-3 w-10" />
            </div>
            {index < widths.length - 1 ? <Skeleton rounded="line" className="my-0.5 h-1.5 w-2 rounded-full" /> : null}
          </div>
        ))}
      </div>
      <Skeleton rounded="box" delay={2} className="mt-auto h-9 w-full rounded-[10px]" />
    </Panel>
  );
}

function InventorySkeleton() {
  return (
    <Panel testId="dashboard-inventory" className="min-h-[212px] p-[16px_22px_14px] max-[620px]:p-[18px]">
      <PanelHeader action />
      <div className="mt-2.5 grid grid-cols-4 gap-3.5 max-[620px]:grid-cols-2">
        {[1, 2, 3, 4].map((delay) => (
          <div key={delay} data-skeleton="dashboard-inventory-card" className="grid min-w-0">
            <Skeleton rounded="box" delay={delay as Delay} className="h-[98px] w-full rounded-xl" />
            <Skeleton rounded="line" delay={delay as Delay} className="mt-2 h-3 w-4/5 max-w-full" />
            <div className="mt-1 flex justify-between gap-2">
              <Skeleton rounded="line" delay={delay as Delay} className="h-2.5 w-16" />
              <Skeleton rounded="line" delay={delay as Delay} className="h-3 w-5" />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CategoriesSkeleton() {
  return (
    <Panel testId="dashboard-categories" className="min-h-[212px] p-[16px_22px_14px] max-[620px]:p-[18px]">
      <PanelHeader action />
      <div className="mt-2.5 grid grid-cols-4 gap-2 max-[620px]:grid-cols-2 max-[620px]:gap-y-4">
        {[1, 2, 3, 4].map((delay) => (
          <div key={delay} data-skeleton="dashboard-category" className="grid justify-items-center gap-1.5">
            <Skeleton
              rounded="circle"
              delay={delay as Delay}
              className="h-[82px] w-[82px] p-1.5 max-[1180px]:h-[68px] max-[1180px]:w-[68px] max-[620px]:h-[82px] max-[620px]:w-[82px]"
            />
            <Skeleton rounded="line" delay={delay as Delay} className="h-2.5 w-16" />
          </div>
        ))}
      </div>
      <Skeleton rounded="line" delay={2} className="mt-1.5 h-2.5 w-24" />
    </Panel>
  );
}

function OrdersSkeleton() {
  return (
    <Panel testId="dashboard-orders" className="col-span-full overflow-hidden p-[9px_0_0]">
      <div className="px-[22px] pb-2">
        <PanelHeader action />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="grid h-9 grid-cols-[1fr_1fr_1.4fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-y border-admin-outline-variant bg-admin-surface-low px-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((column) => (
              <Skeleton key={column} rounded="line" className="h-2.5 w-16" />
            ))}
          </div>
          <div className="divide-y divide-admin-outline-variant">
            {[1, 2, 3, 4].map((delay) => (
              <div
                key={delay}
                data-skeleton="dashboard-order-row"
                className="grid h-[52px] grid-cols-[1fr_1fr_1.4fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 px-3"
              >
                <Skeleton rounded="line" delay={delay as Delay} className="h-3 w-16" />
                <Skeleton rounded="line" delay={delay as Delay} className="h-3 w-20" />
                <Skeleton rounded="line" delay={delay as Delay} className="h-3 w-28" />
                <div className="flex gap-1">
                  <Skeleton rounded="box" delay={delay as Delay} className="h-7 w-8 rounded-md" />
                  <Skeleton rounded="box" delay={delay as Delay} className="h-7 w-8 rounded-md" />
                </div>
                <Skeleton rounded="line" delay={delay as Delay} className="h-3 w-20" />
                <Skeleton rounded="pill" delay={delay as Delay} className="h-6 w-16" />
                <Skeleton rounded="pill" delay={delay as Delay} className="h-6 w-16" />
                <Skeleton rounded="pill" delay={delay as Delay} className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function DashboardBody() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-3.5 min-[901px]:grid-cols-[minmax(0,1.76fr)_minmax(400px,1fr)]">
      <SalesSkeleton />
      <FunnelSkeleton />
      <InventorySkeleton />
      <CategoriesSkeleton />
      <OrdersSkeleton />
    </div>
  );
}

/** Public dashboard loading composite; the root carries the loading semantics. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Загрузка…">
      <DashboardBody />
    </div>
  );
}

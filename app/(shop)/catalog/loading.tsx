import { Skeleton } from '@/components/ui';

export default function CatalogLoading() {
  return (
    <div className="cat-b cat-b-loading" aria-hidden>
      <div className="cat-b__stage">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="cat-b__body">
        <Skeleton className="mb-6 h-12 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

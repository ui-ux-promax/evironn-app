import Image from 'next/image';

export function CatalogHero({ total }: { total: number }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4 md:pt-6" aria-label="Коллекция Ritm">
      <div className="grid md:grid-cols-2 gap-5 rounded-[22px] overflow-hidden bg-surface-soft">
        {/* Image */}
        <div className="relative h-[240px] md:h-[400px]">
          <Image
            src="/home/collection-rail.png"
            alt="Вешалка с одеждой коллекции Ritm"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <b className="mr-1">•</b>Коллекция · Лето 2026
          </span>
        </div>
        {/* Copy */}
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">Ritm Collection</span>
          <h1 className="font-display font-bold text-[28px] md:text-[42px] leading-[1.05] mt-2">
            Откройте для себя коллекции Ritm
          </h1>
          <p className="mt-3 text-ink-muted text-[15px] leading-[1.6] max-w-[480px]">
            Капсулы сезона, базовый гардероб и лимитированные дропы — собранные в одном каталоге. Найдите вещь под свой
            стиль.
          </p>
          <div className="flex gap-8 mt-6">
            <div>
              <b className="font-display font-bold text-xl tnum">{total}</b>
              <span className="block text-xs text-ink-muted mt-0.5">товаров</span>
            </div>
            <div>
              <b className="font-display font-bold text-xl tnum">1</b>
              <span className="block text-xs text-ink-muted mt-0.5">бренд</span>
            </div>
            <div>
              <b className="font-display font-bold text-xl tnum">14</b>
              <span className="block text-xs text-ink-muted mt-0.5">дней на возврат</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

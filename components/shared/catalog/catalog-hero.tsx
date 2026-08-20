import Image from 'next/image';

export function CatalogHero({ total }: { total: number }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4 md:pt-6" aria-label="Коллекция Evironn">
      <div className="grid md:grid-cols-2 gap-5 rounded-[22px] overflow-hidden bg-surface-soft">
        <div className="relative h-[240px] md:h-[400px]">
          <Image
            src="/assets/products/05-two-seat-sofa-idle.webp"
            alt="Двухместный диван Evironn"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <b className="mr-1">•</b> Коллекция · 2026
          </span>
        </div>
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">Evironn furniture</span>
          <h1 className="font-display font-bold text-[28px] md:text-[42px] leading-[1.05] mt-2">
            Мебель для тихих, красивых пространств
          </h1>
          <p className="mt-3 text-ink-muted text-[15px] leading-[1.6] max-w-[480px]">
            Диваны, кресла и стулья с продуманными материалами, точными пропорциями и вариантами отделки для вашего
            дома.
          </p>
          <div className="flex gap-8 mt-6">
            <div>
              <b className="font-display font-bold text-xl tnum">{total}</b>
              <span className="block text-xs text-ink-muted mt-0.5">товаров</span>
            </div>
            <div>
              <b className="font-display font-bold text-xl tnum">5</b>
              <span className="block text-xs text-ink-muted mt-0.5">категорий</span>
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

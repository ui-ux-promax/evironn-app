import { SeasonParallax } from './season-parallax';

export function SeasonSection() {
  return (
    <section className="overflow-hidden py-16 md:py-[78px]">
      <div className="mx-auto mb-10 max-w-[1240px] px-4 sm:px-6">
        <div data-reveal="up" className="mx-auto max-w-[720px] text-center">
          <h2 className="font-display text-[32px] font-bold leading-[1.05] md:text-[50px]">Сезон в деталях</h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-ink-muted">
            Каждая вещь собрана из тканей, которые носятся легко и долго. Спокойная палитра, чистый силуэт, ничего
            лишнего.
          </p>
        </div>
      </div>
      <SeasonParallax />
    </section>
  );
}

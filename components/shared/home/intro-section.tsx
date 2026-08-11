export function IntroSection() {
  return (
    <section className="pt-20 md:pt-[88px] pb-12 md:pb-[54px]">
      <div className="mx-auto max-w-[760px] text-center px-4 sm:px-6">
        <h2 data-reveal="up" className="font-display font-bold text-[28px] md:text-[42px] leading-[1.05]">
          Свежая мода в современных вайбах
        </h2>
        <p
          data-reveal="up"
          data-reveal-delay="1"
          className="mt-3 text-ink-muted text-[15px] leading-[1.6] max-w-[600px] mx-auto"
        >
          Коллекция постоянно обновляется последними фасонами, чтобы вы всегда оставались в своей точке стиля. Покупайте
          сейчас и позвольте гардеробу выглядеть свежо.
        </p>
      </div>
    </section>
  );
}

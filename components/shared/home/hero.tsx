'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const slides = [
  '/home/hero-slide-1.png',
  '/home/hero-slide-2.png',
  '/home/hero-slide-3.png',
  '/home/hero-slide-4.png',
] as const;

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
      setCycle((current) => current + 1);
    }, 5600);
    return () => window.clearTimeout(timer);
  }, [cycle, paused]);

  const select = (next: number) => {
    setActive(next);
    setCycle((current) => current + 1);
  };
  const go = (direction: 1 | -1) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
    setCycle((current) => current + 1);
  };

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-3.5 sm:px-6">
      <div
        className="landing-hero-in relative flex min-h-[480px] items-start overflow-hidden rounded-[22px] md:min-h-[604px] md:items-center"
        style={{ isolation: 'isolate' }}
        data-testid="hero-slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {slides.map((src, index) => (
          <div
            key={src}
            data-slide-index={index}
            className={cn(
              'landing-hero-slide absolute inset-0 motion-reduce:duration-0',
              index === active ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={index !== active}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 1240px) 1176px, 100vw"
              aria-hidden
              className={cn('object-cover motion-reduce:animate-none', index === active && 'landing-hero-ken-burns')}
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,hsl(220_12%_10%_/_0.82),hsl(220_12%_10%_/_0.34)_50%,hsl(220_12%_10%_/_0.08))]"
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-[280px] px-6 pt-8 text-white sm:max-w-[340px] sm:pt-10 md:max-w-[680px] md:px-16 md:pt-0">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] text-white md:text-[64px]">Evironn.</h1>
          <p className="mt-3 max-w-[560px] text-[14px] font-medium leading-[1.5] text-white/88 sm:text-[15px] sm:leading-[1.6] md:mt-4">
            Откройте широкий выбор актуальных вещей для повседневного гардероба. Подберите любимый комплект, который
            отражает ваш стиль и настроение.
          </p>
        </div>

        <div className="absolute right-7 top-12 z-10 hidden gap-2 md:flex" aria-label="Переключение промо">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Предыдущее промо"
            data-testid="hero-prev"
            className="grid h-[34px] w-[34px] place-items-center rounded-full border border-white/30 bg-white/20 text-white transition hover:scale-105 hover:bg-white/30 active:scale-95 motion-reduce:transform-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Следующее промо"
            data-testid="hero-next"
            className="grid h-[34px] w-[34px] place-items-center rounded-full bg-surface text-ink transition hover:scale-105 hover:shadow-lg active:scale-95 motion-reduce:transform-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 grid -translate-x-1/2 justify-items-center gap-3 md:bottom-20 md:gap-4">
          <Link
            href="/catalog"
            className="inline-flex whitespace-nowrap items-center gap-3 rounded-full bg-surface py-2.5 pl-6 pr-3.5 font-bold text-ink shadow-[0_18px_45px_hsl(220_12%_10%_/_0.25)] transition-transform hover:-translate-y-0.5 motion-reduce:transform-none md:py-3 md:pl-7 md:pr-4"
          >
            Начать покупки
            <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-primary text-primary-foreground">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8.5h14l-1 11H6l-1-11Z" />
                <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
              </svg>
            </span>
          </Link>
          <div className="flex items-center gap-2" aria-label="Слайды промо">
            {slides.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => select(index)}
                aria-label={`Показать слайд ${index + 1}`}
                aria-current={index === active ? 'true' : undefined}
                data-testid={`hero-dot-${index}`}
                className={cn(
                  'h-1.5 rounded-full bg-white/55 transition-[width,background-color] duration-500 motion-reduce:transition-none',
                  index === active ? 'w-7 bg-white' : 'w-1.5 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';

export function EmptyCart() {
  return (
    <div className="border border-dashed border-line rounded-[24px] bg-surface py-[60px] px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-4.5 grid place-items-center rounded-full bg-surface-soft text-ink-muted">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3.8 5.2h2.35l1.55 9.45a2 2 0 0 0 1.98 1.68h7.7a2 2 0 0 0 1.93-1.47l1.2-4.45H7.15" />
          <circle cx="9.45" cy="19.25" r="1.05" />
          <circle cx="17.25" cy="19.25" r="1.05" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-[22px]">Корзина пуста</h3>
      <p className="text-ink-muted text-sm mt-2 mx-auto max-w-[38ch] mb-5">
        Вы ещё ничего не добавили. Загляните в каталог — там есть из чего выбрать.
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2.5 h-[50px] px-6 rounded-full bg-primary text-primary-foreground font-bold text-[15px]"
      >
        Перейти в каталог
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}

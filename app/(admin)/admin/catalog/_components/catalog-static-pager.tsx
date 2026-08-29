export function CatalogStaticPager({ total, label }: { total: number; label: string }) {
  const from = total > 0 ? 1 : 0;
  const to = total;

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-outline-variant px-5 py-4">
      <p className="text-xs text-admin-on-surface-variant">
        Показано {from}–{to} из {total} {label}
      </p>
      <div className="flex items-center gap-2" aria-label={`Пагинация: ${label}`}>
        <button
          type="button"
          disabled
          aria-label="Предыдущая страница"
          className="grid h-10 w-10 place-items-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant opacity-30"
        >
          ‹
        </button>
        <button
          type="button"
          aria-current="page"
          className="grid h-10 w-10 place-items-center rounded-[12px] bg-admin-primary text-sm font-bold text-white"
        >
          1
        </button>
        <button
          type="button"
          disabled
          aria-label="Следующая страница"
          className="grid h-10 w-10 place-items-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant opacity-30"
        >
          ›
        </button>
      </div>
    </footer>
  );
}

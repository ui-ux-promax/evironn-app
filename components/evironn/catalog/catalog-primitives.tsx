import { FiCheck, FiX } from 'react-icons/fi';

type PageItem = number | 'gap';

function pageWindow(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: Math.max(0, total) }, (_, index) => index + 1);

  const safeCurrent = Math.min(Math.max(1, current), total);
  const pages = new Set<number>([1, total, safeCurrent, safeCurrent - 1, safeCurrent + 1]);
  if (safeCurrent <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (safeCurrent >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: PageItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap');
    result.push(page);
  });
  return result;
}

export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}): React.ReactElement | null {
  if (total <= 1) return null;

  const safePage = Math.min(Math.max(1, page), total);
  const changePage = (nextPage: number) => onChange(Math.min(Math.max(1, nextPage), total));

  return (
    <nav className="cat-pager cat-pager--boxes" aria-label="Страницы каталога">
      <button
        className="cat-pager__step"
        type="button"
        onClick={() => changePage(safePage - 1)}
        disabled={safePage === 1}
      >
        <span aria-hidden="true">←</span> Назад
      </button>
      <ul className="cat-pager__list">
        {pageWindow(safePage, total).map((item, index) => (
          <li key={item === 'gap' ? `gap-${index}` : item}>
            {item === 'gap' ? (
              <span className="cat-pager__gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                className={`cat-pager__page${item === safePage ? ' is-current' : ''}`}
                type="button"
                aria-current={item === safePage ? 'page' : undefined}
                onClick={() => changePage(item)}
              >
                {item}
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        className="cat-pager__step"
        type="button"
        onClick={() => changePage(safePage + 1)}
        disabled={safePage === total}
      >
        Вперёд <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

const RANGE_STEP = 100;

function normalizeRange(value: [number, number], min: number, max: number): [number, number] {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);
  const span = upperBound - lowerBound;
  if (span < RANGE_STEP) return [lowerBound, upperBound];

  const clamp = (entry: number) => Math.min(upperBound, Math.max(lowerBound, entry));
  const snap = (entry: number) =>
    Math.min(upperBound, Math.max(lowerBound, lowerBound + Math.round((entry - lowerBound) / RANGE_STEP) * RANGE_STEP));
  const sorted = [clamp(value[0]), clamp(value[1])].sort((a, b) => a - b);
  let lower = snap(sorted[0]);
  let upper = snap(sorted[1]);

  if (upper - lower < RANGE_STEP) {
    if (upperBound - lowerBound >= RANGE_STEP) {
      if (lower + RANGE_STEP <= upperBound) upper = lower + RANGE_STEP;
      else lower = upper - RANGE_STEP;
    }
  }

  return [Math.max(lowerBound, lower), Math.min(upperBound, upper)];
}

function parseRangeInput(value: string, fallback: number): number {
  const parsed = Number(value.replace(/\D/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function PriceRange({
  value,
  min,
  max,
  onChange,
}: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
}): React.ReactElement {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const [lower, upper] = normalizeRange(value, safeMin, safeMax);
  const left = ((lower - safeMin) / Math.max(1, safeMax - safeMin)) * 100;
  const right = ((upper - safeMin) / Math.max(1, safeMax - safeMin)) * 100;

  const setLower = (next: number) => onChange(normalizeRange([next, upper], safeMin, safeMax));
  const setUpper = (next: number) => onChange(normalizeRange([lower, next], safeMin, safeMax));

  return (
    <div className="cat-range">
      <div className="cat-range__track" aria-hidden="true">
        <span className="cat-range__fill" style={{ left: `${left}%`, right: `${100 - right}%` }} />
      </div>
      <input
        className="cat-range__input"
        type="range"
        min={safeMin}
        max={safeMax}
        step={RANGE_STEP}
        value={lower}
        aria-label="Цена от"
        onChange={(event) => setLower(Number(event.target.value))}
      />
      <input
        className="cat-range__input"
        type="range"
        min={safeMin}
        max={safeMax}
        step={RANGE_STEP}
        value={upper}
        aria-label="Цена до"
        onChange={(event) => setUpper(Number(event.target.value))}
      />
      <div className="cat-range__fields">
        <label>
          <span>от</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Цена от"
            value={lower.toLocaleString('ru-RU')}
            onChange={(event) => setLower(parseRangeInput(event.target.value, safeMin))}
          />
        </label>
        <span className="cat-range__dash" aria-hidden="true">
          —
        </span>
        <label>
          <span>до</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Цена до"
            value={upper.toLocaleString('ru-RU')}
            onChange={(event) => setUpper(parseRangeInput(event.target.value, safeMax))}
          />
        </label>
      </div>
    </div>
  );
}

export function CheckRow({
  label,
  count,
  checked,
  disabled,
  swatchHex,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  swatchHex?: string | null;
  onChange: () => void;
}): React.ReactElement {
  const isDisabled = disabled ?? (count === 0 && !checked);
  return (
    <label className={`cat-check${isDisabled ? ' is-disabled' : ''}${checked ? ' is-on' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          if (!isDisabled) onChange();
        }}
        disabled={isDisabled}
      />
      <span className="cat-check__box" aria-hidden="true">
        <FiCheck />
      </span>
      {swatchHex && (
        <span className="cat-check__swatch" title={label} style={{ background: swatchHex }} aria-hidden="true" />
      )}
      <span className="cat-check__label">{label}</span>
      {count !== undefined && <span className="cat-check__count">{count}</span>}
    </label>
  );
}

export function ChipRow({
  chips,
  onRemove,
  onClear,
}: {
  chips: Array<{ id: string; label: string }>;
  onRemove: (id: string) => void;
  onClear: () => void;
}): React.ReactElement | null {
  if (!chips.length) return null;
  return (
    <div className="cat-chips">
      <span className="cat-chips__title">Выбрано</span>
      <ul>
        {chips.map((chip) => (
          <li key={chip.id}>
            <button type="button" onClick={() => onRemove(chip.id)}>
              {chip.label}
              <FiX aria-hidden="true" />
              <span className="cat-sr">Убрать фильтр</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="cat-chips__clear" type="button" onClick={onClear}>
        Сбросить всё
      </button>
    </div>
  );
}

export function ResultCount({ shown, total }: { shown: number; total: number }): React.ReactElement {
  return (
    <p className="cat-result" role="status">
      Показано <b>{shown}</b> из <b>{total}</b>
    </p>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }): React.ReactElement {
  return (
    <div className="cat-empty">
      <p className="cat-empty__title">Ничего не нашлось</p>
      <p className="cat-empty__copy">
        Попробуйте ослабить фильтры — например, расширить диапазон цены или снять ограничение по материалу.
      </p>
      <button className="cat-empty__button" type="button" onClick={onReset}>
        Сбросить фильтры
      </button>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSliders, FiX } from 'react-icons/fi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CatalogCard } from '@/components/evironn/catalog/catalog-card';
import type { CatalogBFacetGroup, CatalogBModel } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { catalogBQueryFromSearchParams } from '@/components/evironn/catalog/catalog-url-state';
import {
  CheckRow,
  ChipRow,
  EmptyState,
  Pagination,
  PriceRange,
  ResultCount,
} from '@/components/evironn/catalog/catalog-primitives';
import { formatPrice } from '@/lib/format';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Популярные', fullLabel: 'Популярные' },
  { value: 'new', label: 'Новинки', fullLabel: 'Сначала новинки' },
  { value: 'price-asc', label: 'Дешевле', fullLabel: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Дороже', fullLabel: 'Цена: по убыванию' },
] as const;
function values(query: URLSearchParams, key: string): string[] {
  return (query.get(key) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
function options(query: URLSearchParams, group: string): string[] {
  return values(query, 'option')
    .filter((token) => token.startsWith(`${group}:`))
    .map((token) => token.slice(group.length + 1));
}
function setValues(query: URLSearchParams, key: string, next: string[]): void {
  if (next.length) query.set(key, next.join(','));
  else query.delete(key);
}
function toggle(query: URLSearchParams, key: string, value: string): void {
  const current = values(query, key);
  if (current.includes(value))
    setValues(
      query,
      key,
      current.filter((entry) => entry !== value),
    );
  else setValues(query, key, [...current, value]);
}
function toggleOption(query: URLSearchParams, group: string, value: string): void {
  const token = `${group}:${value}`;
  const current = values(query, 'option');
  if (current.includes(token))
    setValues(
      query,
      'option',
      current.filter((entry) => entry !== token),
    );
  else setValues(query, 'option', [...current, token]);
}
function resetPage(query: URLSearchParams): void {
  query.delete('page');
}
function queryWithoutPage(query: URLSearchParams): URLSearchParams {
  const normalized = new URLSearchParams(query);
  normalized.delete('page');
  return normalized;
}

function queryWithoutOptionGroup(query: URLSearchParams, group: string): URLSearchParams {
  const normalized = queryWithoutPage(query);
  setValues(
    normalized,
    'option',
    values(normalized, 'option').filter((token) => !token.startsWith(`${group}:`)),
  );
  return normalized;
}

function exactFacetDraftCount(model: CatalogBModel, query: URLSearchParams, draft: URLSearchParams): number | null {
  const normalizedQuery = queryWithoutPage(query);
  const normalizedDraft = queryWithoutPage(draft);
  if (normalizedDraft.toString() === normalizedQuery.toString()) return model.total;

  for (const group of model.facetGroups) {
    const selected =
      group.key === 'category' ? values(normalizedDraft, 'category') : options(normalizedDraft, group.key);
    if (selected.length !== 1) continue;

    const queryWithoutGroup = new URLSearchParams(normalizedQuery);
    const draftWithoutGroup = new URLSearchParams(normalizedDraft);
    if (group.key === 'category') {
      queryWithoutGroup.delete('category');
      draftWithoutGroup.delete('category');
    } else {
      const queryWithoutOptions = queryWithoutOptionGroup(normalizedQuery, group.key);
      const draftWithoutOptions = queryWithoutOptionGroup(normalizedDraft, group.key);
      if (queryWithoutOptions.toString() !== draftWithoutOptions.toString()) continue;
      return group.values.find((value) => value.id === selected[0])?.count ?? null;
    }

    if (queryWithoutGroup.toString() !== draftWithoutGroup.toString()) continue;
    return group.values.find((value) => value.id === selected[0])?.count ?? null;
  }

  return null;
}

function chipsFor(query: URLSearchParams, model: CatalogBModel): Array<{ id: string; label: string }> {
  const chips: Array<{ id: string; label: string }> = [];
  model.facetGroups.forEach((group) => {
    const selected = group.key === 'category' ? values(query, 'category') : options(query, group.key);
    selected.forEach((id) =>
      chips.push({ id: `${group.key}:${id}`, label: group.values.find((value) => value.id === id)?.label ?? id }),
    );
  });
  if (query.has('priceFrom')) chips.push({ id: 'priceFrom', label: formatPrice(Number(query.get('priceFrom'))) });
  if (query.has('priceTo')) chips.push({ id: 'priceTo', label: formatPrice(Number(query.get('priceTo'))) });
  if (query.has('inStock')) chips.push({ id: 'inStock', label: 'Только в наличии' });
  return chips;
}
function isSelected(query: URLSearchParams, group: CatalogBFacetGroup, id: string): boolean {
  return group.key === 'category' ? values(query, 'category').includes(id) : options(query, group.key).includes(id);
}

function useSegmentIndicator(active: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 5, width: 0 });

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const sync = () => {
      const button = list.querySelectorAll('button')[active] as HTMLElement | undefined;
      if (button) setStyle({ left: button.offsetLeft, width: button.offsetWidth });
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(sync);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active]);

  return { ref, style };
}

function FacetControl({
  group,
  query,
  onToggle,
}: {
  group: CatalogBFacetGroup;
  query: URLSearchParams;
  onToggle: (id: string) => void;
}): React.ReactElement {
  if (group.kind === 'pill')
    return (
      <div className="cat-b__pill-row">
        {group.values.map((value) => (
          <button
            key={value.id}
            type="button"
            className={isSelected(query, group, value.id) ? 'is-on' : ''}
            disabled={value.count === 0 && !isSelected(query, group, value.id)}
            onClick={() => onToggle(value.id)}
          >
            {value.label}
          </button>
        ))}
      </div>
    );
  if (group.kind === 'swatch')
    return (
      <div className="cat-b__swatch-row">
        {group.values.map((value) => (
          <button
            key={value.id}
            type="button"
            className={isSelected(query, group, value.id) ? 'is-on' : ''}
            aria-pressed={isSelected(query, group, value.id)}
            style={{ '--swatch': value.swatchHex ?? '#d8d3c9' } as React.CSSProperties}
            onClick={() => onToggle(value.id)}
          >
            <span aria-hidden="true" />
            {value.label}
          </button>
        ))}
      </div>
    );
  return (
    <>
      {group.values.map((value) => (
        <CheckRow
          key={value.id}
          label={value.label}
          count={value.count}
          swatchHex={value.swatchHex}
          checked={isSelected(query, group, value.id)}
          onChange={() => onToggle(value.id)}
        />
      ))}
    </>
  );
}

export function CatalogVariantB({ model }: { model: CatalogBModel }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(
    () => catalogBQueryFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(new URLSearchParams(query));
  const gridRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const activeRoom = query.get('room') ?? 'all';
  const activeSort = query.get('sort') ?? 'new';
  const scene = model.roomTabs.find((tab) => tab.id === activeRoom) ?? model.roomTabs[0];
  const roomIndicator = useSegmentIndicator(model.roomTabs.findIndex((tab) => tab.id === activeRoom));
  const sortIndicator = useSegmentIndicator(SORT_OPTIONS.findIndex((option) => option.value === activeSort));
  const chips = chipsFor(query, model);
  const draftCount = exactFacetDraftCount(model, query, draft);
  const navigate = (next: URLSearchParams, clearCurrentPage = true) => {
    if (clearCurrentPage) resetPage(next);
    router.push(`${pathname}${next.toString() ? `?${next}` : ''}`);
  };
  const openDrawer = () => {
    setDraft(new URLSearchParams(query));
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    const drawer = drawerRef.current;
    const trigger = filterButtonRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        drawer?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href]') ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = focusable.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      const next = event.shiftKey
        ? current <= 0
          ? last
          : focusable[current - 1]
        : current < 0 || current >= focusable.length - 1
          ? first
          : focusable[current + 1];
      next.focus();
    };
    drawer?.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      drawer?.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [drawerOpen]);
  const reset = () => navigate(new URLSearchParams(), false);
  const changePage = (page: number) => {
    const next = new URLSearchParams(query);
    next.set('page', String(page));
    router.push(`${pathname}?${next}`);
    requestAnimationFrame(() =>
      gridRef.current?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' }),
    );
  };
  const draftFacetChange = (group: CatalogBFacetGroup, id: string) => {
    const next = new URLSearchParams(draft);
    if (group.key === 'category') toggle(next, 'category', id);
    else toggleOption(next, group.key, id);
    setDraft(next);
  };

  return (
    <main className="cat-b" id="main-content">
      <section className="cat-b__stage">
        {/* Native local image preserves clone keyed reload and exact object-fit behavior. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={scene.id} className="cat-b__stage-media" src={scene.image} alt="" />
        <div className="cat-b__stage-scrim" aria-hidden="true" />
        <div className="cat-b__stage-inner">
          <p className="cat-b__eyebrow">Каталог · {model.total} предметов</p>
          <h1>Мебель под комнату, а не под категорию</h1>
          <div className="cat-b__seg" role="tablist" aria-label="Комната">
            <div className="cat-b__seg-control" ref={roomIndicator.ref}>
              <span
                className="cat-b__seg-indicator"
                style={{ left: roomIndicator.style.left, width: roomIndicator.style.width }}
                aria-hidden="true"
              />
              {model.roomTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={tab.id === activeRoom}
                  className={tab.id === activeRoom ? 'is-active' : ''}
                  onClick={() => {
                    const next = new URLSearchParams(query);
                    if (tab.id === 'all') next.delete('room');
                    else next.set('room', tab.id);
                    navigate(next);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="cat-b__bar">
        <div className="cat-b__bar-inner">
          <button ref={filterButtonRef} className="cat-b__filter-button" type="button" onClick={openDrawer}>
            <FiSliders aria-hidden="true" />
            Фильтры{chips.length > 0 && <span>{chips.length}</span>}
          </button>
          <div className="cat-b__sort" role="group" aria-label="Сортировка">
            <div className="cat-b__seg-control cat-b__seg-control--sm" ref={sortIndicator.ref}>
              <span
                className="cat-b__seg-indicator"
                style={{ left: sortIndicator.style.left, width: sortIndicator.style.width }}
                aria-hidden="true"
              />
              {['popular', 'new', 'price-asc', 'price-desc'].map((value) => {
                const option = SORT_OPTIONS.find((candidate) => candidate.value === value)!;
                const label =
                  value === 'popular'
                    ? 'Популярные'
                    : value === 'new'
                      ? 'Новинки'
                      : value === 'price-asc'
                        ? 'Цена ↑'
                        : 'Цена ↓';
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.fullLabel}
                    aria-pressed={option.value === activeSort}
                    className={option.value === activeSort ? 'is-active' : ''}
                    onClick={() => {
                      const next = new URLSearchParams(query);
                      next.set('sort', option.value);
                      navigate(next);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <ResultCount shown={model.shown} total={model.total} />
        </div>
      </div>
      <section className="cat-b__body" aria-label="Товары">
        <ChipRow
          chips={chips}
          onRemove={(id) => {
            const next = new URLSearchParams(query);
            if (id === 'inStock' || id === 'priceFrom' || id === 'priceTo') next.delete(id);
            else {
              const [group, value] = id.split(':');
              if (group === 'category') toggle(next, 'category', value);
              else toggleOption(next, group, value);
            }
            navigate(next);
          }}
          onClear={reset}
        />
        {model.cards.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : (
          <>
            <div className="cat-b__grid" ref={gridRef}>
              {model.cards.map((card, index) => (
                <CatalogCard key={card.id} product={card} eager={index < 4} />
              ))}
            </div>
            <div className="cat-b__pager">
              <Pagination page={model.page} total={model.totalPages} onChange={changePage} />
            </div>
          </>
        )}
      </section>
      <div className={`cat-b__drawer-root${drawerOpen ? ' is-open' : ''}`}>
        <button className="cat-b__scrim" type="button" aria-label="Закрыть фильтры" onClick={closeDrawer} />
        <aside
          ref={drawerRef}
          className="cat-b__drawer"
          role="dialog"
          aria-label="Фильтры"
          aria-modal="true"
          aria-hidden={!drawerOpen}
        >
          <header className="cat-b__drawer-head">
            <p>Фильтры</p>
            <button ref={closeButtonRef} type="button" onClick={closeDrawer} aria-label="Закрыть">
              <FiX aria-hidden="true" />
            </button>
          </header>
          <div className="cat-b__drawer-body">
            <section>
              <h3>Цена, ₽</h3>
              <PriceRange
                value={[
                  Number(draft.get('priceFrom')) || model.price.min,
                  Number(draft.get('priceTo')) || model.price.max,
                ]}
                min={model.price.min}
                max={model.price.max}
                onChange={([from, to]) => {
                  const next = new URLSearchParams(draft);
                  next.set('priceFrom', String(from));
                  next.set('priceTo', String(to));
                  setDraft(next);
                }}
              />
            </section>
            {model.facetGroups.map((group) => (
              <section key={group.key}>
                <h3>{group.title}</h3>
                <FacetControl group={group} query={draft} onToggle={(id) => draftFacetChange(group, id)} />
              </section>
            ))}
            <section>
              <h3>Наличие</h3>
              <div className="cat-b__pill-row">
                <button
                  type="button"
                  className={draft.has('inStock') ? 'is-on' : ''}
                  onClick={() => {
                    const next = new URLSearchParams(draft);
                    if (next.has('inStock')) next.delete('inStock');
                    else next.set('inStock', '1');
                    setDraft(next);
                  }}
                >
                  Только в наличии
                </button>
              </div>
            </section>
          </div>
          <footer className="cat-b__drawer-foot">
            <button className="cat-b__ghost" type="button" onClick={() => setDraft(new URLSearchParams())}>
              Сбросить
            </button>
            <button
              className="cat-b__apply"
              type="button"
              aria-describedby="catalog-drawer-count-help"
              onClick={() => {
                navigate(new URLSearchParams(draft));
                setDrawerOpen(false);
              }}
            >
              {draftCount === null ? 'Показать результаты' : `Показать ${draftCount}`}
            </button>
            <span id="catalog-drawer-count-help" className="cat-sr">
              {draftCount === null
                ? 'Количество будет рассчитано после применения.'
                : 'Количество соответствует выбранным фильтрам.'}
            </span>
          </footer>
        </aside>
      </div>
    </main>
  );
}

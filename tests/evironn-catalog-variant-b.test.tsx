/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CatalogVariantB } from '@/components/evironn/catalog/catalog-variant-b';
import type { CatalogBModel } from '@/components/evironn/catalog/catalog-variant-b-adapter';

const push = vi.fn();
let currentQuery = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/catalog',
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => currentQuery,
}));

vi.mock('@/components/evironn/catalog/catalog-card', () => ({
  CatalogCard: ({ product }: { product: CatalogBModel['cards'][number] }) => (
    <article data-testid="catalog-card">{product.name}</article>
  ),
}));

const modelFixture: CatalogBModel = {
  cards: [
    {
      id: 'product-1',
      slug: 'noma-woven-lounge',
      name: 'Noma Woven Lounge',
      brand: 'Evironn',
      categoryName: 'Кресла',
      imageUrl: '/assets/products/03-ivory-lounge-idle.webp',
      imageAlt: 'Noma Woven Lounge',
      primarySkuId: 'sku-1',
      minPrice: 89000,
      minOldPrice: null,
      badges: [],
      soldOut: false,
      optionSwatches: [],
      href: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
      media: {
        idle: '/assets/products/03-ivory-lounge-idle.webp',
        forward: '/assets/products/03-ivory-lounge-forward.mp4',
        reverse: '/assets/products/03-ivory-lounge-reverse.mp4',
      },
      note: 'Кресла',
      colors: [],
    },
  ],
  total: 1,
  shown: 1,
  page: 1,
  totalPages: 1,
  roomTabs: [
    { id: 'all', label: 'Все', image: '/assets/hero/kitchen-idle.jpg' },
    { id: 'living', label: 'Гостиная', image: '/assets/editorial/images/71c2b8589fc6.png' },
    { id: 'dining', label: 'Столовая', image: '/assets/hero/kitchen-idle.jpg' },
    { id: 'bedroom', label: 'Спальня', image: '/assets/hero/bedroom-idle.jpg' },
    { id: 'terrace', label: 'Терраса', image: '/assets/hero/terrace-idle.jpg' },
  ],
  facetGroups: [
    {
      key: 'category',
      title: 'Категория',
      kind: 'pill',
      values: [{ id: 'armchairs', label: 'Кресла', count: 1 }],
    },
    {
      key: 'finish',
      title: 'Отделка',
      kind: 'swatch',
      values: [{ id: 'oak', label: 'Дуб', count: 1, swatchHex: '#c8a97e' }],
    },
  ],
  price: { min: 89000, max: 89000 },
};

describe('Catalog Variant B shell', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  beforeEach(() => {
    push.mockReset();
    currentQuery = new URLSearchParams();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  it('composes Variant B shell from serializable model', () => {
    render(<CatalogVariantB model={modelFixture} />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { name: /Мебель под комнату/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Фильтры' })).toBeInTheDocument();
    expect(document.querySelector('.cat-b__desktop-facets')).toBeNull();
    expect(screen.getAllByTestId('catalog-card')).toHaveLength(modelFixture.cards.length);
    expect(screen.getByRole('group', { name: /Сортировка/i })).toBeInTheDocument();
    expect(document.querySelectorAll('.cat-b__seg-indicator')).toHaveLength(2);
  });

  it('opens drawer with filter controls and closes on Escape', () => {
    render(<CatalogVariantB model={modelFixture} />);

    fireEvent.click(screen.getByRole('button', { name: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b' }));
    expect(screen.getByRole('dialog', { name: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b' })).toBeVisible();
    expect(screen.getByRole('button', { name: /\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c/i })).toBeVisible();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(document.querySelector('.cat-b__drawer')).toHaveAttribute('aria-hidden', 'true');
  });

  it('resets page on room and sort changes', () => {
    currentQuery = new URLSearchParams('room=living&sort=new&page=3');
    render(<CatalogVariantB model={modelFixture} />);
    fireEvent.click(screen.getAllByRole('tab')[3]);
    expect(push).toHaveBeenLastCalledWith('/catalog?room=bedroom&sort=new');
    fireEvent.click(document.querySelectorAll('.cat-b__seg-control--sm button')[2]);
    expect(push).toHaveBeenLastCalledWith('/catalog?room=living&sort=price-asc');
  });

  it('keeps drawer facet changes local until apply and restores body scroll on scrim', () => {
    document.body.style.overflow = 'clip';
    render(<CatalogVariantB model={modelFixture} />);
    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    const drawer = document.querySelector('.cat-b__drawer') as HTMLElement;
    fireEvent.click(within(drawer).getAllByRole('button')[1]);
    expect(push).not.toHaveBeenCalled();
    expect(within(drawer).getByRole('button', { name: /Показать/i })).toHaveTextContent('Показать 0');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть фильтры' }));
    expect(document.body.style.overflow).toBe('clip');
  });

  it('renders price chips and removes one price bound without losing URL state', () => {
    currentQuery = new URLSearchParams('priceFrom=1000&priceTo=5000&inStock=1&page=2');
    render(<CatalogVariantB model={modelFixture} />);

    expect(screen.getByRole('button', { name: /1\s*000/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5\s*000/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /5\s*000/ }));
    expect(push).toHaveBeenLastCalledWith('/catalog?priceFrom=1000&inStock=1');
  });

  it('uses the authoritative total only for an unchanged draft and explains unavailable preview counts', () => {
    render(<CatalogVariantB model={{ ...modelFixture, total: 12 }} />);

    fireEvent.click(document.querySelector('.cat-b__filter-button')!);
    const drawer = screen.getByRole('dialog');
    const apply = within(drawer).getByRole('button', { name: /Показать/ });
    expect(apply).toHaveTextContent('Показать 12');
    expect(apply).toHaveAttribute('aria-describedby', 'catalog-drawer-count-help');

    fireEvent.click(drawer.querySelector('.cat-b__swatch-row button')!);
    expect(apply).toHaveTextContent('Показать 0');
    expect(screen.getByText(/Точное количество.*применения/i)).toBeInTheDocument();
  });

  it('opens an accessible dialog, traps Tab, closes on Escape, and restores trigger focus', () => {
    render(<CatalogVariantB model={modelFixture} />);

    const trigger = screen.getByRole('button', { name: /Фильтры/ });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: /Фильтры/ });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрыть' }));

    const apply = screen.getByRole('button', { name: /Показать 1/ });
    apply.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрыть' }));
    screen.getByRole('button', { name: 'Закрыть' }).focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(apply);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });

  it('preserves clone sort labels and order while using canonical sort values', () => {
    render(<CatalogVariantB model={modelFixture} />);
    const sort = document.querySelector('.cat-b__sort') as HTMLElement;
    expect(
      within(sort)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Популярные', 'Новинки', 'Цена ↑', 'Цена ↓']);
  });

  it('resets approved keys and uses reduced-motion paging scroll', () => {
    currentQuery = new URLSearchParams('category=armchairs&page=2&legacy=keep');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    });
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    render(<CatalogVariantB model={{ ...modelFixture, totalPages: 2 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }));
    expect(push).toHaveBeenLastCalledWith('/catalog');
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(push).toHaveBeenLastCalledWith('/catalog?category=armchairs&page=2');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  });

  it('keeps exact shell and route contracts', () => {
    const shell = readFileSync('components/evironn/catalog/catalog-variant-b.tsx', 'utf8');
    const route = readFileSync('app/(shop)/catalog/page.tsx', 'utf8');
    const css = readFileSync('styles/evironn/catalog-variant-b.css', 'utf8');
    for (const className of [
      'cat-b__stage',
      'cat-b__stage-inner',
      'cat-b__bar',
      'cat-b__body',
      'cat-b__grid',
      'cat-b__drawer-root',
      'cat-b__drawer',
      'cat-b__seg-indicator',
    ])
      expect(shell).toContain(className);
    expect(shell).toMatch(/key=\{scene\.id\}/);
    expect(route).toMatch(/force-dynamic/);
    expect(route).toContain('findProducts');
    expect(route).toContain('buildCatalogItemListJsonLd');
    expect(css).toMatch(/prefers-reduced-motion/);
    expect(css.match(/(?:^|\n)\.cat-b__seg-indicator\s*\{/g) ?? []).toHaveLength(1);
    for (const deadTernary of [
      'next.length ?',
      'current.includes(value) ?',
      'current.includes(token) ?',
      "tab.id === 'all' ?",
      "next.has('inStock') ?",
    ])
      expect(shell).not.toContain(deadTernary);
    expect(`${shell}\n${route}`).not.toMatch(
      /CATALOG_PRODUCTS|CatalogVariantA|CatalogVariantC|["'`]\/catalog-[abc](?:[/?"'`])|CatalogProductCard|FilterSidebar|MobileFilterDrawer|CatalogHero|EmptyCatalog/,
    );
  });
});

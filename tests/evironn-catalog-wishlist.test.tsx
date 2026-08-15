/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { pushMock, toggleMock } = vi.hoisted(() => ({ pushMock: vi.fn(), toggleMock: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/catalog',
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/app/actions/wishlist', () => ({ toggleWishlist: toggleMock }));

vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import type { CatalogBCard, CatalogBModel } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { CatalogCard } from '@/components/evironn/catalog/catalog-card';
import { CatalogVariantB } from '@/components/evironn/catalog/catalog-variant-b';

const card: CatalogBCard = {
  id: 'p1',
  slug: 'chair',
  name: 'Chair',
  brand: 'Evironn',
  categoryName: 'Chairs',
  imageUrl: null,
  imageAlt: 'Chair',
  primarySkuId: 'sku-1',
  minPrice: 100,
  minOldPrice: null,
  badges: [],
  soldOut: false,
  optionSwatches: [],
  href: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  media: { idle: '/idle.webp', forward: '/forward.mp4', reverse: '/reverse.mp4' },
  note: 'Chairs',
  colors: [],
};

const model: CatalogBModel = {
  cards: [card],
  total: 1,
  shown: 1,
  page: 1,
  totalPages: 1,
  roomTabs: [{ id: 'all', label: 'Все', image: '/room.jpg' }],
  facetGroups: [],
  price: { min: 1, max: 1000 },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('controlled catalog wishlist', () => {
  it('renders server-provided pressed state and delegates product mutation', async () => {
    const onWishlistToggle = vi.fn().mockResolvedValue({ ok: true, active: false });
    render(<CatalogCard product={card} wishlisted onWishlistToggle={onWishlistToggle} />);
    const button = screen.getByRole('button', { name: /Убрать Chair/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);
    await waitFor(() => expect(onWishlistToggle).toHaveBeenCalledWith('p1'));
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses successful server result and rolls back controller state on failure', async () => {
    let rejectMutation!: (error: Error) => void;
    const failedMutation = new Promise<never>((_, reject) => {
      rejectMutation = reject;
    });
    toggleMock.mockResolvedValueOnce({ ok: true, active: true }).mockReturnValueOnce(failedMutation);
    render(<CatalogVariantB model={model} initialWishlistedIds={[]} />);
    const button = screen.getByRole('button', { name: /Добавить Chair/i });

    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(toggleMock).toHaveBeenCalledWith({ productId: 'p1' });

    fireEvent.click(screen.getByRole('button', { name: /Убрать Chair/i }));
    rejectMutation(new Error('network'));
    await expect(failedMutation).rejects.toThrow('network');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Убрать Chair/i })).toHaveAttribute('aria-pressed', 'true'),
    );
  });
});

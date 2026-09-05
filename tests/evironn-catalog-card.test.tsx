/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

let finePointer = true;
let reducedMotion = false;

const matchMedia = vi.fn((query: string) => ({
  matches:
    query === '(hover: hover) and (pointer: fine)'
      ? finePointer
      : query === '(prefers-reduced-motion: reduce)' && reducedMotion,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  onchange: null,
  dispatchEvent: vi.fn(),
}));

vi.stubGlobal('matchMedia', matchMedia);
vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { CatalogCard } from '@/components/evironn/catalog/catalog-card';
import type { WishlistMutationResult } from '@/services/dto/wishlist.dto';

const cardFixture: CatalogBCard = {
  id: 'product-1',
  slug: 'chair-1',
  name: 'Noma Woven Lounge',
  brand: 'Evironn',
  categoryName: 'Кресла',
  imageUrl: '/assets/products/01-bar-stool-idle.webp',
  imageAlt: 'Noma Woven Lounge',
  primarySkuId: 'sku-1',
  minPrice: 89000,
  minOldPrice: 109000,
  badges: [{ tone: 'discount', label: '-18%' }],
  soldOut: false,
  optionSwatches: [
    { groupSlug: 'finish', valueSlug: 'oak', label: 'Дуб', swatchHex: '#c89b6d' },
    { groupSlug: 'upholstery', valueSlug: 'linen', label: 'Лён', swatchHex: null },
  ],
  href: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  media: {
    idle: '/assets/products/01-bar-stool-idle.webp',
    forward: '/assets/products/01-bar-stool-forward.mp4',
    reverse: '/assets/products/01-bar-stool-reverse.mp4',
  },
  note: 'Кресла, Дуб, Лён',
  colors: [
    { label: 'Дуб', swatchHex: '#c89b6d' },
    { label: 'Лён', swatchHex: null },
  ],
};

type WishlistToggle = (productId: string) => Promise<WishlistMutationResult>;
const defaultWishlistToggle: WishlistToggle = async () => ({ ok: true, active: false });

function renderCard(
  product: CatalogBCard = cardFixture,
  options: {
    eager?: boolean;
    wishlisted?: boolean;
    wishlistPending?: boolean;
    onWishlistToggle?: WishlistToggle;
  } = {},
) {
  return render(
    <CatalogCard
      product={product}
      eager={options.eager}
      wishlisted={options.wishlisted ?? false}
      wishlistPending={options.wishlistPending}
      onWishlistToggle={options.onWishlistToggle ?? defaultWishlistToggle}
    />,
  );
}

afterEach(() => {
  cleanup();
  finePointer = true;
  reducedMotion = false;
  vi.clearAllMocks();
});

describe('CatalogCard', () => {
  it('renders compact furniture card with showcase destination and canonical values', () => {
    renderCard(cardFixture, { eager: true });

    expect(screen.getByRole('link', { name: /Noma Woven Lounge/i })).toHaveAttribute(
      'href',
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(screen.getByText('89 000 ₽')).toBeInTheDocument();
    expect(screen.getByText('109 000 ₽')).toBeInTheDocument();
    expect(screen.getAllByText('-18%')).toHaveLength(2);
    expect(screen.getByText('Кресла, Дуб, Лён')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Добавить Noma Woven Lounge/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(document.querySelector('.cat-card__media img')).toHaveAttribute('loading', 'eager');
    const swatches = [...document.querySelectorAll<HTMLLIElement>('.cat-card__colors li')];
    expect(swatches.map((swatch) => swatch.title)).toEqual(['Дуб', 'Лён']);
    expect(swatches[0]).toHaveStyle({ background: 'rgb(200, 155, 109)' });
    expect(swatches[1]).toHaveStyle({ background: 'rgb(216, 211, 201)' });
  });

  it('keeps idle media visible when hover playback errors', () => {
    renderCard();
    const frame = screen.getByRole('link', { name: /Noma/i });
    fireEvent.pointerEnter(frame);
    const video = frame.querySelector('video') as HTMLVideoElement;
    fireEvent.error(video);
    expect(frame.querySelector('img')).not.toHaveClass('is-hidden');
    expect(video).not.toHaveClass('is-frame-ready');
  });

  it('renders controlled wishlist state and sold-out server state', async () => {
    const onWishlistToggle = vi.fn<WishlistToggle>().mockResolvedValue({ ok: true, active: true });
    const { rerender } = renderCard({ ...cardFixture, badges: [], soldOut: true }, { onWishlistToggle });

    const favorite = screen.getByRole('button', { name: /Добавить Noma Woven Lounge/i });
    fireEvent.click(favorite);
    await vi.waitFor(() => expect(onWishlistToggle).toHaveBeenCalledWith('product-1'));
    expect(favorite).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <CatalogCard
        product={{ ...cardFixture, badges: [], soldOut: true }}
        wishlisted
        onWishlistToggle={onWishlistToggle}
      />,
    );
    expect(screen.getByRole('button', { name: /Убрать Noma Woven Lounge/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Под заказ')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveClass('is-out');
    expect(screen.queryByText('Распродано')).not.toBeInTheDocument();
  });

  it('shows pending feedback only on active wishlist card and restores after resolve', async () => {
    let resolveMutation!: (result: WishlistMutationResult) => void;
    const pendingMutation = new Promise<WishlistMutationResult>((resolve) => {
      resolveMutation = resolve;
    });
    const onWishlistToggle = vi.fn<WishlistToggle>().mockReturnValue(pendingMutation);

    render(
      <>
        <CatalogCard product={cardFixture} wishlisted={false} onWishlistToggle={onWishlistToggle} />
        <CatalogCard
          product={{ ...cardFixture, id: 'product-2', name: 'Second Chair' }}
          wishlisted={false}
          onWishlistToggle={onWishlistToggle}
        />
      </>,
    );

    const [activeFavorite, idleFavorite] = screen.getAllByRole('button', { name: /Добавить .* в избранное/i });
    fireEvent.click(activeFavorite);
    expect(activeFavorite).toBeDisabled();
    expect(activeFavorite).toHaveAttribute('aria-busy', 'true');
    expect(activeFavorite.querySelector('svg')).toHaveClass('h-[18px]', 'w-[18px]');
    expect(idleFavorite).not.toBeDisabled();
    fireEvent.click(activeFavorite);
    expect(onWishlistToggle).toHaveBeenCalledTimes(1);

    resolveMutation({ ok: true, active: true });
    await waitFor(() => expect(activeFavorite).not.toBeDisabled());
    expect(activeFavorite).not.toHaveAttribute('aria-busy');
    expect(activeFavorite.querySelector('svg')).not.toHaveClass('h-[18px]');
  });

  it('restores wishlist control after rejected mutation', async () => {
    let rejectMutation!: (error: Error) => void;
    const pendingMutation = new Promise<WishlistMutationResult>((_, reject) => {
      rejectMutation = reject;
    });
    const onWishlistToggle = vi.fn<WishlistToggle>().mockReturnValue(pendingMutation);

    renderCard(cardFixture, { onWishlistToggle });
    const favorite = screen.getByRole('button', { name: /Добавить Noma Woven Lounge/i });
    fireEvent.click(favorite);
    expect(favorite).toHaveAttribute('aria-busy', 'true');
    rejectMutation(new Error('network'));
    await waitFor(() => expect(favorite).not.toBeDisabled());
    expect(favorite).not.toHaveAttribute('aria-busy');
    expect(favorite).toHaveAttribute('aria-pressed', 'false');
  });

  it('uses an externally owned pending state without starting a second local request', () => {
    const onWishlistToggle = vi.fn<WishlistToggle>();
    renderCard(cardFixture, { wishlistPending: true, onWishlistToggle });

    const favorite = screen.getByRole('button', { name: /Добавить Noma Woven Lounge/i });
    expect(favorite).toBeDisabled();
    expect(favorite).toHaveAttribute('aria-busy', 'true');
    expect(favorite.querySelector('svg')).toHaveClass('h-[18px]', 'w-[18px]');
    fireEvent.click(favorite);
    expect(onWishlistToggle).not.toHaveBeenCalled();
  });

  it('activates forward playback on fine-pointer hover and reverse on leave', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video');
    expect(video).not.toBeNull();
    Object.defineProperty(video, 'duration', { configurable: true, value: 4 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 1 });

    fireEvent.pointerEnter(link);
    expect(video).toHaveAttribute('src', cardFixture.media.forward);
    fireEvent.loadedMetadata(video!);
    fireEvent.loadedData(video!);
    expect(video).toHaveAttribute('src', cardFixture.media.forward);

    fireEvent.pointerLeave(link);
    expect(video).toHaveAttribute('src', cardFixture.media.reverse);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it('plays forward on focus and starts reverse on blur', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video')!;

    fireEvent.focus(link);
    expect(video).toHaveAttribute('src', cardFixture.media.forward);
    fireEvent.blur(link);
    expect(video).toHaveAttribute('src', cardFixture.media.reverse);
  });

  it('does not reverse on pointer leave while card link remains focused', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video')!;

    fireEvent.pointerEnter(link);
    fireEvent.focus(link);
    fireEvent.pointerLeave(link);

    expect(video).toHaveAttribute('src', cardFixture.media.forward);
  });

  it('does not reverse on blur while pointer remains over card link', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video')!;

    fireEvent.focus(link);
    fireEvent.pointerEnter(link);
    fireEvent.blur(link);

    expect(video).toHaveAttribute('src', cardFixture.media.forward);
  });

  it('keeps stale forward events from revealing or playing media after reverse wins the race', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video')!;

    fireEvent.pointerEnter(link);
    fireEvent.loadedMetadata(video);
    fireEvent.pointerLeave(link);
    fireEvent.loadedData(video);

    expect(video).not.toHaveClass('is-frame-ready');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('shows frozen canvas during reverse and restores idle layer after reverse completion', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const media = document.querySelector('.cat-card__media')!;
    const image = media.querySelector('img')!;
    const canvas = media.querySelector('canvas')!;
    const video = media.querySelector<HTMLVideoElement>('video')!;
    Object.defineProperty(video, 'readyState', { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA });
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 720 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 720 });
    Object.defineProperty(video, 'duration', { configurable: true, value: 4 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 2 });

    fireEvent.pointerEnter(link);
    fireEvent.loadedMetadata(video);
    fireEvent.loadedData(video);
    expect(video).toHaveClass('is-frame-ready');
    expect(image).toHaveClass('is-hidden');
    expect(canvas).not.toHaveClass('is-visible');

    fireEvent.pointerLeave(link);
    expect(drawImage).toHaveBeenCalled();
    expect(canvas).toHaveClass('is-visible');
    expect(image).toHaveClass('is-hidden');
    expect(video).not.toHaveClass('is-frame-ready');

    fireEvent.loadedMetadata(video);
    fireEvent.seeked(video);
    expect(video).toHaveClass('is-frame-ready');
    fireEvent.ended(video);
    expect(image).not.toHaveClass('is-hidden');
    expect(canvas).not.toHaveClass('is-visible');
    expect(video).not.toHaveClass('is-frame-ready');
  });

  it('rejects hover playback on coarse pointers', () => {
    finePointer = false;
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const video = document.querySelector<HTMLVideoElement>('.cat-card__media video')!;
    fireEvent.pointerEnter(link);

    expect(video).not.toHaveAttribute('src');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('keeps reduced-motion cards static while preserving idle fallback', () => {
    reducedMotion = true;
    renderCard();

    const link = screen.getByRole('link', { name: /Noma Woven Lounge/i });
    const media = document.querySelector('.cat-card__media')!;
    const image = media.querySelector('img')!;
    const canvas = media.querySelector('canvas')!;
    const video = media.querySelector<HTMLVideoElement>('video')!;
    fireEvent.focus(link);
    fireEvent.pointerEnter(link);

    expect(video).not.toHaveAttribute('src');
    expect(image).not.toHaveClass('is-hidden');
    expect(canvas).not.toHaveClass('is-visible');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('uses lazy idle image and no video preload by default', () => {
    renderCard();

    expect(document.querySelector('.cat-card__media img')).toHaveAttribute('loading', 'lazy');
    expect(document.querySelector('.cat-card__media video')).toHaveAttribute('preload', 'none');
  });

  it('preserves clone classes, helper imports, muted inline media, race guard, and reduced-motion hook', () => {
    const source = readFileSync('components/evironn/catalog/catalog-card.tsx', 'utf8');

    for (const className of [
      'cat-card',
      'cat-card--compact',
      'cat-card__frame',
      'cat-card__media',
      'cat-card__badge',
      'cat-card__peek',
      'cat-card__fav',
      'cat-card__body',
      'cat-card__name',
      'cat-card__note',
      'cat-card__price',
      'cat-card__colors',
    ]) {
      expect(source).toContain(className);
    }
    expect(source).toMatch(/CARD_PLAYBACK_RATE/);
    expect(source).toMatch(/getMediaLayerState/);
    expect(source).toMatch(/getReverseStartTime/);
    expect(source).toMatch(/operationRef/);
    expect(source).toMatch(/muted/);
    expect(source).toMatch(/playsInline/);
    expect(source).toMatch(/preload="none"/);
    expect(source).toMatch(/prefers-reduced-motion/);
    expect(source).toMatch(/wishlisted/);
    expect(source).toMatch(/onWishlistToggle/);
    expect(source).toMatch(/aria-pressed=\{wishlisted\}/);
    expect(source).toMatch(/onWishlistToggle\(product\.id\)/);
    expect(source).not.toMatch(/setFavorite/);
    expect(source).not.toMatch(/LegacyCatalogCardProps/);
    expect(source).not.toMatch(/async \(\) => \(\{ ok: true, active: true \}\)/);
  });
});

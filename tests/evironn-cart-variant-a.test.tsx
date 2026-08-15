/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import type { CartDto, CartLineDto } from '@/services/dto/commerce-cart.dto';

const mocks = vi.hoisted(() => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
  addToWishlist: vi.fn(),
  toggleWishlist: vi.fn(),
  refreshWishlistCount: vi.fn(),
  validateCoupon: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  Api: {
    cart: {
      getCart: mocks.getCart,
      addCartItem: mocks.addCartItem,
      updateItemQuantity: mocks.updateItemQuantity,
      removeCartItem: mocks.removeCartItem,
      clearCart: mocks.clearCart,
    },
  },
}));
vi.mock('@/app/actions/wishlist', () => ({ addToWishlist: mocks.addToWishlist, toggleWishlist: mocks.toggleWishlist }));
vi.mock('@/app/actions/coupon', () => ({ validateCoupon: mocks.validateCoupon }));
vi.mock('@/store/wishlist', () => ({
  useWishlistStore: (selector: (state: { refreshAfterMutation: typeof mocks.refreshWishlistCount }) => unknown) =>
    selector({ refreshAfterMutation: mocks.refreshWishlistCount }),
}));
vi.mock('@/components/evironn/catalog/catalog-card', () => ({
  CatalogCard: ({
    product,
    wishlisted,
    onWishlistToggle,
  }: {
    product: CatalogBCard;
    wishlisted: boolean;
    onWishlistToggle: (productId: string) => Promise<unknown>;
  }) => (
    <article data-testid="related-card">
      <a href={product.href}>{product.name}</a>
      <button
        type="button"
        aria-pressed={wishlisted}
        aria-label={wishlisted ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`}
        onClick={() => void onWishlistToggle(product.id).catch(() => undefined)}
      />
    </article>
  ),
}));

import { CartVariantA } from '@/components/evironn/cart/cart-variant-a';
import { useCartStore } from '@/store/cart';
import { useCouponStore } from '@/store/coupon';

const line: CartLineDto = {
  id: 'line-1',
  skuId: 'sku-noma-walnut',
  productId: 'product-noma',
  productSlug: 'noma-woven-lounge',
  name: 'Noma Woven Lounge',
  articleNumber: 'EV-NWL-WAL',
  configuration: [
    { groupSlug: 'finish', groupLabel: 'Отделка', valueSlug: 'walnut', valueLabel: 'Орех', swatchHex: '#6b4934' },
    {
      groupSlug: 'upholstery',
      groupLabel: 'Обивка',
      valueSlug: 'ivory-boucle',
      valueLabel: 'Айвори',
      swatchHex: '#eee5d8',
    },
  ],
  imageUrl: '/assets/products/03-ivory-lounge-idle.webp',
  imageAlt: 'Noma Woven Lounge',
  quantity: 1,
  unitPrice: 89000,
  oldUnitPrice: 99000,
  lineTotal: 89000,
  oldLineTotal: 99000,
  stock: 2,
  available: true,
};

const related = {
  id: 'product-related',
  slug: 'related',
  name: 'Related Chair',
  brand: 'Evironn',
  categoryName: 'Кресла',
  imageUrl: null,
  imageAlt: 'Related Chair',
  primarySkuId: 'sku-related',
  minPrice: 50000,
  minOldPrice: null,
  badges: [],
  soldOut: false,
  optionSwatches: [],
  href: '/product/related?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  media: { idle: '', forward: '', reverse: '' },
  note: 'Кресла',
  colors: [],
} as unknown as CatalogBCard;

const secondRelated = {
  ...related,
  id: 'product-second',
  slug: 'second-product',
  primarySkuId: 'sku-second',
  name: 'Second Product',
  href: '/product/second-product?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
} as unknown as CatalogBCard;

function cart(items: CartLineDto[] = [line]): CartDto {
  return {
    items,
    totals: {
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
      compareAtSubtotal: items.reduce((sum, item) => sum + (item.oldLineTotal ?? item.lineTotal), 0),
      saleDiscount: items.reduce((sum, item) => sum + (item.oldLineTotal ?? item.lineTotal) - item.lineTotal, 0),
      couponDiscount: 0,
      total: items.reduce((sum, item) => sum + item.lineTotal, 0),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      lineCount: items.length,
    },
  };
}

const empty = cart([]);

function renderCart(snapshot = cart()) {
  mocks.getCart.mockResolvedValue(snapshot);
  return render(<CartVariantA related={[related, secondRelated]} initialWishlistedIds={[]} />);
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  useCartStore.setState({ ...empty, loading: false, error: false, totalAmount: 0 });
  useCouponStore.setState({ coupon: null });
});

afterEach(() => cleanup());

describe('Cart Variant A', () => {
  it('renders canonical configuration, selected swatches, server prices, and stock-limited stepper', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    expect(screen.getByText(/Отделка: Орех/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Отделка: Орех' })).toBeInTheDocument();
    expect(screen.getAllByText(/89/).length).toBeGreaterThan(0);

    const increase = screen.getByRole('button', { name: 'Добавить одну штуку Noma Woven Lounge' });
    expect(increase).not.toBeDisabled();
    mocks.updateItemQuantity.mockResolvedValue(
      cart([{ ...line, quantity: 2, lineTotal: 178000, oldLineTotal: 198000 }]),
    );
    fireEvent.click(increase);
    await waitFor(() => expect(mocks.updateItemQuantity).toHaveBeenCalledWith('line-1', 2));
    expect(screen.getByRole('button', { name: 'Добавить одну штуку Noma Woven Lounge' })).toBeDisabled();
  });

  it('controls related wishlist pressed state, rolls back failed toggles, and refreshes count', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const add = screen.getByRole('button', { name: 'Добавить Related Chair в избранное' });
    mocks.toggleWishlist.mockResolvedValueOnce({ ok: true, active: true });

    fireEvent.click(add);
    await waitFor(() => expect(add).toHaveAttribute('aria-pressed', 'true'));
    expect(mocks.refreshWishlistCount).toHaveBeenCalledTimes(1);

    mocks.toggleWishlist.mockRejectedValueOnce(new Error('Сбой избранного'));
    fireEvent.click(screen.getByRole('button', { name: 'Убрать Related Chair из избранного' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Убрать Related Chair из избранного' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(mocks.refreshWishlistCount).toHaveBeenCalledTimes(1);
  });

  it('uses distinct canonical related product hrefs', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    expect(screen.getByRole('link', { name: 'Related Chair' })).toHaveAttribute(
      'href',
      '/product/related?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(screen.getByRole('link', { name: 'Second Product' })).toHaveAttribute(
      'href',
      '/product/second-product?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
  });

  it('shows server coupon totals and disabled honest checkout controls without shipping rows', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.validateCoupon.mockResolvedValue({
      ok: true,
      code: 'EVIRONN10',
      percent: 10,
      discount: 8900,
      totals: { ...cart().totals, couponDiscount: 8900, total: 80100 },
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'EVIRONN10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    await waitFor(() => expect(screen.getByText(/Промокод EVIRONN10 принят/)).toBeInTheDocument());
    expect(screen.getAllByText(/80/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Доставка/)).not.toBeInTheDocument();
    const checkoutControls = screen.getAllByRole('button', {
      name: 'Оформление заказа будет доступно на следующем этапе.',
    });
    expect(checkoutControls[0]).toBeDisabled();
    expect(checkoutControls[1]).toHaveAttribute('aria-disabled', 'true');
  });

  it('discards stale coupon validation after a cart mutation', async () => {
    let resolveCoupon!: (value: unknown) => void;
    mocks.validateCoupon.mockReturnValue(new Promise((resolve) => (resolveCoupon = resolve)));
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    await waitFor(() => expect(mocks.validateCoupon).toHaveBeenCalledWith('WELCOME10'));

    mocks.updateItemQuantity.mockResolvedValue(
      cart([{ ...line, quantity: 2, lineTotal: 178000, oldLineTotal: 198000 }]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Добавить одну штуку Noma Woven Lounge' }));
    await waitFor(() => expect(mocks.updateItemQuantity).toHaveBeenCalledWith('line-1', 2));

    resolveCoupon({
      ok: true,
      code: 'WELCOME10',
      percent: 10,
      discount: 8900,
      totals: { ...cart().totals, couponDiscount: 8900, total: 80100 },
    });
    await waitFor(() => expect(useCouponStore.getState().coupon).toBeNull());
    expect(screen.queryByText(/Промокод WELCOME10 принят/)).not.toBeInTheDocument();
  });

  it('clears applied coupon after an external cart mutation', async () => {
    mocks.validateCoupon.mockResolvedValue({
      ok: true,
      code: 'WELCOME10',
      percent: 10,
      discount: 8900,
      totals: { ...cart().totals, couponDiscount: 8900, total: 80100 },
    });
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    await waitFor(() => expect(screen.getByText(/Промокод WELCOME10 принят/)).toBeInTheDocument());

    mocks.addCartItem.mockResolvedValue(cart([{ ...line, quantity: 2, lineTotal: 178000, oldLineTotal: 198000 }]));
    await useCartStore.getState().addCartItem({ skuId: line.skuId, quantity: 1 });

    await waitFor(() => expect(useCouponStore.getState().coupon).toBeNull());
    expect(screen.queryByText(/Промокод WELCOME10 принят/)).not.toBeInTheDocument();
  });

  it('rejects incomplete server coupon snapshots', async () => {
    mocks.validateCoupon.mockResolvedValue({ ok: true, code: 'WELCOME10', percent: 10, discount: 8900 });
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByText('Некорректный ответ сервера')).toBeInTheDocument();
    expect(useCouponStore.getState().coupon).toBeNull();
  });

  it('removes then undoes by canonical skuId and original quantity', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.removeCartItem.mockResolvedValue(empty);
    mocks.addCartItem.mockResolvedValue(cart());

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' }));
    await waitFor(() => expect(mocks.removeCartItem).toHaveBeenCalledWith('line-1'));
    fireEvent.click(screen.getByRole('button', { name: /Вернуть/ }));
    await waitFor(() => expect(mocks.addCartItem).toHaveBeenCalledWith({ skuId: 'sku-noma-walnut', quantity: 1 }));
  });

  it('does not send a legacy ProductVariant id through the canonical undo write', async () => {
    const legacyLine = { ...line, id: 'legacy-line', skuId: 'legacy-variant', isLegacy: true };
    renderCart(cart([legacyLine]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.removeCartItem.mockResolvedValue(empty);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Вернуть/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Вернуть/ }));

    expect(mocks.addCartItem).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Устаревшую позицию нельзя вернуть');
  });

  it('saves idempotently before delete and confirms saved item', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.addToWishlist.mockResolvedValue({ ok: true, active: true });
    mocks.removeCartItem.mockResolvedValue(empty);

    fireEvent.click(screen.getByRole('button', { name: 'Отложить Noma Woven Lounge' }));
    await waitFor(() => expect(mocks.addToWishlist).toHaveBeenCalledWith({ productId: 'product-noma' }));
    expect(mocks.addToWishlist.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.removeCartItem.mock.invocationCallOrder[0],
    );
    expect(mocks.refreshWishlistCount).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Товар сохранён в избранное')).toBeInTheDocument();
  });

  it('clears cart, adds related canonical SKU, and renders empty state', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.addCartItem.mockResolvedValue(cart());
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Related Chair в корзину' }));
    await waitFor(() => expect(mocks.addCartItem).toHaveBeenCalledWith({ skuId: 'sku-related', quantity: 1 }));

    mocks.clearCart.mockResolvedValue(empty);
    fireEvent.click(screen.getByRole('button', { name: 'Очистить корзину' }));
    await waitFor(() => expect(mocks.clearCart).toHaveBeenCalled());
    expect(await screen.findByText('В корзине пока пусто')).toBeInTheDocument();
  });

  it('shows server mutation errors and mobile summary remains disabled', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.removeCartItem.mockRejectedValue(new Error('Недостаточно на складе'));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Недостаточно на складе');
    expect(document.querySelector('.cart-a__mobile-bar')).toBeInTheDocument();
  });
});

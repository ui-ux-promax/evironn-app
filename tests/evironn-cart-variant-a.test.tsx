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
  push: vi.fn(),
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
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function expectFadeArc(control: HTMLElement) {
  expect(control.querySelector('svg')).toHaveAttribute('class', expect.stringContaining('spinner'));
}

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

  it('shows checkout navigation progress and rejects duplicate activation', async () => {
    renderCart();
    await waitFor(() => expect(screen.getAllByRole('link', { name: 'Оформить заказ' })).toHaveLength(2));

    const checkoutLinks = screen.getAllByRole('link', { name: 'Оформить заказ' });
    expect(checkoutLinks).toHaveLength(2);
    fireEvent.click(checkoutLinks[0]);
    fireEvent.click(checkoutLinks[0]);

    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith('/checkout');
    expect(checkoutLinks[0]).toHaveAttribute('aria-busy', 'true');
    expect(checkoutLinks[0]).toHaveTextContent('Оформить заказ');
    expectFadeArc(checkoutLinks[0]);
    expect(checkoutLinks[1]).toHaveAttribute('aria-busy', 'true');
    expectFadeArc(checkoutLinks[1]);
  });

  it('shows pending feedback only on the active cart mutation control', async () => {
    const firstLine = { ...line, quantity: 2, lineTotal: 178000, oldLineTotal: 198000 };
    const secondLine = { ...line, id: 'line-2', productId: 'product-second', name: 'Second Line', quantity: 2 };
    renderCart(cart([firstLine, secondLine]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    const update = deferred<CartDto>();
    mocks.updateItemQuantity.mockReturnValue(update.promise);
    const firstDecrease = screen.getByRole('button', { name: 'Убрать одну штуку Noma Woven Lounge' });
    const secondDecrease = screen.getByRole('button', { name: 'Убрать одну штуку Second Line' });

    fireEvent.click(firstDecrease);
    expect(firstDecrease).toBeDisabled();
    expect(firstDecrease).toHaveAttribute('aria-busy', 'true');
    expectFadeArc(firstDecrease);
    expect(secondDecrease).not.toHaveAttribute('aria-busy', 'true');
    fireEvent.click(firstDecrease);
    expect(mocks.updateItemQuantity).toHaveBeenCalledTimes(1);

    update.resolve(cart([{ ...line, quantity: 1, lineTotal: 89000, oldLineTotal: 99000 }, secondLine]));
    await waitFor(() => expect(firstDecrease).not.toHaveAttribute('aria-busy'));
  });

  it('restores quantity controls after rejected updates', async () => {
    renderCart(cart([{ ...line, quantity: 2, stock: 3, lineTotal: 178000, oldLineTotal: 198000 }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const update = deferred<CartDto>();
    mocks.updateItemQuantity.mockReturnValue(update.promise);
    const decrease = screen.getByRole('button', { name: 'Убрать одну штуку Noma Woven Lounge' });
    fireEvent.click(decrease);
    expectFadeArc(decrease);
    update.reject(new Error('Количество не обновлено'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Количество не обновлено'));
    expect(decrease).not.toBeDisabled();
    expect(decrease).not.toHaveAttribute('aria-busy');
  });

  it('keeps distinct same-line quantity controls independently pending', async () => {
    renderCart(cart([{ ...line, quantity: 2, stock: 3, lineTotal: 178000, oldLineTotal: 198000 }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const decreaseRequest = deferred<CartDto>();
    const increaseRequest = deferred<CartDto>();
    mocks.updateItemQuantity.mockReturnValueOnce(decreaseRequest.promise).mockReturnValueOnce(increaseRequest.promise);
    const decrease = screen.getByRole('button', { name: 'Убрать одну штуку Noma Woven Lounge' });
    const increase = screen.getByRole('button', { name: 'Добавить одну штуку Noma Woven Lounge' });
    const input = screen.getByRole('textbox', { name: 'Количество Noma Woven Lounge' });
    fireEvent.click(decrease);
    fireEvent.click(increase);
    expectFadeArc(decrease);
    expectFadeArc(increase);
    expect(input).not.toBeDisabled();
    decreaseRequest.reject(new Error('decrement failed'));
    increaseRequest.reject(new Error('increment failed'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('increment failed'));
    expect(decrease).not.toHaveAttribute('aria-busy');
    expect(increase).not.toHaveAttribute('aria-busy');
  });

  it('keeps remove, undo, and clear feedback scoped until each request settles', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    const remove = deferred<CartDto>();
    mocks.removeCartItem.mockReturnValue(remove.promise);
    const removeButton = screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' });
    fireEvent.click(removeButton);
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute('aria-busy', 'true');
    expect(removeButton).toHaveAttribute('aria-label', 'Удалить Noma Woven Lounge');
    expect(removeButton).toHaveTextContent('Удалить');
    expectFadeArc(removeButton);
    fireEvent.click(removeButton);
    expect(mocks.removeCartItem).toHaveBeenCalledTimes(1);
    remove.resolve(empty);
    const undoButton = await screen.findByRole('button', { name: /Вернуть/ });

    const undo = deferred<CartDto>();
    mocks.addCartItem.mockReturnValue(undo.promise);
    fireEvent.click(undoButton);
    expect(undoButton).toBeDisabled();
    expect(undoButton).toHaveAttribute('aria-busy', 'true');
    expect(undoButton).toHaveAccessibleName('Вернуть');
    expect(undoButton).toHaveTextContent('Вернуть');
    expectFadeArc(undoButton);
    fireEvent.click(undoButton);
    expect(mocks.addCartItem).toHaveBeenCalledTimes(1);
    undo.resolve(cart());
    await waitFor(() => expect(undoButton).not.toHaveAttribute('aria-busy'));

    const clear = deferred<CartDto>();
    mocks.clearCart.mockReturnValue(clear.promise);
    const clearButton = screen.getByRole('button', { name: 'Очистить корзину' });
    fireEvent.click(clearButton);
    expect(clearButton).toBeDisabled();
    expect(clearButton).toHaveAttribute('aria-busy', 'true');
    expect(clearButton).toHaveAccessibleName('Очистить корзину');
    expect(clearButton).toHaveTextContent('Очистить корзину');
    expectFadeArc(clearButton);
    fireEvent.click(clearButton);
    expect(mocks.clearCart).toHaveBeenCalledTimes(1);
    clear.resolve(empty);
    await screen.findByText('В корзине пока пусто');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('restores remove and clear controls after rejection', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const remove = deferred<CartDto>();
    mocks.removeCartItem.mockReturnValue(remove.promise);
    const removeButton = screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' });
    fireEvent.click(removeButton);
    expectFadeArc(removeButton);
    remove.reject(new Error('Удаление не выполнено'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Удаление не выполнено'));
    expect(removeButton).not.toBeDisabled();
    expect(removeButton).not.toHaveAttribute('aria-busy');

    const clear = deferred<CartDto>();
    mocks.clearCart.mockReturnValue(clear.promise);
    const clearButton = screen.getByRole('button', { name: 'Очистить корзину' });
    fireEvent.click(clearButton);
    expectFadeArc(clearButton);
    clear.reject(new Error('Очистка не выполнена'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Очистка не выполнена'));
    expect(clearButton).not.toBeDisabled();
    expect(clearButton).not.toHaveAttribute('aria-busy');
  });

  it('restores undo control after rejected canonical restore', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.removeCartItem.mockResolvedValue(empty);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' }));
    const undoButton = await screen.findByRole('button', { name: /Вернуть/ });
    const undo = deferred<CartDto>();
    mocks.addCartItem.mockReturnValue(undo.promise);
    fireEvent.click(undoButton);
    expectFadeArc(undoButton);
    undo.reject(new Error('Возврат не выполнен'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Возврат не выполнен'));
    expect(undoButton).not.toBeDisabled();
    expect(undoButton).not.toHaveAttribute('aria-busy');
  });

  it('keeps save-to-wishlist and related add feedback independent', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    const save = deferred<{ ok: true; active: true }>();
    const remove = deferred<CartDto>();
    mocks.addToWishlist.mockReturnValue(save.promise);
    mocks.removeCartItem.mockReturnValue(remove.promise);
    const saveButton = screen.getByRole('button', { name: 'Отложить Noma Woven Lounge' });
    fireEvent.click(saveButton);
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toHaveAttribute('aria-label', 'Отложить Noma Woven Lounge');
    expect(saveButton).toHaveTextContent('В избранное');
    expectFadeArc(saveButton);
    fireEvent.click(saveButton);
    expect(mocks.addToWishlist).toHaveBeenCalledTimes(1);
    save.resolve({ ok: true, active: true });
    await waitFor(() => expect(mocks.removeCartItem).toHaveBeenCalledWith('line-1'));
    remove.resolve(empty);
    await screen.findByText('Товар сохранён в избранное');

    cleanup();
    useCartStore.setState({ ...empty, loading: false, error: false, totalAmount: 0 });
    const add = deferred<CartDto>();
    mocks.addCartItem.mockReturnValue(add.promise);
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const addButton = screen.getByRole('button', { name: 'Добавить Related Chair в корзину' });
    fireEvent.click(addButton);
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute('aria-busy', 'true');
    expect(addButton).toHaveAttribute('aria-label', 'Добавить Related Chair в корзину');
    expect(addButton).toHaveTextContent('Добавить в корзину');
    expectFadeArc(addButton);
    expect(screen.getByRole('button', { name: 'Добавить Second Product в корзину' })).not.toHaveAttribute(
      'aria-busy',
      'true',
    );
    fireEvent.click(addButton);
    expect(mocks.addCartItem).toHaveBeenCalledTimes(1);
    add.resolve(cart());
    await waitFor(() => expect(addButton).not.toHaveAttribute('aria-busy'));
  });

  it('restores wishlist and related add controls after rejection', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    const save = deferred<{ ok: true; active: true }>();
    mocks.addToWishlist.mockReturnValue(save.promise);
    const saveButton = screen.getByRole('button', { name: 'Отложить Noma Woven Lounge' });
    fireEvent.click(saveButton);
    expectFadeArc(saveButton);
    save.reject(new Error('Избранное недоступно'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Избранное недоступно'));
    expect(saveButton).not.toBeDisabled();
    expect(saveButton).not.toHaveAttribute('aria-busy');

    const add = deferred<CartDto>();
    mocks.addCartItem.mockReturnValue(add.promise);
    const addButton = screen.getByRole('button', { name: 'Добавить Related Chair в корзину' });
    fireEvent.click(addButton);
    expectFadeArc(addButton);
    add.reject(new Error('Добавление недоступно'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Добавление недоступно'));
    expect(addButton).not.toBeDisabled();
    expect(addButton).not.toHaveAttribute('aria-busy');
  });

  it('shows promo validation feedback while preserving the apply label', async () => {
    const validation = deferred<unknown>();
    mocks.validateCoupon.mockReturnValue(validation.promise);
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'WELCOME10' } });
    const apply = screen.getByRole('button', { name: 'Применить' });
    fireEvent.click(apply);
    const pendingApply = screen.getByRole('button', { name: /Проверка/ });
    expect(pendingApply).toBeDisabled();
    expect(pendingApply).toHaveAttribute('aria-busy', 'true');
    expectFadeArc(pendingApply);
    expect(pendingApply).toHaveTextContent('Проверка');
    fireEvent.click(pendingApply);
    expect(mocks.validateCoupon).toHaveBeenCalledTimes(1);
    validation.reject(new Error('Проверка недоступна'));
    await waitFor(() => expect(screen.getByText('Проверка недоступна')).toBeInTheDocument());
    const restoredApply = screen.getByRole('button', { name: 'Применить' });
    expect(restoredApply).not.toBeDisabled();
    expect(restoredApply).not.toHaveAttribute('aria-busy');
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
    const checkoutControls = screen.getAllByRole('link', { name: 'Оформить заказ' });
    expect(checkoutControls).toHaveLength(2);
    for (const control of checkoutControls) expect(control).toHaveAttribute('href', '/checkout');
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

  it('shows server mutation errors and mobile summary remains available', async () => {
    renderCart();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    mocks.removeCartItem.mockRejectedValue(new Error('Недостаточно на складе'));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить Noma Woven Lounge' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Недостаточно на складе');
    expect(document.querySelector('.cart-a__mobile-bar')).toBeInTheDocument();
  });

  it('explains loading, unavailable, and failed cart checkout blockers', async () => {
    let resolveCart!: (value: CartDto) => void;
    mocks.getCart.mockReturnValue(new Promise((resolve) => (resolveCart = resolve)));
    render(<CartVariantA related={[]} initialWishlistedIds={[]} />);
    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    const loadingCheckout = document.querySelector<HTMLButtonElement>('.cart-a__checkout[disabled]');
    expect(loadingCheckout).toBeDisabled();
    expect(loadingCheckout).toHaveAttribute('aria-busy', 'true');
    expect(loadingCheckout).toHaveTextContent('Дождитесь загрузки корзины.');
    expect(loadingCheckout?.querySelector('.cart-a__checkout-spinner')).toBeInTheDocument();
    resolveCart(cart());
    await waitFor(() => expect(screen.getAllByRole('link', { name: 'Оформить заказ' })).toHaveLength(2));
    cleanup();

    renderCart(cart([{ ...line, available: false }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(document.querySelector('.cart-a__checkout[disabled]')).toHaveTextContent(
      'В корзине есть товары, которых нет в наличии.',
    );
    cleanup();

    mocks.getCart.mockRejectedValue(new Error('Cart failed'));
    useCartStore.setState({ ...cart(), loading: false, error: false, totalAmount: 100000 });
    render(<CartVariantA related={[]} initialWishlistedIds={[]} />);
    await waitFor(() => expect(useCartStore.getState().error).toBe(true));
    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(document.querySelector('.cart-a__mobile-bar [aria-disabled="true"]')).toHaveTextContent('Недоступно');
    expect(document.querySelector('.cart-a__mobile-bar [aria-disabled="true"]')).toHaveAccessibleName(
      'Не удалось загрузить корзину. Обновите страницу.',
    );
  });

  it('explains legacy non-canonical checkout blockers', async () => {
    renderCart(cart([{ ...line, isLegacy: true, available: true }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(document.querySelector('.cart-a__mobile-bar [aria-disabled="true"]')).toHaveAccessibleName(
      'В корзине есть устаревшие позиции. Добавьте их заново.',
    );
  });

  it('blocks checkout when a concurrent stock drop leaves quantity above stock', async () => {
    renderCart(cart([{ ...line, quantity: 2, stock: 1, available: true }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(document.querySelector('.cart-a__mobile-bar [aria-disabled="true"]')).toHaveAccessibleName(
      'Количество некоторых товаров превышает доступный остаток.',
    );
  });

  it('blocks checkout when a canonical line exceeds the quantity limit of 99', async () => {
    renderCart(cart([{ ...line, quantity: 100, stock: 120, available: true }]));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Корзина' })).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(document.querySelector('.cart-a__mobile-bar [aria-disabled="true"]')).toHaveAccessibleName(
      'Количество товара в одной позиции не может превышать 99.',
    );
  });
});

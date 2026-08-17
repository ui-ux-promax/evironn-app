/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckoutPageDto, CheckoutQuoteDto } from '@/services/dto/checkout-page.dto';

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  placeOrder: vi.fn(),
  replace: vi.fn(),
  assign: vi.fn(),
  getCart: vi.fn(),
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock('@/app/actions/checkout', () => ({ getCheckoutQuote: mocks.quote }));
vi.mock('@/app/actions/order', () => ({ placeOrder: mocks.placeOrder }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/services/api-client', () => ({
  Api: {
    cart: {
      getCart: mocks.getCart,
      updateItemQuantity: mocks.updateItemQuantity,
      removeCartItem: mocks.removeCartItem,
    },
  },
}));

import { CheckoutVariantA } from '@/components/evironn/checkout/checkout-variant-a';
import { useCartStore } from '@/store/cart';

const cart = {
  items: [
    {
      id: 'line-1',
      skuId: 'sku-1',
      productId: 'product-1',
      productSlug: 'noma-woven-lounge',
      name: 'Noma',
      articleNumber: 'EV-1',
      configuration: [],
      imageUrl: null,
      imageAlt: 'Noma',
      quantity: 1,
      unitPrice: 100000,
      oldUnitPrice: null,
      lineTotal: 100000,
      oldLineTotal: null,
      stock: 2,
      available: true,
    },
  ],
  totals: {
    subtotal: 100000,
    compareAtSubtotal: 100000,
    saleDiscount: 0,
    couponDiscount: 0,
    total: 100000,
    itemCount: 1,
    lineCount: 1,
  },
};

const initialData: CheckoutPageDto = {
  status: 'READY',
  contactDefaults: { contactName: 'Anna', contactEmail: 'anna@example.com', contactPhone: '+79991234567' },
  savedAddresses: [
    { id: 'home', label: 'Home', city: 'Moscow', street: '  Tverskaya, 10  ', comment: 'Intercom 7', isDefault: true },
  ],
  addressDefaults: { city: 'Moscow', addressLine: 'Tverskaya, 10', addressComment: 'Intercom 7' },
  initialCart: cart,
  deliveryOptions: [
    { id: 'courier', label: 'Courier' },
    { id: 'showroom', label: 'Showroom' },
    { id: 'pickup-point', label: 'Pickup point' },
  ],
  pickupPoints: [
    {
      id: 'showroom-1',
      kind: 'showroom',
      name: 'Evironn',
      address: 'Design factory',
      hours: '10:00-20:00',
      metro: 'Dmitrovskaya',
      leadDays: 1,
    },
    {
      id: 'point-1',
      kind: 'pickup-point',
      name: 'Point',
      address: 'Moscow',
      hours: '10:00-20:00',
      metro: 'Center',
      leadDays: 2,
    },
  ],
  initialSlots: {
    courier: [{ id: '2026-08-20:10-14', date: '2026-08-20', windowId: '10-14', windowLabel: '10:00 - 14:00' }],
    showroom: [{ id: '2026-08-19:10-14', date: '2026-08-19', windowId: '10-14', windowLabel: '10:00 - 14:00' }],
    pickupPoint: [{ id: '2026-08-21:10-14', date: '2026-08-21', windowId: '10-14', windowLabel: '10:00 - 14:00' }],
  },
};

const quote: CheckoutQuoteDto = {
  cart,
  coupon: null,
  delivery: { method: 'courier', zone: 'moscow', slot: initialData.initialSlots.courier[0], pickupPoint: null },
  serviceLines: [],
  totals: {
    itemsSubtotal: 100000,
    compareAtSubtotal: 100000,
    saleDiscount: 0,
    couponDiscount: 0,
    deliveryAmount: 1900,
    serviceAmount: 0,
    total: 101900,
    itemCount: 1,
    lineCount: 1,
  },
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.quote.mockResolvedValue({ ok: true, quote });
  mocks.getCart.mockResolvedValue(cart);
  useCartStore.setState({ ...cart, loading: false, error: false, totalAmount: 100000 });
  vi.stubGlobal('location', { assign: mocks.assign });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Checkout Variant A', () => {
  it('renders three receiving modes and replaces quote from server', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    expect(screen.getByRole('radio', { name: /Courier/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Showroom/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Pickup point/ })).toBeInTheDocument();
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    expect(screen.getAllByText(/101/).length).toBeGreaterThan(0);
  });

  it('preserves saved street text after trimming', () => {
    render(<CheckoutVariantA initialData={initialData} />);
    fireEvent.click(screen.getByRole('radio', { name: /Home/ }));
    expect(screen.getByRole('textbox', { name: 'Адрес' })).toHaveValue('Tverskaya, 10');
  });

  it('locks blocked placement and exposes only order navigation', async () => {
    mocks.placeOrder.mockResolvedValue({
      ok: false,
      code: 'PAYMENT_INITIALIZATION_BLOCKED',
      paymentInitialization: {
        status: 'PAYMENT_INITIALIZATION_BLOCKED',
        orderNumber: 42,
        heading: 'Платёж требует проверки',
        message: 'Заказ №42 сохранён.',
        continuePaymentUrl: null,
        canRetryCreate: false,
        allowedActions: ['OPEN_ORDER'],
      },
    });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);
    expect(await screen.findByRole('heading', { name: 'Платёж требует проверки' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /42/ })).toHaveAttribute('href', '/orders/42?placed=1');
    expect(mocks.replace).toHaveBeenCalledWith('/orders/42?placed=1');
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
  });

  it('invalidates the old quote while a changed delivery quote rejects', async () => {
    let rejectQuote!: (error: Error) => void;
    mocks.quote
      .mockResolvedValueOnce({ ok: true, quote })
      .mockReturnValueOnce(new Promise((_, reject) => (rejectQuote = reject)));
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.click(screen.getByRole('radio', { name: 'Московская область' }));
    rejectQuote(new Error('Quote network failed'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Quote network failed');
    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
    expect(mocks.placeOrder).not.toHaveBeenCalled();
  });

  it('invalidates an in-flight quote when changed delivery input becomes invalid', async () => {
    let resolveQuote!: (value: { ok: true; quote: CheckoutQuoteDto }) => void;
    mocks.quote.mockReturnValue(new Promise((resolve) => (resolveQuote = resolve)));
    render(
      <CheckoutVariantA
        initialData={{
          ...initialData,
          pickupPoints: initialData.pickupPoints.filter((point) => point.kind !== 'showroom'),
        }}
      />,
    );
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('radio', { name: /Showroom/ }));
    await act(async () => resolveQuote({ ok: true, quote }));

    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
  });

  it('keeps the newest successful quote when responses finish out of order', async () => {
    let resolveFirst!: (value: { ok: true; quote: CheckoutQuoteDto }) => void;
    let resolveSecond!: (value: { ok: true; quote: CheckoutQuoteDto }) => void;
    mocks.quote
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('radio', { name: 'Московская область' }));
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    await act(async () => resolveSecond({ ok: true, quote: { ...quote, totals: { ...quote.totals, total: 202000 } } }));
    await screen.findAllByText(/202/);
    await act(async () => resolveFirst({ ok: true, quote }));

    expect(screen.getAllByText(/202/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/101 900/)).not.toBeInTheDocument();
  });

  it('does not label unselected services as free without a server price', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    expect(screen.getByText('Сборка на месте').closest('li')).not.toHaveTextContent('Бесплатно');
    expect(screen.getByText('Вывоз старой мебели').closest('li')).not.toHaveTextContent('Бесплатно');
  });

  it('renders authoritative quote cart lines and mobile summary details', async () => {
    mocks.quote.mockResolvedValue({
      ok: true,
      quote: {
        ...quote,
        coupon: { code: 'SAVE5', percent: 5 },
        cart: { ...cart, items: [{ ...cart.items[0], name: 'Server Noma', lineTotal: 99000 }] },
        serviceLines: [{ id: 'assembly', label: 'Сборка на месте', amount: 3900 }],
        totals: {
          ...quote.totals,
          compareAtSubtotal: 110000,
          saleDiscount: 10000,
          couponDiscount: 5000,
          serviceAmount: 3900,
          total: 100800,
        },
      },
    });
    render(<CheckoutVariantA initialData={initialData} />);

    expect(await screen.findAllByText('Server Noma')).not.toHaveLength(0);
    expect(document.querySelector('.crt-qty')).toBeInTheDocument();
    expect(document.querySelectorAll('.crt-sum')).toHaveLength(2);
    expect(screen.getAllByText('Выгода по акции')).toHaveLength(2);
    expect(screen.getAllByText('Промокод −5%')).toHaveLength(2);
    expect(document.querySelector('.chk-bar__details')).toBeInTheDocument();
    expect(document.querySelector('.chk-bar__sheet')).toHaveTextContent('Server Noma');
    expect(document.querySelector('.chk-bar__sheet')).toHaveTextContent('Доставка');
  });

  it.each([
    [{ ok: true, code: 'ORDER_READY', orderNumber: 11 }, '/orders/11?placed=1'],
    [{ ok: false, code: 'PAYMENT_INITIALIZATION_PENDING', orderNumber: 12, error: 'Pending' }, '/orders/12?placed=1'],
  ])('routes durable order result %# to its order page', async (result, href) => {
    mocks.placeOrder.mockResolvedValue(result);
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(href));
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it('redirects a ready online payment only to the YooKassa URL', async () => {
    mocks.placeOrder.mockResolvedValue({
      ok: true,
      code: 'PAYMENT_REDIRECT_READY',
      orderNumber: 13,
      paymentUrl: 'https://yookassa.test/confirmation',
    });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith('https://yookassa.test/confirmation'));
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('submits COD explicitly and navigates to the durable order', async () => {
    mocks.placeOrder.mockResolvedValue({ ok: true, code: 'ORDER_READY', orderNumber: 14 });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('radio', { name: /При получении/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/orders/14?placed=1'));
    expect(mocks.placeOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'cod' }));
    expect(mocks.assign).not.toHaveBeenCalled();
  });
});

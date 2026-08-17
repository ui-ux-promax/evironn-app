/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckoutPageDto, CheckoutQuoteDto } from '@/services/dto/checkout-page.dto';

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  placeOrder: vi.fn(),
  replace: vi.fn(),
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
});
afterEach(cleanup);

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
});

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
  refresh: vi.fn(),
  assign: vi.fn(),
  getCart: vi.fn(),
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock('@/app/actions/checkout', () => ({ getCheckoutQuote: mocks.quote }));
vi.mock('@/app/actions/order', () => ({ placeOrder: mocks.placeOrder }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
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

const emptyCart = {
  items: [],
  totals: {
    subtotal: 0,
    compareAtSubtotal: 0,
    saleDiscount: 0,
    couponDiscount: 0,
    total: 0,
    itemCount: 0,
    lineCount: 0,
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
  serviceLines: [{ id: 'carrying', label: 'Подъём на этаж', amount: 0 }],
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

  it('normalizes the initially selected saved address like later selections', () => {
    render(
      <CheckoutVariantA
        initialData={{
          ...initialData,
          savedAddresses: [
            {
              ...initialData.savedAddresses[0],
              city: '  Moscow  ',
              street: '  Tverskaya, 10  ',
              comment: '  Intercom 7  ',
            },
          ],
          addressDefaults: {
            city: '  Moscow  ',
            addressLine: '  Tverskaya, 10  ',
            addressComment: '  Intercom 7  ',
          },
        }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Moscow');
    expect(screen.getByRole('textbox', { name: 'Адрес' })).toHaveValue('Tverskaya, 10');
    expect(screen.getByRole('textbox', { name: 'Комментарий курьеру' })).toHaveValue('Intercom 7');
  });

  it('renders clone lift labels while preserving production values', () => {
    render(<CheckoutVariantA initialData={initialData} />);

    expect(screen.getByRole('radio', { name: 'Пассажирский' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Пассажирский' })).toHaveAttribute('title', 'Подъём входит в доставку');
    expect(screen.getByRole('radio', { name: 'Грузовой' })).toHaveAttribute('title', 'Подъём входит в доставку');
    expect(screen.getByRole('radio', { name: 'Лифта нет' })).toHaveAttribute(
      'title',
      'Подъём на руках, оплачивается по этажам',
    );
  });

  it('starts with carrying selected to match the clone default', () => {
    render(<CheckoutVariantA initialData={initialData} />);

    expect(screen.getByRole('checkbox', { name: /Подъём на этаж/ })).toBeChecked();
  });

  it('preserves service selections across pickup and courier switches', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    const assembly = screen.getByRole('checkbox', { name: /Сборка на месте/ });
    const removal = screen.getByRole('checkbox', { name: /Вывоз старой мебели/ });
    fireEvent.click(assembly);
    fireEvent.click(removal);
    fireEvent.click(screen.getByRole('radio', { name: /Showroom/ }));
    await waitFor(() =>
      expect(mocks.quote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          deliveryMethod: 'showroom',
          services: { carrying: false, assembly: false, removal: false },
        }),
      ),
    );
    fireEvent.click(screen.getByRole('radio', { name: /Courier/ }));

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Подъём на этаж/ })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /Сборка на месте/ })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /Вывоз старой мебели/ })).toBeChecked();
      expect(mocks.quote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          deliveryMethod: 'courier',
          services: { carrying: true, assembly: true, removal: true },
        }),
      );
    });
  });

  it('uses the truthful floor-lift service label and dynamic lift notes', async () => {
    render(<CheckoutVariantA initialData={initialData} />);

    expect(await screen.findByRole('checkbox', { name: /Подъём на этаж.*бесплатно/ })).toBeChecked();
    expect(screen.getByText('Пассажирский лифт — подъём уже включён в доставку')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Грузовой' }));
    expect(screen.getByText('Грузовой лифт — подъём уже включён в доставку')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Лифта нет' }));
    expect(screen.getByText('Без лифта — 350 ₽ за этаж выше первого')).toBeInTheDocument();
  });

  it('selects the first saved address when none is marked as default', () => {
    render(
      <CheckoutVariantA
        initialData={{
          ...initialData,
          savedAddresses: [
            {
              id: 'office',
              label: 'Office',
              city: 'Moscow',
              street: '  Presnenskaya, 8  ',
              comment: 'Reception',
              isDefault: false,
            },
            { id: 'home', label: 'Home', city: 'Moscow', street: 'Tverskaya, 10', comment: null, isDefault: false },
          ],
          addressDefaults: { city: 'Moscow', addressLine: 'Presnenskaya, 8', addressComment: 'Reception' },
        }}
      />,
    );

    expect(screen.getByRole('radio', { name: /Office/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Новый адрес/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('textbox', { name: 'Адрес' })).toHaveValue('Presnenskaya, 8');
  });

  it('shows neutral disabled totals while a quote is pending or unavailable', async () => {
    let rejectQuote!: (error: Error) => void;
    mocks.quote.mockReturnValue(new Promise((_, reject) => (rejectQuote = reject)));
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    expect(screen.queryByText('0 ₽')).not.toBeInTheDocument();
    expect(document.querySelector('.chk-bar__details > summary > span > b')).toHaveTextContent('Рассчитываем…');
    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();

    rejectQuote(new Error('Quote unavailable'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Quote unavailable');
    expect(screen.queryByText('0 ₽')).not.toBeInTheDocument();
    expect(document.querySelector('.chk-bar__details > summary > span > b')).toHaveTextContent('Стоимость недоступна');
  });

  it('identifies invalid contact fields before placing the order', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.change(screen.getByRole('textbox', { name: 'Телефон' }), { target: { value: '53453345334' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    expect(await screen.findByText('Проверьте поля: Телефон')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Телефон' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Телефон' }).closest('.chk-field')).toHaveClass('is-bad');
    expect(mocks.placeOrder).not.toHaveBeenCalled();
  });

  it('clears saved address details when switching to a new manual address and re-quotes', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('radio', { name: /Новый адрес/ }));

    expect(screen.getByRole('textbox', { name: 'Адрес' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Moscow');
    expect(screen.getByRole('textbox', { name: 'Комментарий курьеру' })).toHaveValue('');
    expect(screen.getByRole('spinbutton', { name: 'Этаж' })).toHaveValue(null);
    expect(screen.getByRole('radio', { name: 'Пассажирский' })).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    expect(mocks.quote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({ city: 'Moscow', addressLine: '', liftType: 'passenger', intercom: '' }),
      }),
    );
  });

  it('uses the localized item count label in the mobile summary', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    expect(document.querySelector('.chk-bar__details > summary > span')).toHaveTextContent('1 товар');
    expect(document.querySelector('.chk-bar__details > summary > span')).not.toHaveTextContent('1 товаров');
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
    const card = screen.getByRole('heading', { name: 'Платёж требует проверки' }).closest('section');
    expect(card?.querySelector('.chk-done__mark')).toBeInTheDocument();
    expect(card?.querySelector('.chk-done__lede')).toHaveTextContent('Заказ №42 сохранён.');
    expect(card?.querySelector('.chk-done__actions')).toBeInTheDocument();
    expect(card?.querySelectorAll('.chk-done__actions a')).toHaveLength(1);
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

  it('invalidates the quote and locks submit and mutation controls while removal is pending', async () => {
    let resolveRemove!: (value: typeof cart) => void;
    mocks.removeCartItem.mockReturnValue(new Promise((resolve) => (resolveRemove = resolve)));
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.click(screen.getAllByRole('button', { name: 'Удалить Noma' })[0]);
    await waitFor(() => expect(mocks.removeCartItem).toHaveBeenCalledWith('line-1'));

    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Удалить Noma' })) expect(button).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Добавить одну штуку Noma' }))
      expect(button).toBeDisabled();
    expect(mocks.placeOrder).not.toHaveBeenCalled();

    await act(async () => resolveRemove(cart));
  });

  it('locks cart and quote-changing controls synchronously while placement is pending', async () => {
    let resolvePlacement!: (value: { ok: true; code: 'ORDER_READY'; orderNumber: number }) => void;
    mocks.placeOrder.mockReturnValue(new Promise((resolve) => (resolvePlacement = resolve)));
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Добавить одну штуку Noma' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Удалить Noma' })[0]);
    fireEvent.click(screen.getByRole('radio', { name: 'Московская область' }));

    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
    expect(mocks.updateItemQuantity).not.toHaveBeenCalled();
    expect(mocks.removeCartItem).not.toHaveBeenCalled();
    expect(mocks.quote).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio', { name: 'Московская область' })).toBeDisabled();

    await act(async () => resolvePlacement({ ok: true, code: 'ORDER_READY', orderNumber: 21 }));
  });

  it('caps checkout quantity at the canonical limit when stock exceeds 99', async () => {
    const highStockCart = { ...cart, items: [{ ...cart.items[0], quantity: 99, stock: 120 }] };
    mocks.quote.mockResolvedValue({
      ok: true,
      quote: {
        ...quote,
        cart: highStockCart,
        totals: { ...quote.totals, itemCount: 99 },
      },
    });
    render(
      <CheckoutVariantA
        initialData={{
          ...initialData,
          initialCart: highStockCart,
        }}
      />,
    );
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    expect(screen.getAllByRole('button', { name: 'Добавить одну штуку Noma' })[0]).toBeDisabled();
  });

  it('updates canonical quantity when a typed quantity changes', async () => {
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Количество Noma' })[0], { target: { value: '2' } });

    await waitFor(() => expect(mocks.updateItemQuantity).toHaveBeenCalledWith('line-1', 2));
  });

  it('surfaces a rejected quantity mutation and keeps stale quote submission disabled', async () => {
    let resolveRefresh!: (value: { ok: true; quote: CheckoutQuoteDto }) => void;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.quote
      .mockResolvedValueOnce({ ok: true, quote })
      .mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)));
    mocks.updateItemQuantity.mockRejectedValue(new Error('Cart mutation failed'));
    render(<CheckoutVariantA initialData={initialData} />);
    await screen.findAllByText(/101/);

    fireEvent.click(screen.getAllByRole('button', { name: 'Добавить одну штуку Noma' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Cart mutation failed');
    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
    expect(mocks.placeOrder).not.toHaveBeenCalled();

    await act(async () => resolveRefresh({ ok: true, quote }));
    await waitFor(() => {
      for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeEnabled();
    });
  });

  it('keeps coupon draft local until Apply and re-quotes again on Clear', async () => {
    mocks.quote.mockImplementation(async (input: { couponCode?: string }) => ({
      ok: true,
      quote: {
        ...quote,
        coupon: input.couponCode ? { code: input.couponCode, percent: 5 } : null,
      },
    }));
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));
    const promoInput = screen.getAllByRole('textbox', { name: 'Промокод' })[0];

    fireEvent.change(promoInput, { target: { value: '  SAVE5  ' } });
    await act(async () => undefined);
    expect(promoInput).toBeEnabled();
    expect(mocks.quote).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Применить' })[0]);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.objectContaining({ couponCode: 'SAVE5' }));

    fireEvent.click(screen.getAllByRole('button', { name: 'Убрать промокод' })[0]);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(3));
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.not.objectContaining({ couponCode: expect.anything() }));
  });

  it.each([
    [{ ok: true, code: 'ORDER_READY', orderNumber: 11 }, '/orders/11?placed=1', 'Заказ №11 оформлен'],
    [
      { ok: false, code: 'PAYMENT_INITIALIZATION_PENDING', orderNumber: 12, error: 'Pending' },
      '/orders/12?placed=1',
      'Заказ №12 сохранён',
    ],
  ])('locks durable order result %# before no-op order navigation', async (result, href, heading) => {
    mocks.placeOrder.mockResolvedValue(result);
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(href));
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(useCartStore.getState().items).toEqual([]);
    expect(screen.queryByRole('button', { name: /Оформить заказ/ })).not.toBeInTheDocument();
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
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
    expect(await screen.findByRole('heading', { name: 'Заказ №13 создан' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Перейти к оплате' })).toHaveAttribute(
      'href',
      'https://yookassa.test/confirmation',
    );
    expect(screen.getByRole('link', { name: /Открыть заказ/ })).toHaveClass('chk-done__ghost');
    expect(useCartStore.getState().items).toEqual([]);
    expect(screen.queryByRole('button', { name: /Оформить заказ/ })).not.toBeInTheDocument();
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('recovers an invalid coupon returned by the quote action', async () => {
    mocks.quote
      .mockResolvedValueOnce({ ok: true, quote })
      .mockResolvedValueOnce({ ok: false, code: 'INVALID_COUPON', message: 'Coupon expired' })
      .mockResolvedValueOnce({ ok: true, quote });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Промокод' })[0], { target: { value: 'EXPIRED' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Применить' })[0]);

    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(3));
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.not.objectContaining({ couponCode: expect.anything() }));
    expect(screen.getAllByRole('textbox', { name: 'Промокод' })[0]).toHaveValue('');
  });

  it('clears a recoverable placement error after the replacement quote succeeds', async () => {
    mocks.quote.mockResolvedValue({ ok: true, quote });
    mocks.placeOrder.mockResolvedValue({ ok: false, code: 'INVALID_COUPON', error: 'Coupon expired' });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Промокод' })[0], { target: { value: 'EXPIRED' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Применить' })[0]);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Coupon expired');
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it.each([
    ['EMPTY_CART', false],
    ['SKU_UNAVAILABLE', true],
    ['QUANTITY_EXCEEDS_STOCK', true],
  ] as const)('reconciles quote failure %s with canonical cart state', async (code, refreshesCart) => {
    mocks.quote.mockResolvedValue({ ok: false, code, message: 'Cart changed' });
    mocks.getCart.mockResolvedValue(emptyCart);
    render(<CheckoutVariantA initialData={initialData} />);

    expect(await screen.findByText('В корзине пока пусто')).toBeInTheDocument();
    expect(mocks.getCart).toHaveBeenCalledTimes(refreshesCart ? 1 : 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('refreshes server checkout data after a stale-slot quote failure', async () => {
    mocks.quote.mockResolvedValue({ ok: false, code: 'STALE_DELIVERY_SLOT', message: 'Slot expired' });
    render(<CheckoutVariantA initialData={initialData} />);

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
  });

  it('quotes a newly selected valid slot after stale-slot recovery', async () => {
    const validSlot = {
      id: '2026-08-20:14-18',
      date: '2026-08-20',
      windowId: '14-18',
      windowLabel: '14:00 - 18:00',
    };
    mocks.quote
      .mockResolvedValueOnce({ ok: false, code: 'STALE_DELIVERY_SLOT', message: 'Slot expired' })
      .mockResolvedValueOnce({
        ok: true,
        quote: {
          ...quote,
          delivery: { ...quote.delivery, slot: validSlot },
          totals: { ...quote.totals, total: 102000 },
        },
      });
    render(
      <CheckoutVariantA
        initialData={{
          ...initialData,
          initialSlots: { ...initialData.initialSlots, courier: [...initialData.initialSlots.courier, validSlot] },
        }}
      />,
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('radio', { name: /2026-08-20 14:00 - 18:00/ }));

    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.objectContaining({ deliverySlotId: validSlot.id }));
    expect(screen.getAllByText(/102 000/).length).toBeGreaterThan(0);
  });

  it('clears a rejected coupon quote and re-quotes without the stale coupon', async () => {
    mocks.quote.mockImplementation(async (input: { couponCode?: string }) => ({
      ok: true,
      quote: {
        ...quote,
        coupon: input.couponCode ? { code: input.couponCode, percent: 5 } : null,
        totals: { ...quote.totals, couponDiscount: input.couponCode ? 5000 : 0 },
      },
    }));
    mocks.placeOrder.mockResolvedValue({ ok: false, code: 'INVALID_COUPON', error: 'Coupon expired' });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Промокод' })[0], { target: { value: 'SAVE5' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Применить' })[0]);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText('Промокод −5%')).not.toHaveLength(0);

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.quote).toHaveBeenCalledTimes(3));
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.not.objectContaining({ couponCode: expect.anything() }));
    expect(screen.queryByText('Промокод −5%')).not.toBeInTheDocument();
  });

  it('invalidates a stale quote before refreshing cart placement conflicts', async () => {
    let resolveCart!: (value: typeof cart) => void;
    mocks.placeOrder.mockResolvedValue({
      ok: false,
      code: 'QUANTITY_EXCEEDS_STOCK',
      error: 'Stock changed',
    });
    mocks.getCart.mockReturnValue(new Promise((resolve) => (resolveCart = resolve)));
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.getCart).toHaveBeenCalledTimes(1));
    for (const button of document.querySelectorAll('.chk-submit')) expect(button).toBeDisabled();
    expect(screen.queryByText(/101 900/)).not.toBeInTheDocument();

    await act(async () => resolveCart(cart));
  });

  it('invalidates a stale delivery slot quote and refreshes server page data', async () => {
    mocks.placeOrder.mockResolvedValue({
      ok: false,
      code: 'STALE_DELIVERY_SLOT',
      error: 'Delivery slot changed',
    });
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    for (const button of screen.getAllByRole('button', { name: /Оформить заказ/ })) expect(button).toBeDisabled();
  });

  it('invalidates checkout and refreshes the empty cart after payment was not created', async () => {
    mocks.placeOrder.mockResolvedValue({
      ok: false,
      code: 'PAYMENT_NOT_CREATED',
      orderNumber: 15,
      error: 'Payment was not created',
    });
    mocks.getCart.mockResolvedValue(emptyCart);
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.getCart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/cart'));
    expect(await screen.findByText('В корзине пока пусто')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Оформить заказ/ })).not.toBeInTheDocument();
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
  });

  it('keeps payment-not-created terminal when the cart refresh fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let rejectCart!: (error: Error) => void;
    mocks.placeOrder.mockResolvedValue({
      ok: false,
      code: 'PAYMENT_NOT_CREATED',
      orderNumber: 16,
      error: 'Payment was not created',
    });
    mocks.getCart.mockReturnValue(new Promise((_, reject) => (rejectCart = reject)));
    render(<CheckoutVariantA initialData={initialData} />);
    await waitFor(() => expect(mocks.quote).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /Оформить заказ/ })[0]);

    await waitFor(() => expect(mocks.getCart).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('В корзине пока пусто')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Оформить заказ/ })).not.toBeInTheDocument();
    await act(async () => rejectCart(new Error('Cart refresh failed')));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/cart'));
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

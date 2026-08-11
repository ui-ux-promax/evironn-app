import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/cart', () => ({
  recalcCartTotalByToken: vi.fn(async () => null),
  // Залогинен → корзина по userId; в тесте владелец фиксирован, контент даёт cart.findFirst({id}).
  resolveOwnerCart: vi.fn(async () => ({ id: 'c1', token: 't' })),
}));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    cart: { findFirst: vi.fn() },
    productVariant: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    sku: { updateMany: vi.fn(), update: vi.fn() },
    order: { create: vi.fn(), delete: vi.fn() },
    orderItem: { create: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
  },
}));

import { placeOrder } from '@/app/actions/order';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const cookiesMock = cookies as unknown as ReturnType<typeof vi.fn>;
const cartFindFirst = prisma.cart.findFirst as unknown as ReturnType<typeof vi.fn>;
const productVariantFindUniqueMock = prisma.productVariant.findUnique as unknown as ReturnType<typeof vi.fn>;
const variantUpdateMany = prisma.productVariant.updateMany as unknown as ReturnType<typeof vi.fn>;
const variantUpdate = prisma.productVariant.update as unknown as ReturnType<typeof vi.fn>;
const skuUpdateMany = prisma.sku.updateMany as unknown as ReturnType<typeof vi.fn>;
const skuUpdate = prisma.sku.update as unknown as ReturnType<typeof vi.fn>;
const orderCreate = prisma.order.create as unknown as ReturnType<typeof vi.fn>;
const orderItemCreate = prisma.orderItem.create as unknown as ReturnType<typeof vi.fn>;
const orderDelete = prisma.order.delete as unknown as ReturnType<typeof vi.fn>;
const cartItemDeleteMany = prisma.cartItem.deleteMany as unknown as ReturnType<typeof vi.fn>;

const validForm = {
  contactName: 'Neo',
  contactPhone: '+79990000000',
  contactEmail: 'neo@e.test',
  shippingMethod: 'pickup',
  city: 'Москва',
  addressLine: 'Тверская 1',
  paymentMethod: 'cod',
};

function variant(id: string, stock = 9) {
  return {
    id,
    sku: `SKU-${id}`,
    price: 5000,
    size: 'M',
    stock,
    active: true,
    colorway: {
      name: 'Black',
      product: { id: `p-${id}`, name: `P-${id}`, slug: id, active: true },
      images: [{ url: `/i/${id}.jpg` }],
    },
  };
}
function cartWith(...ids: string[]) {
  return {
    id: 'c1',
    token: 't',
    items: ids.map((id, n) => ({
      id: `ci${n}`,
      cartId: 'c1',
      productVariantId: id,
      quantity: 1,
      createdAt: new Date(0),
      productVariant: variant(id),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'u1' } });
  cookiesMock.mockResolvedValue({ get: () => ({ value: 't' }) });
  variantUpdate.mockResolvedValue({});
  skuUpdate.mockResolvedValue({});
  skuUpdateMany.mockResolvedValue({ count: 1 });
  productVariantFindUniqueMock.mockResolvedValue(null);
  variantUpdateMany.mockResolvedValue({ count: 1 });
  cartItemDeleteMany.mockResolvedValue({ count: 1 });
  orderItemCreate.mockResolvedValue({});
  orderDelete.mockResolvedValue({});
});

describe('placeOrder', () => {
  it('успех — декремент стока через update, создание заказа, очистка корзины', async () => {
    cartFindFirst.mockResolvedValue(cartWith('v1'));
    orderCreate.mockResolvedValue({ id: 'o1', orderNumber: 1025 });
    const r = await placeOrder(validForm);
    expect(r).toEqual({ ok: true, orderNumber: 1025 });
    expect(variantUpdateMany).toHaveBeenCalledWith({
      where: { id: 'v1', stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
    expect(orderCreate).toHaveBeenCalledOnce();
    expect(orderItemCreate).toHaveBeenCalledTimes(1);
    expect(cartItemDeleteMany).toHaveBeenCalledOnce();
  });

  it('нехватка на 2-й позиции — компенсация 1-й, заказ НЕ создан', async () => {
    cartFindFirst.mockResolvedValue(cartWith('v1', 'v2'));
    variantUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const r = await placeOrder(validForm);
    expect(r.ok).toBe(false);
    expect(variantUpdate).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { stock: { increment: 1 } } });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it('сбой order.create — компенсация всех декрементов', async () => {
    cartFindFirst.mockResolvedValue(cartWith('v1', 'v2'));
    orderCreate.mockRejectedValue(new Error('db down'));
    const r = await placeOrder(validForm);
    expect(r.ok).toBe(false);
    expect(variantUpdate).toHaveBeenCalledTimes(2);
    expect(orderItemCreate).not.toHaveBeenCalled();
  });

  it('сбой создания позиций — откат заказа и возврат стока', async () => {
    cartFindFirst.mockResolvedValue(cartWith('v1', 'v2'));
    orderCreate.mockResolvedValue({ id: 'o1', orderNumber: 1026 });
    orderItemCreate.mockRejectedValue(new Error('items down'));
    const r = await placeOrder(validForm);
    expect(r.ok).toBe(false);
    expect(orderDelete).toHaveBeenCalledWith({ where: { id: 'o1' } });
    expect(variantUpdate).toHaveBeenCalledTimes(2);
  });

  it('пустая корзина — ошибка, без записи', async () => {
    cartFindFirst.mockResolvedValue({ id: 'c1', token: 't', items: [] });
    const r = await placeOrder(validForm);
    expect(r).toEqual({ ok: false, error: 'Корзина пуста' });
    expect(variantUpdateMany).not.toHaveBeenCalled();
  });

  it('неактивный товар — отказ до проверки стока', async () => {
    const cart = cartWith('v1');
    cart.items[0].productVariant.active = false;
    cartFindFirst.mockResolvedValue(cart);
    const r = await placeOrder(validForm);
    expect(r.ok).toBe(false);
    expect(variantUpdateMany).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it('paymentMethod != cod — отказ', async () => {
    const r = await placeOrder({ ...validForm, paymentMethod: 'card' });
    expect(r.ok).toBe(false);
  });

  it('buy now creates a one-item order without reading or clearing the existing cart', async () => {
    const buyNowVariantId = 'ckbuyvariant000000000000001';
    productVariantFindUniqueMock.mockResolvedValueOnce(variant(buyNowVariantId));
    orderCreate.mockResolvedValue({ id: 'o1', orderNumber: 2027 });

    const r = await placeOrder({ ...validForm, buyNowVariantId });

    expect(r).toEqual({ ok: true, orderNumber: 2027 });
    expect(cartFindFirst).not.toHaveBeenCalled();
    expect(cartItemDeleteMany).not.toHaveBeenCalled();
    expect(orderItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'o1',
        productVariantId: buyNowVariantId,
        quantity: 1,
        lineTotal: 5000,
      }),
    });
    expect(variantUpdateMany).toHaveBeenCalledWith({
      where: { id: buyNowVariantId, stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
  });

  it('creates an order from a canonical furniture SKU cart item', async () => {
    cartFindFirst.mockResolvedValue({
      id: 'c1',
      token: 't',
      items: [
        {
          id: 'ci1',
          cartId: 'c1',
          skuId: 'sku-1',
          productVariantId: null,
          quantity: 2,
          createdAt: new Date(0),
          productVariant: null,
          sku: {
            id: 'sku-1',
            articleNumber: 'EV-NWL-OAK',
            combinationKey: 'finish=oak',
            price: 124000,
            oldPrice: 139000,
            stock: 3,
            active: true,
            product: { id: 'product-1', name: 'Noma', slug: 'noma', active: true },
            media: [{ url: '/assets/noma.webp' }],
            selections: [
              {
                optionGroup: { name: 'Отделка', slug: 'finish' },
                optionValue: { name: 'Дуб', slug: 'oak' },
              },
            ],
          },
        },
      ],
    });
    orderCreate.mockResolvedValue({ id: 'o1', orderNumber: 3025 });

    expect(await placeOrder(validForm)).toEqual({ ok: true, orderNumber: 3025 });
    expect(skuUpdateMany).toHaveBeenCalledWith({
      where: { id: 'sku-1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(orderItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'o1',
        skuId: 'sku-1',
        skuArticleNumber: 'EV-NWL-OAK',
        quantity: 2,
        lineTotal: 248000,
      }),
    });
  });
});

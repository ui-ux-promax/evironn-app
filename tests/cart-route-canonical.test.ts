import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, resolveOwnerCart, cartDto } = vi.hoisted(() => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
  resolveOwnerCart: vi.fn().mockResolvedValue({ id: 'cart-1', token: 'token-1' }),
  cartDto: {
  items: [],
  totals: { subtotal: 0, compareAtSubtotal: 0, saleDiscount: 0, couponDiscount: 0, total: 0, itemCount: 0, lineCount: 0 },
  },
}));

vi.mock('@/auth', () => ({ auth }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart, cartInclude: {} }));
vi.mock('@/lib/cart-presentation', () => ({ buildCartDto: vi.fn(() => cartDto), cartPresentationInclude: {} }));
vi.mock('@/lib/request-context', () => ({ runWithRequestContext: vi.fn((_request, callback) => callback()) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/rate-limit', () => ({ extractClientIp: vi.fn(() => '127.0.0.1'), checkCartRateLimit: vi.fn(async () => ({ success: true })) }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    $transaction: vi.fn(),
    cart: { findFirst: vi.fn(), deleteMany: vi.fn() },
    cartItem: { findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), delete: vi.fn() },
    sku: { findUnique: vi.fn() },
  },
}));

import { DELETE as deleteCart, POST } from '@/app/api/cart/route';
import { DELETE as deleteItem, PATCH } from '@/app/api/cart/[id]/route';
import { prisma } from '@/lib/prisma-client';

const transaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const cart = prisma.cart as unknown as Record<string, ReturnType<typeof vi.fn>>;
const cartItem = prisma.cartItem as unknown as Record<string, ReturnType<typeof vi.fn>>;
const sku = prisma.sku as unknown as Record<string, ReturnType<typeof vi.fn>>;
const tx = {
  sku: { findUnique: vi.fn() },
  cartItem: { findUnique: vi.fn(), upsert: vi.fn() },
  cart: { findFirst: vi.fn() },
};

function request(body: unknown, token = 'token-1') {
  return { cookies: { get: () => ({ value: token }) }, json: async () => body };
}

function malformedRequest(token = 'token-1') {
  return {
    cookies: { get: () => ({ value: token }) },
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input');
    },
  };
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'token-1' });
  cart.findFirst.mockResolvedValue({ id: 'cart-1', token: 'token-1', items: [] });
  tx.cart.findFirst.mockResolvedValue({ id: 'cart-1', token: 'token-1', items: [] });
  transaction.mockImplementation(async (callback: (value: typeof tx) => unknown) => callback(tx));
  tx.sku.findUnique.mockResolvedValue({ id: 'sku-1', active: true, stock: 3, product: { active: true } });
  tx.cartItem.findUnique.mockResolvedValue(null);
  tx.cartItem.upsert.mockResolvedValue({});
  cartItem.findFirst.mockResolvedValue({
    id: 'line-1',
    cartId: 'cart-1',
    skuId: 'sku-1',
    productVariantId: null,
    sku: { active: true, stock: 3, product: { active: true } },
    productVariant: null,
  });
  cartItem.update.mockResolvedValue({});
  sku.findUnique.mockResolvedValue({ id: 'sku-1', active: true, stock: 3, product: { active: true } });
});

describe('canonical cart mutation boundaries', () => {
  it('maps malformed POST JSON to nested INVALID_INPUT instead of generic 500', async () => {
    const response = await POST(malformedRequest() as never);

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: { code: 'INVALID_INPUT', message: 'Некорректные данные' } });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('maps malformed PATCH JSON to nested INVALID_INPUT instead of generic 500', async () => {
    const response = await PATCH(malformedRequest() as never, { params: Promise.resolve({ id: 'line-1' }) });

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: { code: 'INVALID_INPUT', message: 'Некорректное количество' } });
    expect(cartItem.findFirst).not.toHaveBeenCalled();
  });

  it('accepts only canonical skuId and writes inside a serializable transaction', async () => {
    const response = await POST(request({ skuId: 'sku-1', quantity: 1 }) as never);
    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
    expect(tx.sku.findUnique).toHaveBeenCalledWith({ where: { id: 'sku-1' }, include: { product: { select: { active: true } } } });
    expect(tx.cartItem.upsert).toHaveBeenCalledWith({
      where: { cartId_skuId: { cartId: 'cart-1', skuId: 'sku-1' } },
      create: { cartId: 'cart-1', skuId: 'sku-1', quantity: 1 },
      update: { quantity: 1 },
    });
  });

  it('rejects legacy productVariantId as a new write contract', async () => {
    const response = await POST(request({ productVariantId: 'variant-1' }) as never);
    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: { code: 'INVALID_INPUT', message: 'Некорректные данные' } });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects missing, inactive, and zero-stock SKU with exact errors', async () => {
    tx.sku.findUnique.mockResolvedValueOnce(null);
    let response = await POST(request({ skuId: 'missing' }) as never);
    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: { code: 'SKU_NOT_FOUND', message: 'Товар не найден' } });
    tx.sku.findUnique.mockResolvedValueOnce({ id: 'sku-1', active: false, stock: 3, product: { active: true } });
    response = await POST(request({ skuId: 'sku-1' }) as never);
    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: { code: 'SKU_NOT_FOUND', message: 'Товар не найден' } });
    tx.sku.findUnique.mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 0, product: { active: true } });
    response = await POST(request({ skuId: 'sku-1' }) as never);
    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({ error: { code: 'OUT_OF_STOCK', message: 'Недостаточно на складе', stock: 0 } });
  });

  it('rejects increment beyond stock and quantity maximum', async () => {
    tx.cartItem.findUnique.mockResolvedValue({ id: 'line-1', quantity: 3 });
    let response = await POST(request({ skuId: 'sku-1', quantity: 1 }) as never);
    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({ error: { code: 'QUANTITY_EXCEEDS_STOCK', message: 'Недостаточно на складе', stock: 3 } });
    response = await POST(request({ skuId: 'sku-1', quantity: 100 }) as never);
    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: { code: 'INVALID_INPUT', message: 'Некорректные данные' } });
  });

  it('retries P2034 by rereading current quantity and stock', async () => {
    transaction.mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => {
      await callback(tx);
      throw { code: 'P2034' };
    }).mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => {
      tx.sku.findUnique.mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 4, product: { active: true } });
      tx.cartItem.findUnique.mockResolvedValueOnce({ id: 'line-1', quantity: 1 });
      return callback(tx);
    });
    const response = await POST(request({ skuId: 'sku-1', quantity: 1 }) as never);
    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(tx.sku.findUnique).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.findUnique).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.upsert).toHaveBeenLastCalledWith({
      where: { cartId_skuId: { cartId: 'cart-1', skuId: 'sku-1' } },
      create: { cartId: 'cart-1', skuId: 'sku-1', quantity: 2 },
      update: { quantity: 2 },
    });
  });

  it('retries P2002 and applies increment to reread quantity', async () => {
    tx.sku.findUnique
      .mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 2, product: { active: true } })
      .mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 2, product: { active: true } });
    tx.cartItem.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'line-1', quantity: 1 });
    transaction
      .mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => {
        await callback(tx);
        throw { code: 'P2002' };
      })
      .mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => callback(tx));

    const response = await POST(request({ skuId: 'sku-1', quantity: 1 }) as never);

    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(tx.sku.findUnique).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.findUnique).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.upsert).toHaveBeenLastCalledWith({
      where: { cartId_skuId: { cartId: 'cart-1', skuId: 'sku-1' } },
      create: { cartId: 'cart-1', skuId: 'sku-1', quantity: 2 },
      update: { quantity: 2 },
    });
  });

  it('rejects reread quantity above current stock after P2002', async () => {
    tx.sku.findUnique
      .mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 2, product: { active: true } })
      .mockResolvedValueOnce({ id: 'sku-1', active: true, stock: 2, product: { active: true } });
    tx.cartItem.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'line-1', quantity: 2 });
    transaction
      .mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => {
        await callback(tx);
        throw { code: 'P2002' };
      })
      .mockImplementationOnce(async (callback: (value: typeof tx) => unknown) => callback(tx));

    const response = await POST(request({ skuId: 'sku-1', quantity: 1 }) as never);

    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({
      error: { code: 'QUANTITY_EXCEEDS_STOCK', message: 'Недостаточно на складе', stock: 2 },
    });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.upsert).toHaveBeenCalledTimes(1);
  });

  it('returns CART_CONFLICT after bounded retry exhaustion, never generic 500', async () => {
    transaction.mockRejectedValue({ code: 'P2002' });
    const response = await POST(request({ skuId: 'sku-1' }) as never);
    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({
      error: { code: 'CART_CONFLICT', message: 'Корзина изменилась. Повторите попытку' },
    });
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it('keeps PATCH owner-scoped and validates canonical SKU stock', async () => {
    const response = await PATCH(request({ quantity: 2 }) as never, { params: Promise.resolve({ id: 'line-1' }) });
    expect(response.status).toBe(200);
    expect(cartItem.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'line-1', cartId: 'cart-1' } }));
    expect(cartItem.update).toHaveBeenCalledWith({ where: { id: 'line-1' }, data: { quantity: 2 } });
  });

  it('maps PATCH zero stock and quantity overflow to distinct nested errors', async () => {
    cartItem.findFirst.mockResolvedValueOnce({
      id: 'line-1',
      cartId: 'cart-1',
      skuId: 'sku-1',
      sku: { active: true, stock: 0, product: { active: true } },
      productVariant: null,
    });
    let response = await PATCH(request({ quantity: 1 }) as never, { params: Promise.resolve({ id: 'line-1' }) });
    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({ error: { code: 'OUT_OF_STOCK', message: 'Недостаточно на складе', stock: 0 } });

    cartItem.findFirst.mockResolvedValueOnce({
      id: 'line-1',
      cartId: 'cart-1',
      skuId: 'sku-1',
      sku: { active: true, stock: 2, product: { active: true } },
      productVariant: null,
    });
    response = await PATCH(request({ quantity: 3 }) as never, { params: Promise.resolve({ id: 'line-1' }) });
    expect(response.status).toBe(409);
    expect(await json(response)).toEqual({
      error: { code: 'QUANTITY_EXCEEDS_STOCK', message: 'Недостаточно на складе', stock: 2 },
    });
  });

  it('clears only the resolved owner cart at the root route', async () => {
    const response = await deleteCart(request(undefined) as never);
    expect(response.status).toBe(200);
    expect(cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
  });

  it('returns exact owner and item errors for scoped item mutations', async () => {
    resolveOwnerCart.mockResolvedValueOnce(null);
    let response = await deleteItem(request(undefined) as never, { params: Promise.resolve({ id: 'line-1' }) });
    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: { code: 'CART_ITEM_NOT_FOUND', message: 'Корзина не найдена' } });
    cartItem.findFirst.mockResolvedValueOnce(null);
    response = await deleteItem(request(undefined) as never, { params: Promise.resolve({ id: 'line-1' }) });
    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: { code: 'CART_ITEM_NOT_FOUND', message: 'Позиция не найдена' } });
  });
});

import { describe, it, expect } from 'vitest';
import { calcLineTotal, getCartDetails, type CartWithItems } from '@/lib/cart';
import { createCartItemSchema, updateQuantitySchema } from '@/services/dto/cart.dto';

function fakeCart(): CartWithItems {
  return {
    id: 'cart1',
    token: 'tok',
    userId: null,
    totalAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'i1',
        cartId: 'cart1',
        productVariantId: 'v1',
        quantity: 2,
        createdAt: new Date(),
        productVariant: {
          id: 'v1',
          colorwayId: 'c1',
          size: 'L',
          sku: 'X-L',
          price: 12990,
          compareAtPrice: null,
          stock: 5,
          active: true,
          colorway: {
            id: 'c1',
            productId: 'p1',
            name: 'Молочный',
            slug: 'milk',
            swatchHex: '#f4efe7',
            isDefault: true,
            sortOrder: 1,
            product: { name: 'RITM Белая футболка Oversize', slug: 'ritm-white-tee-oversize' },
            images: [{ id: 'im1', colorwayId: 'c1', url: '/products/x.jpeg', alt: null, sortOrder: 0 }],
          },
        },
      },
    ],
  } as unknown as CartWithItems;
}

describe('calcLineTotal', () => {
  it('цена варианта × количество', () => {
    expect(calcLineTotal(12990, 2)).toBe(25980);
  });
});

describe('getCartDetails', () => {
  it('разворачивает CartWithItems в плоские позиции + totalAmount', () => {
    const details = getCartDetails(fakeCart());
    expect(details.totalAmount).toBe(25980);
    expect(details.items).toHaveLength(1);
    const it0 = details.items[0];
    expect(it0).toMatchObject({
      id: 'i1',
      quantity: 2,
      name: 'RITM Белая футболка Oversize',
      productSlug: 'ritm-white-tee-oversize',
      colorwayName: 'Молочный',
      size: 'L',
      imageUrl: '/products/x.jpeg',
      unitPrice: 12990,
      lineTotal: 25980,
      stock: 5,
      available: true,
    });
  });
  it('недоступная позиция (stock 0) → available=false', () => {
    const cart = fakeCart();
    (cart.items[0].productVariant as { stock: number }).stock = 0;
    const details = getCartDetails(cart);
    expect(details.items[0].available).toBe(false);
  });
});

describe('zod-схемы корзины', () => {
  it('createCartItemSchema принимает валидный ввод', () => {
    expect(createCartItemSchema.parse({ skuId: 'sku-1' }).skuId).toBe('sku-1');
    expect(createCartItemSchema.parse({ skuId: 'sku-1', quantity: 3 }).quantity).toBe(3);
  });
  it('createCartItemSchema отклоняет пустой id и quantity<=0', () => {
    expect(createCartItemSchema.safeParse({ skuId: '' }).success).toBe(false);
    expect(createCartItemSchema.safeParse({ skuId: 'sku-1', quantity: 0 }).success).toBe(false);
    expect(createCartItemSchema.safeParse({ productVariantId: 'v1' }).success).toBe(false);
  });
  it('updateQuantitySchema требует quantity>=1', () => {
    expect(updateQuantitySchema.safeParse({ quantity: 0 }).success).toBe(false);
    expect(updateQuantitySchema.parse({ quantity: 2 }).quantity).toBe(2);
  });
});

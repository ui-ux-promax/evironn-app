import type { Prisma } from '@prisma/client';
import type { CartWithItems } from '@/lib/cart-details';
import { calcLineTotal } from '@/lib/cart-details';
import { calcCouponDiscount } from '@/lib/coupon';
import type { CartDto, CartLineDto } from '@/services/dto/commerce-cart.dto';

export const cartPresentationInclude = {
  items: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      sku: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
              media: { where: { kind: 'IMAGE' as const }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
            },
          },
          media: { where: { kind: 'IMAGE' as const }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
          selections: {
            include: {
              optionGroup: { select: { name: true, slug: true, sortOrder: true } },
              optionValue: { select: { name: true, slug: true, swatchHex: true } },
            },
            orderBy: { optionGroup: { sortOrder: 'asc' as const } },
          },
        },
      },
      productVariant: {
        include: {
          colorway: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  active: true,
                  media: { where: { kind: 'IMAGE' as const }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
                },
              },
              images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

function buildLine(item: CartWithItems['items'][number]): CartLineDto {
  if (item.sku) {
    const product = item.sku.product;
    const productMedia =
      (product as typeof product & { media?: Array<{ url: string; alt: string | null }> }).media ?? [];
    const image = item.sku.media[0] ?? productMedia[0] ?? null;
    const configuration = item.sku.selections
      .slice()
      .sort(
        (left, right) =>
          ((left.optionGroup as { sortOrder?: number }).sortOrder ?? Number.MAX_SAFE_INTEGER) -
          ((right.optionGroup as { sortOrder?: number }).sortOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((selection) => {
        const optionValue = selection.optionValue as typeof selection.optionValue & { swatchHex?: string | null };
        return {
          groupSlug: selection.optionGroup.slug,
          groupName: selection.optionGroup.name,
          valueSlug: optionValue.slug,
          valueName: optionValue.name,
          swatchHex: optionValue.swatchHex ?? null,
        };
      });
    const lineTotal = calcLineTotal(item.sku.price, item.quantity);
    const compareAtLineTotal = calcLineTotal(
      Math.max(item.sku.oldPrice ?? item.sku.price, item.sku.price),
      item.quantity,
    );
    return {
      id: item.id,
      skuId: item.sku.id,
      productVariantId: null,
      articleNumber: item.sku.articleNumber,
      productId: product.id,
      productName: product.name,
      name: product.name,
      productSlug: product.slug,
      quantity: item.quantity,
      configuration,
      colorwayName: configuration.map((option) => option.valueName).join(', '),
      size: '',
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? product.name,
      unitPrice: item.sku.price,
      oldUnitPrice: item.sku.oldPrice,
      lineTotal,
      compareAtLineTotal,
      stock: item.sku.stock,
      active: item.sku.active && product.active,
      available: item.sku.active && product.active && item.sku.stock > 0,
    };
  }

  const variant = item.productVariant;
  if (!variant) throw new Error('Cart item is missing catalog reference');
  const product = variant.colorway.product;
  const productMedia = (product as typeof product & { media?: Array<{ url: string; alt: string | null }> }).media ?? [];
  const image = variant.colorway.images[0] ?? productMedia[0] ?? null;
  const lineTotal = calcLineTotal(variant.price, item.quantity);
  const compareAtLineTotal = calcLineTotal(
    Math.max(variant.compareAtPrice ?? variant.price, variant.price),
    item.quantity,
  );
  return {
    id: item.id,
    skuId: null,
    productVariantId: variant.id,
    articleNumber: variant.sku,
    productId: product.id,
    productName: product.name,
    name: product.name,
    productSlug: product.slug,
    quantity: item.quantity,
    configuration: [],
    colorwayName: variant.colorway.name,
    size: variant.size,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? product.name,
    unitPrice: variant.price,
    oldUnitPrice: variant.compareAtPrice,
    lineTotal,
    compareAtLineTotal,
    stock: variant.stock,
    active: variant.active && product.active,
    available: variant.active && product.active && variant.stock > 0,
  };
}

export function buildCartDto(cart: CartWithItems, couponPercent = 0): CartDto {
  const items = cart.items.map(buildLine);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const compareAtSubtotal = items.reduce((sum, item) => sum + (item.compareAtLineTotal ?? item.lineTotal), 0);
  const couponDiscount = calcCouponDiscount(subtotal, couponPercent);
  return {
    items,
    totals: {
      subtotal,
      compareAtSubtotal,
      saleDiscount: compareAtSubtotal - subtotal,
      couponDiscount,
      total: subtotal - couponDiscount,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      lineCount: items.length,
    },
  };
}

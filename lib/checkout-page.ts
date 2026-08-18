import type { Prisma } from '@prisma/client';
import { CHECKOUT_POLICY } from '@/constants/config';
import { buildDeliverySlots, calculateCheckoutTotals, calculateServiceLines } from '@/lib/checkout-domain';
import { buildOrderSnapshot, type OrderSnapshot } from '@/lib/order';
import { buildCartDto, cartPresentationInclude } from '@/lib/cart-presentation';
import { checkCoupon } from '@/lib/coupon';
import { isCheckoutQuantityReady } from '@/lib/cart-quantity';
import { prisma } from '@/lib/prisma-client';
import { checkoutQuoteInputSchema, type CheckoutQuoteInput, type PlaceOrderInput } from '@/services/dto/checkout.dto';
import { EMPTY_CART_DTO } from '@/services/dto/commerce-cart.dto';
import type {
  CheckoutPageDto,
  CheckoutQuoteResult,
  CheckoutSavedAddressDto,
  CheckoutServiceLineDto,
  DeliveryMethod,
  PickupPointDto,
} from '@/services/dto/checkout-page.dto';

const checkoutUserSelect = {
  name: true,
  email: true,
  phone: true,
  addresses: {
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, label: true, city: true, street: true, comment: true, isDefault: true, createdAt: true },
  },
} satisfies Prisma.UserSelect;

type CheckoutUser = Prisma.UserGetPayload<{ select: typeof checkoutUserSelect }>;
type CheckoutCart = Prisma.CartGetPayload<{ include: typeof cartPresentationInclude }>;

export const canonicalCheckoutCartSelect = {
  id: true,
  userId: true,
  token: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      cartId: true,
      skuId: true,
      productVariantId: true,
      quantity: true,
      createdAt: true,
      sku: {
        select: {
          id: true,
          articleNumber: true,
          combinationKey: true,
          price: true,
          oldPrice: true,
          stock: true,
          active: true,
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
            select: {
              optionGroup: { select: { name: true, slug: true, sortOrder: true } },
              optionValue: { select: { name: true, slug: true, swatchHex: true } },
            },
            orderBy: { optionGroup: { sortOrder: 'asc' as const } },
          },
        },
      },
    },
  },
} satisfies Prisma.CartSelect;

type CanonicalCheckoutCart = Prisma.CartGetPayload<{ select: typeof canonicalCheckoutCartSelect }>;

export interface CheckoutPageDataClient {
  user: {
    findUnique(args: { where: { id: string }; select: typeof checkoutUserSelect }): Promise<CheckoutUser | null>;
  };
  cart: {
    findFirst(args: {
      where: { userId: string; id?: string };
      include: typeof cartPresentationInclude;
    }): Promise<CheckoutCart | null>;
  };
}

export interface CheckoutQuoteDataClient {
  cart: {
    findFirst(args: {
      where: { userId: string; id?: string };
      select: typeof canonicalCheckoutCartSelect;
    }): Promise<CanonicalCheckoutCart | null>;
  };
  coupon: {
    findUnique(args: { where: { code: string } }): Promise<{
      code: string;
      percent: number;
      active: boolean;
      expiresAt: Date | null;
    } | null>;
  };
}

export type CheckoutDataClient = CheckoutPageDataClient & CheckoutQuoteDataClient;

const defaultPageClient = prisma as unknown as CheckoutPageDataClient;
const defaultQuoteClient = prisma as unknown as CheckoutQuoteDataClient;

const deliveryOptions: CheckoutPageDto['deliveryOptions'] = [
  { id: 'courier', label: 'Курьерская доставка' },
  { id: 'showroom', label: 'Самовывоз из шоурума' },
  { id: 'pickup-point', label: 'Пункт выдачи' },
];

const pickupPoints: PickupPointDto[] = CHECKOUT_POLICY.pickupPoints.map((point) => ({ ...point }));

function savedAddresses(user: CheckoutUser): CheckoutSavedAddressDto[] {
  return [...user.addresses]
    .sort(
      (left, right) =>
        Number(right.isDefault) - Number(left.isDefault) ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    )
    .map(({ id, label, city, street, comment, isDefault }) => ({ id, label, city, street, comment, isDefault }));
}

function pageOptions(now: Date) {
  return {
    deliveryOptions,
    pickupPoints,
    initialSlots: {
      courier: buildDeliverySlots(now, 'courier'),
      showroom: buildDeliverySlots(now, 'showroom'),
      pickupPoint: buildDeliverySlots(now, 'pickup-point'),
    },
  };
}

function hasNonCanonicalLine(cart: {
  items: Array<{ sku: { active: boolean; product: { active: boolean } } | null; productVariantId: string | null }>;
}): boolean {
  return cart.items.some(
    (item) => !item.sku || item.productVariantId !== null || !item.sku.active || !item.sku.product.active,
  );
}

function hasNonReadyLine(cart: {
  items: Array<{
    quantity: number;
    sku: { active: boolean; stock: number; product: { active: boolean } } | null;
    productVariantId: string | null;
  }>;
}): boolean {
  return (
    hasNonCanonicalLine(cart) ||
    cart.items.some(
      (item) => item.sku !== null && (item.sku.stock < 1 || !isCheckoutQuantityReady(item.quantity, item.sku.stock)),
    )
  );
}

function asPresentationCart(cart: CanonicalCheckoutCart): CheckoutCart {
  return {
    ...cart,
    items: cart.items.map((item) => ({ ...item, productVariant: null })),
  } as unknown as CheckoutCart;
}

export async function getCheckoutPageDto({
  userId,
  cookieToken: _cookieToken,
  now,
  client = defaultPageClient,
}: {
  userId: string;
  cookieToken?: string;
  now: Date;
  client?: CheckoutPageDataClient;
}): Promise<CheckoutPageDto> {
  const [user, cart] = await Promise.all([
    client.user.findUnique({ where: { id: userId }, select: checkoutUserSelect }),
    client.cart.findFirst({ where: { userId }, include: cartPresentationInclude }),
  ]);
  if (!user) throw new Error('Checkout owner not found');
  const nonReady = cart ? hasNonReadyLine(cart) : false;

  const addresses = savedAddresses(user);
  const selectedAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
  return {
    status: !cart || cart.items.length === 0 ? 'EMPTY_CART' : nonReady ? 'NON_READY_CART' : 'READY',
    contactDefaults: {
      contactName: user.name ?? '',
      contactEmail: user.email,
      contactPhone: user.phone ?? '',
    },
    savedAddresses: addresses,
    addressDefaults: selectedAddress
      ? {
          city: selectedAddress.city,
          addressLine: selectedAddress.street,
          addressComment: selectedAddress.comment,
        }
      : null,
    initialCart: cart && !nonReady ? buildCartDto(cart) : EMPTY_CART_DTO,
    ...pageOptions(now),
  };
}

const serviceLabels: Record<CheckoutServiceLineDto['id'], string> = {
  carrying: 'Подъём без лифта',
  assembly: 'Сборка',
  removal: 'Вывоз старой мебели',
};

function quoteError(
  code: Exclude<CheckoutQuoteResult, { ok: true }>['code'],
  message: string,
  stock?: number,
): CheckoutQuoteResult {
  return stock === undefined ? { ok: false, code, message } : { ok: false, code, message, stock };
}

export async function buildCheckoutQuote({
  userId,
  cartId,
  cookieToken: _cookieToken,
  raw,
  now,
  client = defaultQuoteClient,
}: {
  userId: string;
  cartId?: string;
  cookieToken?: string;
  raw: unknown;
  now: Date;
  client?: CheckoutQuoteDataClient;
}): Promise<CheckoutQuoteResult> {
  const parsed = checkoutQuoteInputSchema.safeParse(raw);
  if (!parsed.success) return quoteError('INVALID_INPUT', 'Некорректные данные оформления');

  const cart = await client.cart.findFirst({
    where: { userId, ...(cartId ? { id: cartId } : {}) },
    select: canonicalCheckoutCartSelect,
  });
  if (!cart || cart.items.length === 0) return quoteError('EMPTY_CART', 'Корзина пуста');

  for (const item of cart.items) {
    if (
      !item.sku ||
      item.productVariantId !== null ||
      !item.sku.active ||
      !item.sku.product.active ||
      item.sku.stock < 1
    ) {
      return quoteError('SKU_UNAVAILABLE', 'Товар больше недоступен');
    }
    if (!isCheckoutQuantityReady(item.quantity, item.sku.stock)) {
      return quoteError('QUANTITY_EXCEEDS_STOCK', 'Недостаточно товара на складе', item.sku.stock);
    }
  }

  const input = parsed.data;
  const slot = buildDeliverySlots(now, input.deliveryMethod).find((candidate) => candidate.id === input.deliverySlotId);
  if (!slot) return quoteError('STALE_DELIVERY_SLOT', 'Выбранный интервал больше недоступен');

  const point = input.pickupPointId
    ? (pickupPoints.find((candidate) => candidate.id === input.pickupPointId) ?? null)
    : null;
  if (input.deliveryMethod !== 'courier' && (!point || point.kind !== input.deliveryMethod)) {
    return quoteError('INVALID_INPUT', 'Некорректный пункт получения');
  }

  const coupon = input.couponCode ? await checkCoupon(input.couponCode, client, () => now) : null;
  if (coupon && !coupon.ok) return quoteError('INVALID_COUPON', coupon.error);

  const cartDto = buildCartDto(asPresentationCart(cart), coupon?.ok ? coupon.percent : 0);
  const calculated = calculateCheckoutTotals({
    itemsTotal: cartDto.totals.subtotal,
    couponDiscount: cartDto.totals.couponDiscount,
    selection: input,
  });
  const serviceLines = calculateServiceLines(input).map((line) => ({
    id: line.id as CheckoutServiceLineDto['id'],
    label: serviceLabels[line.id as CheckoutServiceLineDto['id']],
    amount: line.amount,
  }));

  return {
    ok: true,
    quote: {
      cart: cartDto,
      coupon: coupon?.ok ? { code: coupon.code, percent: coupon.percent } : null,
      delivery: {
        method: input.deliveryMethod,
        zone: input.deliveryZone ?? null,
        slot,
        pickupPoint: point,
      },
      serviceLines,
      totals: {
        itemsSubtotal: cartDto.totals.subtotal,
        compareAtSubtotal: cartDto.totals.compareAtSubtotal,
        saleDiscount: cartDto.totals.saleDiscount,
        couponDiscount: cartDto.totals.couponDiscount,
        deliveryAmount: calculated.shippingAmount,
        serviceAmount: calculated.serviceAmount,
        total: calculated.totalAmount,
        itemCount: cartDto.totals.itemCount,
        lineCount: cartDto.totals.lineCount,
      },
    },
  };
}

export type { DeliveryMethod };

export interface CheckoutOrderData {
  cartId: string;
  cartItemIds: string[];
  salesItems: Array<{ productId: string; quantity: number }>;
  snapshot: OrderSnapshot;
  quote: Extract<CheckoutQuoteResult, { ok: true }>['quote'];
}

export class CheckoutOrderDataError extends Error {
  constructor(
    readonly code: Exclude<CheckoutQuoteResult, { ok: true }>['code'],
    message: string,
  ) {
    super(message);
  }
}

export async function buildCheckoutOrderData({
  userId,
  cartId,
  raw,
  now,
  client = defaultQuoteClient,
}: {
  userId: string;
  cartId: string;
  raw: PlaceOrderInput;
  now: Date;
  client?: CheckoutQuoteDataClient;
}): Promise<CheckoutOrderData> {
  const quoteInput: CheckoutQuoteInput = {
    deliveryMethod: raw.deliveryMethod,
    deliveryZone: raw.deliveryZone,
    deliverySlotId: raw.deliverySlotId,
    pickupPointId: raw.pickupPointId,
    address: raw.address,
    services: raw.services,
    couponCode: raw.couponCode,
  };
  const result = await buildCheckoutQuote({ userId, cartId, raw: quoteInput, now, client });
  if (!result.ok) throw new CheckoutOrderDataError(result.code, result.message);

  const cart = await client.cart.findFirst({
    where: { id: cartId, userId },
    select: canonicalCheckoutCartSelect,
  });
  if (!cart || cart.items.length === 0) throw new CheckoutOrderDataError('EMPTY_CART', 'Корзина пуста');
  if (hasNonCanonicalLine(cart))
    throw new CheckoutOrderDataError('SKU_UNAVAILABLE', 'Корзина содержит устаревший товар');

  return {
    cartId: cart.id,
    cartItemIds: cart.items.map((item) => item.id),
    salesItems: cart.items.map((item) => ({ productId: item.sku!.product.id, quantity: item.quantity })),
    snapshot: buildOrderSnapshot(asPresentationCart(cart)),
    quote: result.quote,
  };
}

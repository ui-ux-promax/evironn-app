import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { resolveOwnerCart } from '@/lib/cart';
import { buildCartDto, cartPresentationInclude } from '@/lib/cart-presentation';
import { cartCookieName } from '@/lib/cart-cookie';
import { type CartApiError, type CartApiErrorCode } from '@/services/dto/commerce-cart.dto';
import { updateQuantitySchema } from '@/services/dto/cart.dto';
import { runWithRequestContext } from '@/lib/request-context';
import { logger } from '@/lib/logger';

type Ctx = { params: Promise<{ id: string }> };

class CartItemRouteError extends Error {
  constructor(readonly code: CartApiErrorCode, readonly status: number, message: string) {
    super(message);
  }
}

function errorResponse(error: CartItemRouteError): NextResponse<CartApiError> {
  return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
}

async function readCartDto(cartId: string) {
  const cart = await prisma.cart.findFirst({ where: { id: cartId }, include: cartPresentationInclude });
  return cart ? buildCartDto(cart) : { items: [], totals: { subtotal: 0, compareAtSubtotal: 0, saleDiscount: 0, couponDiscount: 0, total: 0, itemCount: 0, lineCount: 0 } };
}

async function resolveItemOwner(req: NextRequest) {
  const session = await auth();
  const token = req.cookies.get(cartCookieName)?.value;
  const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });
  if (!owner) throw new CartItemRouteError('CART_OWNER_REQUIRED', 401, 'Корзина не найдена');
  return owner;
}

function genericError(message: string) {
  return NextResponse.json({ code: 'CART_INTERNAL', message } satisfies CartApiError, { status: 500 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return runWithRequestContext(req, async () => {
    try {
      const { id } = await params;
      const owner = await resolveItemOwner(req);
      const parsed = updateQuantitySchema.safeParse(await req.json());
      if (!parsed.success) throw new CartItemRouteError('CART_QUANTITY_LIMIT', 400, 'Некорректное количество');

      const item = await prisma.cartItem.findFirst({
        where: { id, cartId: owner.id },
        include: {
          sku: { include: { product: { select: { active: true } } } },
          productVariant: { include: { colorway: { include: { product: { select: { active: true } } } } } },
        },
      });
      if (!item) throw new CartItemRouteError('CART_ITEM_NOT_FOUND', 404, 'Позиция не найдена');

      const stock = item.sku?.stock ?? item.productVariant?.stock;
      const active = item.sku ? item.sku.active && item.sku.product.active : item.productVariant?.active && item.productVariant.colorway.product.active;
      if (!active) throw new CartItemRouteError('CART_UNAVAILABLE', 409, 'Товар недоступен');
      if (stock === undefined || stock < parsed.data.quantity) {
        throw new CartItemRouteError('CART_OUT_OF_STOCK', 409, 'Недостаточно на складе');
      }

      await prisma.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });
      return NextResponse.json(await readCartDto(owner.id));
    } catch (error) {
      if (error instanceof CartItemRouteError) return errorResponse(error);
      logger.error('cart_patch_failed', error);
      return genericError('Не удалось обновить корзину');
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return runWithRequestContext(req, async () => {
    try {
      const { id } = await params;
      const owner = await resolveItemOwner(req);
      const item = await prisma.cartItem.findFirst({ where: { id, cartId: owner.id } });
      if (!item) throw new CartItemRouteError('CART_ITEM_NOT_FOUND', 404, 'Позиция не найдена');
      await prisma.cartItem.delete({ where: { id } });
      return NextResponse.json(await readCartDto(owner.id));
    } catch (error) {
      if (error instanceof CartItemRouteError) return errorResponse(error);
      logger.error('cart_delete_failed', error);
      return genericError('Не удалось удалить позицию');
    }
  });
}

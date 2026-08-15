import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { resolveOwnerCart } from '@/lib/cart';
import { buildCartDto, cartPresentationInclude } from '@/lib/cart-presentation';
import { cartCookieName } from '@/lib/cart-cookie';
import { EMPTY_CART_DTO, type CartApiError, type CartApiErrorCode, type CartDto } from '@/services/dto/commerce-cart.dto';
import { updateQuantitySchema } from '@/services/dto/cart.dto';
import { runWithRequestContext } from '@/lib/request-context';
import { logger } from '@/lib/logger';

type Ctx = { params: Promise<{ id: string }> };

class CartItemRouteError extends Error {
  constructor(readonly code: CartApiErrorCode, readonly status: number, message: string, readonly stock?: number) {
    super(message);
  }
}

function errorResponse(error: CartItemRouteError): NextResponse<CartApiError> {
  return NextResponse.json(
    { error: { code: error.code, message: error.message, ...(error.stock === undefined ? {} : { stock: error.stock }) } },
    { status: error.status },
  );
}

async function readCartDto(cartId: string): Promise<CartDto> {
  const cart = await prisma.cart.findFirst({ where: { id: cartId }, include: cartPresentationInclude });
  return cart ? buildCartDto(cart) : EMPTY_CART_DTO;
}

async function resolveItemOwner(req: NextRequest) {
  const session = await auth();
  const token = req.cookies.get(cartCookieName)?.value;
  const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });
  if (!owner) throw new CartItemRouteError('CART_ITEM_NOT_FOUND', 401, 'Корзина не найдена');
  return owner;
}

function genericError(message: string) {
  return NextResponse.json({ error: { code: 'CART_CONFLICT', message } } satisfies CartApiError, { status: 500 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return runWithRequestContext(req, async () => {
    try {
      const { id } = await params;
      const owner = await resolveItemOwner(req);
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new CartItemRouteError('INVALID_INPUT', 400, 'Некорректное количество');
      }
      const parsed = updateQuantitySchema.safeParse(body);
      if (!parsed.success) throw new CartItemRouteError('INVALID_INPUT', 400, 'Некорректное количество');

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
      if (!active || stock === undefined) throw new CartItemRouteError('SKU_NOT_FOUND', 404, 'Товар не найден');
      if (stock <= 0) throw new CartItemRouteError('OUT_OF_STOCK', 409, 'Недостаточно на складе', stock);
      if (stock < parsed.data.quantity)
        throw new CartItemRouteError('QUANTITY_EXCEEDS_STOCK', 409, 'Недостаточно на складе', stock);

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

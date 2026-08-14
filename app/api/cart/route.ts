import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { resolveOwnerCart } from '@/lib/cart';
import { buildCartDto, cartPresentationInclude } from '@/lib/cart-presentation';
import { cartCookieName, cartCookieOptions } from '@/lib/cart-cookie';
import {
  EMPTY_CART_DTO,
  type CartApiError,
  type CartApiErrorCode,
  type CartDto,
} from '@/services/dto/commerce-cart.dto';
import { createCartItemSchema } from '@/services/dto/cart.dto';
import { runWithRequestContext } from '@/lib/request-context';
import { logger } from '@/lib/logger';
import { extractClientIp, checkCartRateLimit } from '@/lib/rate-limit';
import { tooManyRequests } from '@/lib/rate-limit-response';

const MAX_CART_RETRIES = 3;

class CartRouteError extends Error {
  constructor(
    readonly code: CartApiErrorCode,
    readonly status: number,
    message: string,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

function errorResponse(error: CartRouteError): NextResponse<CartApiError> {
  return NextResponse.json(
    { code: error.code, message: error.message, ...(error.issues ? { issues: error.issues } : {}) },
    { status: error.status },
  );
}

function genericErrorResponse(message: string): NextResponse<CartApiError> {
  return NextResponse.json({ code: 'CART_INTERNAL', message }, { status: 500 });
}

function isRetryableTransactionError(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code)),
  );
}

async function readCartDto(cartId: string): Promise<CartDto> {
  const cart = await prisma.cart.findFirst({ where: { id: cartId }, include: cartPresentationInclude });
  return cart ? buildCartDto(cart) : EMPTY_CART_DTO;
}

export async function GET(req: NextRequest) {
  return runWithRequestContext(req, async () => {
    try {
      const session = await auth();
      const token = req.cookies.get(cartCookieName)?.value;
      const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });
      if (!owner) return NextResponse.json(EMPTY_CART_DTO);
      const dto = await readCartDto(owner.id);
      const response = NextResponse.json(dto);
      if (owner.token !== token) response.cookies.set(cartCookieName, owner.token, cartCookieOptions);
      return response;
    } catch (error) {
      logger.error('cart_get_failed', error);
      return genericErrorResponse('Не удалось получить корзину');
    }
  });
}

export async function POST(req: NextRequest) {
  return runWithRequestContext(req, async () => {
    try {
      const ip = extractClientIp(req);
      const rl = await checkCartRateLimit(ip);
      if (!rl.success) return tooManyRequests(rl, 'Слишком часто. Попробуйте позже');

      const parsed = createCartItemSchema.safeParse(await req.json());
      if (!parsed.success) {
        const quantityIssue = parsed.error.issues.some((issue) => issue.path[0] === 'quantity');
        const error = new CartRouteError(
          quantityIssue ? 'CART_QUANTITY_LIMIT' : 'CART_INVALID',
          400,
          quantityIssue ? 'Количество ограничено 99 товарами' : 'Некорректные данные',
          parsed.error.flatten(),
        );
        return errorResponse(error);
      }

      const session = await auth();
      const cookieToken = req.cookies.get(cartCookieName)?.value ?? randomUUID();
      const owner = await resolveOwnerCart(session?.user?.id ?? null, cookieToken, { create: true });
      if (!owner) return errorResponse(new CartRouteError('CART_OWNER_REQUIRED', 401, 'Корзина не найдена'));
      const { skuId, quantity = 1 } = parsed.data;
      let updatedCart = null;

      for (let attempt = 0; attempt < MAX_CART_RETRIES; attempt += 1) {
        try {
          updatedCart = await prisma.$transaction(
            async (tx) => {
              const sku = await tx.sku.findUnique({
                where: { id: skuId },
                include: { product: { select: { active: true } } },
              });
              if (!sku) throw new CartRouteError('CART_SKU_NOT_FOUND', 404, 'Товар не найден');
              if (!sku.active || !sku.product.active)
                throw new CartRouteError('CART_UNAVAILABLE', 409, 'Товар недоступен');
              if (sku.stock <= 0) throw new CartRouteError('CART_OUT_OF_STOCK', 409, 'Недостаточно на складе');

              const existing = await tx.cartItem.findUnique({
                where: { cartId_skuId: { cartId: owner.id, skuId } },
              });
              const nextQuantity = (existing?.quantity ?? 0) + quantity;
              if (nextQuantity > 99)
                throw new CartRouteError('CART_QUANTITY_LIMIT', 400, 'Количество ограничено 99 товарами');
              if (nextQuantity > sku.stock)
                throw new CartRouteError('CART_OUT_OF_STOCK', 409, 'Недостаточно на складе');

              await tx.cartItem.upsert({
                where: { cartId_skuId: { cartId: owner.id, skuId } },
                create: { cartId: owner.id, skuId, quantity: nextQuantity },
                update: { quantity: nextQuantity },
              });
              return tx.cart.findFirst({ where: { id: owner.id }, include: cartPresentationInclude });
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          );
          break;
        } catch (error) {
          if (error instanceof CartRouteError) throw error;
          if (!isRetryableTransactionError(error) || attempt === MAX_CART_RETRIES - 1) {
            if (isRetryableTransactionError(error))
              throw new CartRouteError('CART_CONFLICT', 409, 'Корзина изменилась. Повторите попытку');
            throw error;
          }
        }
      }

      const response = NextResponse.json(updatedCart ? buildCartDto(updatedCart) : EMPTY_CART_DTO);
      response.cookies.set(cartCookieName, owner.token, cartCookieOptions);
      return response;
    } catch (error) {
      if (error instanceof CartRouteError) return errorResponse(error);
      logger.error('cart_post_failed', error);
      return genericErrorResponse('Не удалось добавить в корзину');
    }
  });
}

export async function DELETE(req: NextRequest) {
  return runWithRequestContext(req, async () => {
    try {
      const session = await auth();
      const token = req.cookies.get(cartCookieName)?.value;
      const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });
      if (!owner) return errorResponse(new CartRouteError('CART_OWNER_REQUIRED', 401, 'Корзина не найдена'));
      await prisma.cartItem.deleteMany({ where: { cartId: owner.id } });
      return NextResponse.json(await readCartDto(owner.id));
    } catch (error) {
      if (error instanceof CartRouteError) return errorResponse(error);
      logger.error('cart_clear_failed', error);
      return genericErrorResponse('Не удалось очистить корзину');
    }
  });
}

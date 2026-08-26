'use server';

import type { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { orderStatusUpdateSchema } from '@/services/dto/order-admin.dto';
import { nextOrderStatus } from '@/lib/order-admin';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { cancelOrderAsAdmin } from '@/lib/admin/order-cancellation.server';

const LIST_PATH = '/admin/orders';
type AdvanceOrderStatusResult = AdminActionResult<{ status: OrderStatus }>;
type CancelOrderByAdminResult = AdminActionResult<{ status: 'CANCELLED'; stockRestored: true }>;

// Forward-переход по пайплайну. Чистая прогрессия — сток/платёж/salesCount НЕ трогаем.
export async function advanceOrderStatus(input: unknown): Promise<AdvanceOrderStatusResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = orderStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', 'Некорректный статус');
  const { orderId, expectedStatus, nextStatus } = parsed.data;

  if (nextOrderStatus(expectedStatus) !== nextStatus) return adminError('VALIDATION_ERROR', 'Недопустимый переход статуса');

  const res = await prisma.order.updateMany({
    where: { id: orderId, status: expectedStatus },
    data: { status: nextStatus },
  });
  if (res.count === 0) return adminError('STALE_VALUE', 'Статус заказа изменился, обновите страницу');

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${orderId}`);
  return adminOk({ status: nextStatus });
}

export async function cancelOrderByAdmin(
  input: unknown,
): Promise<CancelOrderByAdminResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);
  return cancelOrderAsAdmin(input);
}

import { z } from 'zod';

// Forward-переходы: цель — только следующий шаг пайплайна. CANCELLED идёт отдельным action,
// PENDING никогда не таргет (назад не откатываем). orderId — cuid строкой.
export const orderStatusUpdateSchema = z
  .object({
    orderId: z.string().min(1),
    expectedStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED']),
    nextStatus: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED']),
  })
  .strict();

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const adminOrderCancelSchema = z
  .object({
    orderId: z.string().min(1),
    expectedStatus: z.enum(['PENDING', 'PROCESSING']),
  })
  .strict();

export type AdminOrderCancelInput = z.infer<typeof adminOrderCancelSchema>;

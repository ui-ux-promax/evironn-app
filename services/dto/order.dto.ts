import type { BlockedPaymentInitializationDto, CheckoutQuoteErrorCode } from '@/services/dto/checkout-page.dto';
import { z } from 'zod';

export { placeOrderSchema } from '@/services/dto/checkout.dto';
export type { PlaceOrderInput } from '@/services/dto/checkout.dto';

/** @deprecated Task 6 replaces the inherited checkout form. Never parse order actions with this schema. */
export const checkoutSchema = z.object({
  contactName: z.string().trim().min(1).max(80),
  contactPhone: z.string().trim().min(5).max(20),
  contactEmail: z.string().trim().email(),
  shippingMethod: z.enum(['courier', 'pickup']),
  city: z.string().trim().max(100).optional(),
  addressLine: z.string().trim().min(1).max(200),
  addressComment: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(['cod', 'online']),
  couponCode: z.string().trim().max(40).optional(),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;

export type PlaceOrderFailureCode =
  CheckoutQuoteErrorCode | 'PAYMENT_NOT_CONFIGURED' | 'CART_CONFLICT' | 'ORDER_TRANSACTION_CONFLICT' | 'ORDER_FAILED';

export type PlaceOrderResult =
  | { ok: true; code: 'ORDER_READY'; orderNumber: number; paymentUrl?: never }
  | { ok: true; code: 'PAYMENT_REDIRECT_READY'; orderNumber: number; paymentUrl: string }
  | { ok: false; code: 'PAYMENT_NOT_CREATED'; orderNumber: number; error: string }
  | { ok: false; code: 'PAYMENT_INITIALIZATION_PENDING'; orderNumber: number; error: string }
  | {
      ok: false;
      code: 'PAYMENT_INITIALIZATION_BLOCKED';
      paymentInitialization: BlockedPaymentInitializationDto;
    }
  | { ok: false; code: PlaceOrderFailureCode; error: string };

import { z } from 'zod';

export const deliveryMethodSchema = z.enum(['courier', 'showroom', 'pickup-point']);
export const deliveryZoneSchema = z.enum(['moscow', 'moscow-region']);
export const liftTypeSchema = z.enum(['passenger', 'freight', 'none']);
export const paymentMethodSchema = z.enum(['online', 'cod']);

export const checkoutAddressSchema = z
  .object({
    city: z.string().trim().min(1).max(100),
    addressLine: z.string().trim().min(1).max(200),
    addressComment: z.string().trim().max(300).optional(),
    floor: z.number().int().min(1).max(60).optional(),
    liftType: liftTypeSchema.optional(),
    intercom: z.string().trim().max(40).optional(),
  })
  .strict();

const base = z
  .object({
    deliveryMethod: deliveryMethodSchema,
    deliveryZone: deliveryZoneSchema.optional(),
    deliverySlotId: z.string().min(1),
    pickupPointId: z.string().min(1).optional(),
    address: checkoutAddressSchema.optional(),
    services: z.object({ carrying: z.boolean(), assembly: z.boolean(), removal: z.boolean() }).strict(),
    couponCode: z.string().trim().max(40).optional(),
  })
  .strict();

const validateDelivery = (value: z.infer<typeof base>, ctx: z.RefinementCtx) => {
  if (value.deliveryMethod === 'courier') {
    if (!value.deliveryZone) ctx.addIssue({ code: 'custom', path: ['deliveryZone'], message: 'Courier zone required' });
    if (!value.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Courier address required' });
    if (value.services.assembly || value.services.removal || value.services.carrying) {
      if (!value.address)
        ctx.addIssue({ code: 'custom', path: ['services'], message: 'Courier address required for services' });
    }
    if (value.services.carrying && value.address?.liftType === 'none' && value.address.floor === undefined)
      ctx.addIssue({ code: 'custom', path: ['address', 'floor'], message: 'Floor required without lift' });
  } else {
    if (value.deliveryZone || value.address)
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Address not allowed' });
    if (value.services.carrying || value.services.assembly || value.services.removal)
      ctx.addIssue({ code: 'custom', path: ['services'], message: 'Services unavailable' });
    if (!value.pickupPointId)
      ctx.addIssue({ code: 'custom', path: ['pickupPointId'], message: 'Pickup point required' });
    if (value.pickupPointId && !['pt-dizavod', 'pt-danilov', 'pt-vdnh'].includes(value.pickupPointId))
      ctx.addIssue({ code: 'custom', path: ['pickupPointId'], message: 'Unknown pickup point' });
    if (value.deliveryMethod === 'showroom' && value.pickupPointId !== 'pt-dizavod')
      ctx.addIssue({ code: 'custom', path: ['pickupPointId'], message: 'Showroom identity mismatch' });
    if (value.deliveryMethod === 'pickup-point' && value.pickupPointId === 'pt-dizavod')
      ctx.addIssue({ code: 'custom', path: ['pickupPointId'], message: 'Pickup point identity mismatch' });
  }
};

export const checkoutQuoteInputSchema = base.superRefine(validateDelivery);
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteInputSchema>;

export const placeOrderSchema = base
  .extend({
    contactName: z.string().trim().min(2).max(100),
    contactPhone: z
      .string()
      .transform((value) => value.replace(/\D/g, '').replace(/^8/, '7'))
      .refine((value) => /^7\d{10}$/.test(value), 'Invalid phone')
      .transform((value) => `+${value}`),
    contactEmail: z.string().trim().email().max(200),
    paymentMethod: paymentMethodSchema,
  })
  .superRefine(validateDelivery);
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

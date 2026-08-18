import type { CartDto } from '@/services/dto/commerce-cart.dto';
import type { CheckoutQuoteInput } from '@/services/dto/checkout.dto';
import {
  type BlockedPaymentInitializationBaseDto,
  type CheckoutPaymentInitializationAction,
} from '@/services/dto/payment-initialization.dto';

export { PAYMENT_INITIALIZATION_STATUSES } from '@/services/dto/payment-initialization.dto';
export type { PaymentInitializationStatus } from '@/services/dto/payment-initialization.dto';

export type DeliveryMethod = CheckoutQuoteInput['deliveryMethod'];
export type DeliveryZone = NonNullable<CheckoutQuoteInput['deliveryZone']>;

export interface DeliverySlotDto {
  id: string;
  date: string;
  windowId: string;
  windowLabel: string;
}

export interface PickupPointDto {
  id: string;
  kind: 'showroom' | 'pickup-point';
  name: string;
  address: string;
  hours: string;
  metro: string;
  leadDays: number;
}

export interface CheckoutSavedAddressDto {
  id: string;
  label: string;
  city: string;
  /** Exact Prisma Address.street value; Phase 4 does not split or parse it. */
  street: string;
  comment: string | null;
  isDefault: boolean;
}

export interface CheckoutServiceLineDto {
  id: 'carrying' | 'assembly' | 'removal';
  label: string;
  amount: number;
}

export interface CheckoutTotalsDto {
  itemsSubtotal: number;
  compareAtSubtotal: number;
  saleDiscount: number;
  couponDiscount: number;
  deliveryAmount: number;
  serviceAmount: number;
  total: number;
  itemCount: number;
  lineCount: number;
}

export interface CheckoutQuoteDto {
  cart: CartDto;
  coupon: { code: string; percent: number } | null;
  delivery: {
    method: DeliveryMethod;
    zone: DeliveryZone | null;
    slot: DeliverySlotDto;
    pickupPoint: PickupPointDto | null;
  };
  serviceLines: CheckoutServiceLineDto[];
  totals: CheckoutTotalsDto;
}

export interface CheckoutPageDto {
  status: 'READY' | 'EMPTY_CART' | 'NON_READY_CART';
  contactDefaults: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
  savedAddresses: CheckoutSavedAddressDto[];
  addressDefaults: {
    city: string;
    addressLine: string;
    addressComment: string | null;
  } | null;
  initialCart: CartDto;
  deliveryOptions: ReadonlyArray<{ id: DeliveryMethod; label: string }>;
  pickupPoints: PickupPointDto[];
  initialSlots: {
    courier: DeliverySlotDto[];
    showroom: DeliverySlotDto[];
    pickupPoint: DeliverySlotDto[];
  };
}

export type CheckoutQuoteErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_INPUT'
  | 'EMPTY_CART'
  | 'SKU_UNAVAILABLE'
  | 'QUANTITY_EXCEEDS_STOCK'
  | 'INVALID_COUPON'
  | 'STALE_DELIVERY_SLOT';

export type CheckoutQuoteResult =
  { ok: true; quote: CheckoutQuoteDto } | { ok: false; code: CheckoutQuoteErrorCode; message: string; stock?: number };

export interface BlockedPaymentInitializationDto extends BlockedPaymentInitializationBaseDto {
  allowedActions: readonly [CheckoutPaymentInitializationAction];
}

export function buildBlockedPaymentInitializationDto(orderNumber: number): BlockedPaymentInitializationDto {
  return {
    status: 'PAYMENT_INITIALIZATION_BLOCKED',
    orderNumber,
    heading: 'Платёж требует проверки',
    message: `Заказ №${orderNumber} сохранён. Повторное создание платежа отключено; статус проверяется.`,
    continuePaymentUrl: null,
    canRetryCreate: false,
    allowedActions: ['OPEN_ORDER'],
  };
}

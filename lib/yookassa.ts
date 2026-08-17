import { YooKassa, CurrencyEnum, LocaleEnum } from '@webzaytsev/yookassa-ts-sdk';
import type { IConfirmationRedirect } from '@webzaytsev/yookassa-ts-sdk';
import { assertPortfolioPaymentMode } from './payment-environment';

let _sdk: ReturnType<typeof YooKassa> | null = null;

function yooKassaCredentials(): { shop_id: string; secret_key: string } {
  const shop_id = process.env.YOOKASSA_SHOP_ID;
  const secret_key = process.env.YOOKASSA_SECRET_KEY;
  if (!shop_id || !secret_key) throw new Error('YooKassa not configured (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)');
  return { shop_id, secret_key };
}

export function getYooKassa() {
  assertPortfolioPaymentMode(process.env);
  const credentials = yooKassaCredentials();
  if (_sdk) return _sdk;
  _sdk = YooKassa(credentials);
  return _sdk;
}

export function validateYooKassaConfiguration(): void {
  getYooKassa();
}

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Нормализует кандидата в чистый origin: убирает пробелы/переносы строк и любой путь.
 * Защищает return_url от загрязнённого источника (напр. в NEXT_PUBLIC_SITE_URL по ошибке
 * оказался URL вебхука с хвостовым "\n") — иначе ЮKassa получает битый return_url
 * и виджет падает с «Платёж не прошёл».
 */
export function toOrigin(raw: string): string {
  const trimmed = raw.trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: number;
  amountRub: number;
  baseUrl?: string; // перекрывает siteUrl() — для рантайм-определения хоста из запроса
}
export interface CreatePaymentResult {
  id: string;
  confirmationUrl: string;
}

export interface PaymentProviderDetails {
  id: string;
  status: string;
  amountRub: number;
  orderNumber: string;
  confirmationUrl: string | null;
}

export type PaymentProviderAttempt =
  | { outcome: 'NOT_CREATED'; dispatched: false }
  | { outcome: 'CREATED'; payment: PaymentProviderDetails }
  | { outcome: 'INDETERMINATE'; dispatched: true; reason: string };

export interface DurableCreatePaymentInput {
  amountRub: number;
  capture: true;
  description: string;
  idempotencyKey: string;
  locale: 'ru_RU';
  metadata: { orderNumber: string };
  returnUrl: string;
}

function paymentDetails(value: unknown): PaymentProviderDetails | null {
  if (!value || typeof value !== 'object') return null;
  const payment = value as {
    id?: unknown;
    status?: unknown;
    amount?: { value?: unknown; currency?: unknown };
    metadata?: { orderNumber?: unknown };
    confirmation?: { confirmation_url?: unknown };
  };
  const amountRub = typeof payment.amount?.value === 'string' ? Number(payment.amount.value) : Number.NaN;
  if (
    typeof payment.id !== 'string' ||
    typeof payment.status !== 'string' ||
    payment.amount?.currency !== 'RUB' ||
    !Number.isFinite(amountRub) ||
    typeof payment.metadata?.orderNumber !== 'string'
  ) {
    return null;
  }
  return {
    id: payment.id,
    status: payment.status,
    amountRub,
    orderNumber: payment.metadata.orderNumber,
    confirmationUrl:
      typeof payment.confirmation?.confirmation_url === 'string' ? payment.confirmation.confirmation_url : null,
  };
}

export async function createPaymentAttempt(input: DurableCreatePaymentInput): Promise<PaymentProviderAttempt> {
  let sdk: ReturnType<typeof YooKassa>;
  try {
    sdk = getYooKassa();
  } catch {
    return { outcome: 'NOT_CREATED', dispatched: false };
  }
  try {
    const payment = await sdk.payments.create(
      {
        amount: { value: input.amountRub.toFixed(2), currency: CurrencyEnum.RUB },
        confirmation: { type: 'redirect', return_url: input.returnUrl, locale: LocaleEnum.ru_RU },
        capture: input.capture,
        description: input.description,
        metadata: input.metadata,
      },
      input.idempotencyKey,
    );
    const details = paymentDetails(payment);
    return details
      ? { outcome: 'CREATED', payment: details }
      : { outcome: 'INDETERMINATE', dispatched: true, reason: 'malformed-response' };
  } catch {
    return { outcome: 'INDETERMINATE', dispatched: true, reason: 'provider-error' };
  }
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const sdk = getYooKassa();
  const base = toOrigin(input.baseUrl || siteUrl());
  const payment = await sdk.payments.create(
    {
      // ЮKassa ждёт сумму в рублях (major units), напр. "15490.00" — НЕ в копейках.
      amount: { value: input.amountRub.toFixed(2), currency: CurrencyEnum.RUB },
      confirmation: { type: 'redirect', return_url: `${base}/orders/${input.orderNumber}`, locale: LocaleEnum.ru_RU },
      capture: true,
      description: `Заказ #${input.orderNumber}`,
      metadata: { orderNumber: String(input.orderNumber) },
    },
    `payment-${input.orderId}`,
  );
  const confirmation = payment.confirmation as IConfirmationRedirect;
  return { id: payment.id, confirmationUrl: confirmation.confirmation_url! };
}

export async function cancelPayment(paymentId: string): Promise<void> {
  const sdk = getYooKassa();
  await sdk.payments.cancel(paymentId);
}

// Запрос актуального статуса платежа у ЮKassa (источник правды).
// Используется страницей заказа, чтобы подтвердить оплату без зависимости от вебхука.
export async function getPaymentStatus(paymentId: string): Promise<string> {
  const sdk = getYooKassa();
  const payment = (await sdk.payments.load(paymentId)) as { status?: unknown } | null;
  if (
    !payment ||
    (payment.status !== 'pending' &&
      payment.status !== 'waiting_for_capture' &&
      payment.status !== 'succeeded' &&
      payment.status !== 'canceled')
  ) {
    throw new Error('Malformed YooKassa payment status response');
  }
  return payment.status;
}

export async function getPaymentDetails(paymentId: string): Promise<PaymentProviderDetails | null> {
  const sdk = getYooKassa();
  try {
    const details = paymentDetails(await sdk.payments.load(paymentId));
    if (!details) throw new Error('Malformed YooKassa payment response');
    return details;
  } catch (error) {
    const providerError = error as {
      name?: unknown;
      status?: unknown;
      statusCode?: unknown;
      response?: { status?: unknown };
      code?: unknown;
    };
    if (
      providerError.status === 404 ||
      providerError.statusCode === 404 ||
      providerError.response?.status === 404 ||
      providerError.code === 'not_found' ||
      providerError.name === 'not_found' ||
      providerError.name === 'HTTP_404'
    ) {
      return null;
    }
    throw error;
  }
}

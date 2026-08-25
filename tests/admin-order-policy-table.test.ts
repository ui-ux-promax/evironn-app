import { describe, expect, it } from 'vitest';
import type { OrderStatus, PaymentInitializationState } from '@prisma/client';
import {
  ADMIN_CANCEL_POLICY,
  canAdminCancel,
  classifyAdminPaymentSettlement,
  type AdminCancelBlockReason,
  type AdminPaymentSettlement,
} from '@/lib/order-admin';

const initializationStates: PaymentInitializationState[] = [
  'READY',
  'CLAIMED',
  'DISPATCHED',
  'CORRELATED',
  'NOT_CREATED',
];

function order(
  overrides: Partial<{
    status: OrderStatus;
    paymentInitializationState: PaymentInitializationState | null;
    paymentInitializationClaimedAt: Date | null;
    paymentEverDispatchedAt: Date | null;
    payment: { status: string } | null;
  }> = {},
) {
  return {
    status: 'PENDING' as OrderStatus,
    paymentInitializationState: null,
    paymentInitializationClaimedAt: null,
    paymentEverDispatchedAt: null,
    payment: null,
    ...overrides,
  };
}

describe('admin payment settlement classification', () => {
  it.each([
    [null, 'NONE'],
    [{ status: 'pending' }, 'PENDING'],
    [{ status: 'waiting_for_capture' }, 'PENDING'],
    [{ status: 'succeeded' }, 'SUCCEEDED'],
    [{ status: 'canceled' }, 'FAILED'],
    [{ status: 'failed' }, 'UNKNOWN'],
    [{ status: '' }, 'UNKNOWN'],
  ] as const)('%j classifies as %s', (payment, expected: AdminPaymentSettlement) => {
    expect(classifyAdminPaymentSettlement(payment)).toBe(expected);
  });
});

describe('admin cancellation initialization policy', () => {
  it.each([
    ['READY', 'ALLOWED_IF_UNSETTLED'],
    ['CLAIMED', 'PAYMENT_CLAIM_IN_FLIGHT'],
    ['DISPATCHED', 'PAYMENT_STATE_UNSAFE'],
    ['CORRELATED', 'PAYMENT_STATE_UNSAFE'],
    ['NOT_CREATED', 'ALLOWED_IF_UNSETTLED'],
  ] as const)('maps %s to %s', (state, expected) => {
    expect(ADMIN_CANCEL_POLICY[state]).toBe(expected);
  });

  it.each([
    ['PENDING', { ok: true }],
    ['PROCESSING', { ok: true }],
    ['SHIPPED', { ok: false, reason: 'STATUS_NOT_CANCELLABLE' }],
    ['DELIVERED', { ok: false, reason: 'STATUS_NOT_CANCELLABLE' }],
    ['CANCELLED', { ok: false, reason: 'STATUS_NOT_CANCELLABLE' }],
  ] as const)('applies the status rule to %s', (status, expected) => {
    expect(canAdminCancel(order({ status }))).toEqual(expected);
  });

  it.each(initializationStates)('evaluates every initialization state for safe empty settlement: %s', (state) => {
    const result = canAdminCancel(order({ paymentInitializationState: state }));

    if (state === 'READY' || state === 'NOT_CREATED') {
      expect(result).toEqual({ ok: true });
    } else if (state === 'CLAIMED') {
      expect(result).toEqual({ ok: false, reason: 'PAYMENT_CLAIM_IN_FLIGHT' });
    } else {
      expect(result).toEqual({ ok: false, reason: 'PAYMENT_STATE_UNSAFE' });
    }
  });

  it.each([
    ['NONE', null],
    ['FAILED', { status: 'canceled' }],
  ] as const)('allows safe %s settlement with null initialization state', (_settlement, payment) => {
    expect(canAdminCancel(order({ payment }))).toEqual({ ok: true });
  });

  it.each([
    ['NONE', null],
    ['FAILED', { status: 'canceled' }],
  ] as const)('allows safe %s settlement in READY and NOT_CREATED states', (_settlement, payment) => {
    for (const paymentInitializationState of ['READY', 'NOT_CREATED'] as const) {
      expect(canAdminCancel(order({ paymentInitializationState, payment }))).toEqual({ ok: true });
    }
  });

  it.each([
    ['PENDING', { status: 'pending' }],
    ['UNKNOWN', { status: 'provider-added-status' }],
  ] as const)('blocks unsafe %s settlement even in READY state', (_settlement, payment) => {
    expect(canAdminCancel(order({ paymentInitializationState: 'READY', payment }))).toEqual({
      ok: false,
      reason: 'PAYMENT_STATE_UNSAFE',
    });
  });

  it.each([
    ['status', order({ status: 'SHIPPED', payment: { status: 'succeeded' } }), 'STATUS_NOT_CANCELLABLE'],
    [
      'dispatch evidence',
      order({ paymentEverDispatchedAt: new Date('2026-08-25T00:00:00.000Z'), payment: { status: 'succeeded' } }),
      'PAYMENT_DISPATCH_EVIDENCE_PRESENT',
    ],
    [
      'succeeded settlement',
      order({ paymentInitializationState: 'CLAIMED', payment: { status: 'succeeded' } }),
      'PAYMENT_SUCCEEDED_REFUND_REQUIRED',
    ],
    [
      'claimed state',
      order({ paymentInitializationState: 'CLAIMED', payment: { status: 'pending' } }),
      'PAYMENT_CLAIM_IN_FLIGHT',
    ],
    [
      'claim timestamp',
      order({ paymentInitializationClaimedAt: new Date('2026-08-25T00:00:00.000Z') }),
      'PAYMENT_CLAIM_IN_FLIGHT',
    ],
    [
      'dispatched state',
      order({ paymentInitializationState: 'DISPATCHED', payment: { status: 'pending' } }),
      'PAYMENT_STATE_UNSAFE',
    ],
    [
      'correlated state',
      order({ paymentInitializationState: 'CORRELATED', payment: { status: 'provider-added-status' } }),
      'PAYMENT_STATE_UNSAFE',
    ],
    ['pending settlement', order({ payment: { status: 'waiting_for_capture' } }), 'PAYMENT_STATE_UNSAFE'],
    ['unknown settlement', order({ payment: { status: 'provider-added-status' } }), 'PAYMENT_STATE_UNSAFE'],
  ] as const)('applies seven-rule precedence for %s', (_case, input, reason: AdminCancelBlockReason) => {
    expect(canAdminCancel(input)).toEqual({ ok: false, reason });
  });
});

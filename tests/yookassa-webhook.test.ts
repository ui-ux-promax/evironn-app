import { describe, it, expect, beforeEach, vi } from 'vitest';

const { parseMock } = vi.hoisted(() => ({ parseMock: vi.fn() }));

vi.mock('@webzaytsev/yookassa-ts-sdk', () => ({ parseNotification: parseMock }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/payment-sync', () => ({ reconcilePaymentStatus: vi.fn(), recoverPaymentCorrelation: vi.fn() }));
vi.mock('@/lib/yookassa', () => ({
  getPaymentStatus: vi.fn(),
  isPaymentProviderStatus: (status: unknown) =>
    status === 'pending' || status === 'waiting_for_capture' || status === 'succeeded' || status === 'canceled',
}));

import { POST } from '@/app/api/yookassa/webhook/route';
import { reconcilePaymentStatus, recoverPaymentCorrelation } from '@/lib/payment-sync';
import { getPaymentStatus } from '@/lib/yookassa';

const reconcileMock = reconcilePaymentStatus as unknown as ReturnType<typeof vi.fn>;
const statusMock = getPaymentStatus as unknown as ReturnType<typeof vi.fn>;
const recoverMock = recoverPaymentCorrelation as unknown as ReturnType<typeof vi.fn>;

function req() {
  return { json: async () => ({}) } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  reconcileMock.mockResolvedValue({ kind: 'applied', transition: 'succeeded' });
  recoverMock.mockResolvedValue({ kind: 'recovered', paymentId: 'pay_missing' });
  statusMock.mockResolvedValue('succeeded');
});

describe('yookassa webhook', () => {
  it('payment.succeeded verifies remote status, then reconciles once', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_1' } });
    statusMock.mockResolvedValue('succeeded');

    const res = await POST(req() as never);

    expect(res.status).toBe(200);
    expect(statusMock).toHaveBeenCalledWith('pay_1');
    expect(reconcileMock).toHaveBeenCalledWith({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'webhook',
    });
  });

  it('payment.canceled verifies remote status, then reconciles once', async () => {
    parseMock.mockReturnValue({ event: 'payment.canceled', object: { id: 'pay_1' } });
    statusMock.mockResolvedValue('canceled');

    const res = await POST(req() as never);

    expect(res.status).toBe(200);
    expect(statusMock).toHaveBeenCalledWith('pay_1');
    expect(reconcileMock).toHaveBeenCalledWith({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
    });
  });

  it('passes non-final remote statuses to reconciliation as safe no-ops', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_1' } });
    statusMock.mockResolvedValue('pending');
    reconcileMock.mockResolvedValue({ kind: 'ignored', reason: 'remote-not-final' });

    const res = await POST(req() as never);

    expect(res.status).toBe(200);
    expect(reconcileMock).toHaveBeenCalledWith({
      paymentId: 'pay_1',
      remoteStatus: 'pending',
      source: 'webhook',
    });
  });

  it('returns ok for missing local payment reconciliation', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_missing' } });
    statusMock.mockResolvedValue('succeeded');
    reconcileMock.mockResolvedValue({ kind: 'missing' });

    const res = await POST(req() as never);

    expect(res.status).toBe(200);
    expect(recoverMock).toHaveBeenCalledWith('pay_missing');
    expect(reconcileMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    { kind: 'error', reason: 'provider-lookup-failed' },
    { kind: 'error', reason: 'correlation-persist-failed' },
  ])('returns 500 when missing-payment recovery fails: $reason', async (recovery) => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_missing' } });
    statusMock.mockResolvedValue('succeeded');
    reconcileMock.mockResolvedValue({ kind: 'missing' });
    recoverMock.mockResolvedValue(recovery);

    const res = await POST(req() as never);

    expect(res.status).toBe(500);
  });

  it('returns 500 when missing-payment recovery rejects malformed provider status', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_unknown_status' } });
    statusMock.mockResolvedValue('succeeded');
    reconcileMock.mockResolvedValue({ kind: 'missing' });
    recoverMock.mockResolvedValue({ kind: 'error', reason: 'provider-lookup-failed' });

    const res = await POST(req() as never);

    expect(res.status).toBe(500);
    expect(recoverMock).toHaveBeenCalledWith('pay_unknown_status');
  });

  it('ignores unsupported provider event after parsing', async () => {
    parseMock.mockReturnValue({ event: 'refund.succeeded', object: { id: 'refund_1' } });

    const res = await POST(req() as never);

    expect(res.status).toBe(200);
    expect(statusMock).not.toHaveBeenCalled();
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('invalid payload returns 400', async () => {
    parseMock.mockImplementation(() => {
      throw new Error('bad');
    });

    const res = await POST(req() as never);

    expect(res.status).toBe(400);
  });

  it('YooKassa status verification error returns 500 without reconciliation', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_1' } });
    statusMock.mockRejectedValue(new Error('yookassa down'));

    const res = await POST(req() as never);

    expect(res.status).toBe(500);
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('returns 500 when provider status boundary yields malformed data', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_1' } });
    statusMock.mockResolvedValue(undefined);

    const res = await POST(req() as never);

    expect(res.status).toBe(500);
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('unexpected reconciliation error returns 500', async () => {
    parseMock.mockReturnValue({ event: 'payment.succeeded', object: { id: 'pay_1' } });
    statusMock.mockResolvedValue('succeeded');
    reconcileMock.mockRejectedValue(new Error('db down'));

    const res = await POST(req() as never);

    expect(res.status).toBe(500);
  });
});

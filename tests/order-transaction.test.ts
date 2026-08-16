import { describe, expect, it, vi } from 'vitest';
import { runSerializableOrderTransaction } from '@/lib/order';

describe('runSerializableOrderTransaction', () => {
  it('uses Serializable isolation and retries P2034 at most three attempts', async () => {
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' });
    let attempt = 0;
    const client = { $transaction: vi.fn() };
    client.$transaction.mockImplementation(async (callback: (tx: object) => unknown, options: object) => {
      expect(options).toEqual({ isolationLevel: 'Serializable' });
      attempt += 1;
      const result = await callback({ attempt });
      if (attempt < 3) throw conflict;
      return result;
    });
    const operation = vi.fn(async (tx) => tx);

    await expect(runSerializableOrderTransaction(client, operation)).resolves.toEqual({ attempt: 3 });
    expect(client.$transaction).toHaveBeenCalledTimes(3);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(operation.mock.calls.map(([tx]) => tx)).toEqual([{ attempt: 1 }, { attempt: 2 }, { attempt: 3 }]);
  });

  it('returns an honest conflict after the third P2034', async () => {
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' });
    const client = { $transaction: vi.fn().mockRejectedValue(conflict) };
    await expect(runSerializableOrderTransaction(client, vi.fn())).rejects.toMatchObject({
      code: 'ORDER_TRANSACTION_CONFLICT',
    });
    expect(client.$transaction).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-conflict failures', async () => {
    const client = { $transaction: vi.fn().mockRejectedValue(new Error('stock unavailable')) };
    await expect(runSerializableOrderTransaction(client, vi.fn())).rejects.toThrow('stock unavailable');
    expect(client.$transaction).toHaveBeenCalledOnce();
  });
});

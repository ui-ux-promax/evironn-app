import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const captureException = vi.hoisted(() => vi.fn());

vi.mock('@sentry/nextjs', () => ({ captureException }));

import { logger } from '@/lib/logger';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('emits Evironn service logs and scrubbed Sentry extras for errors', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const error = new Error('database unavailable');

  logger.child({ accountEmail: 'person@example.com' }).error('test_event', error, {
    contactEmail: 'other@example.com',
    password: 'secret',
    nested: { authorization: 'Bearer secret', safe: 'visible' },
  });

  const payload = JSON.parse(String(consoleError.mock.calls[0]?.[0]));
  expect(payload).toMatchObject({
    level: 'error',
    service: 'evironn-app',
    message: 'test_event',
    accountEmail: '[redacted-example.com]',
    contactEmail: '[redacted-example.com]',
    password: '[redacted]',
    nested: { authorization: '[redacted]', safe: 'visible' },
  });
  expect(captureException).toHaveBeenCalledTimes(1);
  expect(captureException).toHaveBeenCalledWith(
    error,
    expect.objectContaining({
      tags: { event: 'test_event' },
      extra: {
        accountEmail: '[redacted-example.com]',
        contactEmail: '[redacted-example.com]',
        password: '[redacted]',
        nested: { authorization: '[redacted]', safe: 'visible' },
        err: expect.objectContaining({ message: 'database unavailable' }),
      },
    }),
  );
});

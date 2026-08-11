import { expect, it } from 'vitest';
import { scrubPii } from '@/lib/pii-scrub';

it('scrubs composite keys and arrays without mutating input', () => {
  const input = {
    contactEmail: 'person@example.com',
    shippingAddress: 'Lenina 1',
    rows: [{ authToken: 'abc', phone: '+79990001122' }],
  };

  expect(scrubPii(input)).toEqual({
    contactEmail: '[redacted-example.com]',
    shippingAddress: '[redacted]',
    rows: [{ authToken: '[redacted]', phone: '***1122' }],
  });
  expect(input.contactEmail).toBe('person@example.com');
});

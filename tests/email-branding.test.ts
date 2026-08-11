import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const emailFiles = ['emails/_layout.tsx', 'emails/verification-code.tsx', 'emails/welcome.tsx'];

describe('Ritm email templates', () => {
  it('use the Ritm brand and do not retain the legacy STRIDE wordmark', () => {
    for (const file of emailFiles) {
      const source = readFileSync(file, 'utf8');

      expect(source).toContain('Ritm');
      expect(source).not.toContain('STRIDE');
    }
  });
});

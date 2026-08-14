import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 3 auth composition assets', () => {
  it('ships exact clone asset bytes', () => {
    const root = process.cwd();
    const assets = [
      [
        'public/assets/products/05-graphite-walnut-room-integrated-v2.png',
        '77AD814923CEA3E2381F5596C9A50FBA3B07E8446625DCDEA90FCECE25FC80D7',
      ],
      [
        'public/assets/products/05-ivory-walnut-chair-alpha.png',
        '75106ABA76F8C121ADC3A9D5497A6566655A53320EE519267CBE86CAC6EF66F1',
      ],
      [
        'public/assets/products/05-terracotta-walnut-chair-alpha.png',
        '19F4717415537D49BBF6195D79A2ED35AB5A7AF240A538A03B9FDED5203D385D',
      ],
    ] as const;

    for (const [file, expected] of assets) {
      const digest = createHash('sha256')
        .update(readFileSync(join(root, file)))
        .digest('hex')
        .toUpperCase();
      expect(digest).toBe(expected);
    }
  });
});

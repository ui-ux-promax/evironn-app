import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 3 auth composition assets', () => {
  it('ships exact clone asset bytes', () => {
    const root = process.cwd();
    const assets = [
      [
        'public/assets/products/05-graphite-walnut-room-integrated-v2.webp',
        '81170D516492F742DC662780F75B0A76D08D1CE67EF67DC1B96372B56C774618',
      ],
      [
        'public/assets/products/05-ivory-walnut-chair-alpha.webp',
        '8A7D4F0DAE48798294CA8B6323EBA5BA753EF9311C5759010B26B6BCE3531842',
      ],
      [
        'public/assets/products/05-terracotta-walnut-chair-alpha.webp',
        '06B3A51E86FC75A8197168B9A83EBC88B77625F842E9D7D767FB4635DB19021C',
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

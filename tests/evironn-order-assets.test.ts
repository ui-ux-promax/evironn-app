import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const sha = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
describe('order assets', () => {
  it('keeps exact clone CSS', () => {
    expect(sha('styles/evironn/OrderVariantA.css')).toBe(
      'E0E5B67CF595BD5FB4EF31643D94A59A17DCAA3D8DBDA2777E65D6FE4FB3F3B0',
    );
    expect(sha('styles/evironn/OrderPrimitives.css')).toBe(
      '9ED39EF6E17637F8C02E14BFFDFD65C300E9DCCA66B39DCE12A3CC5AD498CE6A',
    );
  });
});

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const sha = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
describe('order assets', () => {
  it('keeps exact clone CSS', () => {
    expect(sha('styles/evironn/OrderVariantA.css')).toBe(
      '86EC6B153D735D05C1AA9F6E89E56FD20E4179CFE6F8D445624B065E8933927D',
    );
    expect(sha('styles/evironn/OrderPrimitives.css')).toBe(
      '2B9B742C16BE4F51E57D823132AAC14D27E1FD2DCCDAED7D1586F4BC807209A1',
    );
  });
});

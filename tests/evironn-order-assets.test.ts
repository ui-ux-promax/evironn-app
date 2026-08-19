import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const sha = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
describe('order assets', () => {
  it('keeps exact clone CSS', () => {
    expect(sha('styles/evironn/OrderVariantA.css')).toBe(
      '43BF4A4887E384FF0AF2D262FC4DC2426C86392FAA415D563C56A44BFACFC82E',
    );
    expect(sha('styles/evironn/OrderPrimitives.css')).toBe(
      '2B9B742C16BE4F51E57D823132AAC14D27E1FD2DCCDAED7D1586F4BC807209A1',
    );
  });
});

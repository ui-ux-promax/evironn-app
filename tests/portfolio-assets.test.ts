import { statSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps the white tee catalog image within the web asset budget', () => {
  const asset = statSync('public/products/product-white-tee.png');

  expect(asset.size).toBeLessThanOrEqual(1_500_000);
});

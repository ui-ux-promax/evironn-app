import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('links the storefront to the public demo admin', () => {
  const source = readFileSync('components/shared/site-footer.tsx', 'utf8');

  expect(source).toContain("href: '/demo-admin'");
});

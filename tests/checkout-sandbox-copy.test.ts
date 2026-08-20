import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('labels online checkout as sandbox-only in portfolio demo mode', () => {
  const source = readFileSync('components/shared/checkout/checkout-form.tsx', 'utf8');

  expect(source).toContain('NEXT_PUBLIC_DEMO_MODE');
  expect(source).toContain('Тестовая оплата');
  expect(source).toContain('Деньги не списываются');
});

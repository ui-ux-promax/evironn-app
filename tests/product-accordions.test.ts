import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('product characteristics accordion', () => {
  it('renders admin-managed specifications directly after the description', () => {
    const source = readFileSync('components/shared/product/product-accordions.tsx', 'utf8');

    expect(source).toContain('specs: Record<string, string> | null');
    expect(source).toContain('<span>Характеристики</span>');
    expect(source).toContain('Object.entries(specs)');
  });
});

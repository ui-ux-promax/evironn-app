import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('product characteristics accordion', () => {
  it('renders admin-managed specifications directly after the description', () => {
    const source = readFileSync('components/shared/product/product-accordions.tsx', 'utf8');

    expect(source).toContain('specs: Record<string, string> | null');
    expect(source).toContain('<span>Характеристики</span>');
    expect(source).toContain('Object.entries(specs)');
  });

  it('passes specifications from the product page into the purchase panel', () => {
    const pageSource = readFileSync('app/(shop)/product/[slug]/page.tsx', 'utf8');
    const viewSource = readFileSync('components/shared/product/product-view.tsx', 'utf8');
    const panelSource = readFileSync('components/shared/product/purchase-panel.tsx', 'utf8');

    expect(pageSource).toContain('specs,');
    expect(pageSource).toContain('category: product.category');
    expect(viewSource).toContain('specs={product.specs}');
    expect(panelSource).toContain('<ProductAccordions description={description} specs={specs} />');
  });
});

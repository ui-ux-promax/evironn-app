import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('OrderVariantA', () => {
  it('exports production order shell', () =>
    expect(fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8')).toContain(
      'export function OrderVariantA',
    ));

  it('preserves supported clone hierarchy and accessible tracking state', () => {
    const variant = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');
    const primitives = fs.readFileSync('components/evironn/order/order-primitives.tsx', 'utf8');
    expect(variant).toContain('<OrderMeta');
    expect(variant).toContain('<PlacedBanner');
    expect(variant).toContain('<strong>{formatPrice(order.totals.total)}</strong>');
    expect(primitives).toContain('ord-placed__mark');
    expect(primitives).toContain('ord-placed__lede');
    expect(primitives).toContain('ord-placed__next');
    expect(primitives).toContain("aria-current={index === current ? 'step' : undefined}");
    expect(primitives).toMatch(/<header>\s*<h2>\{title\}<\/h2>\s*\{note && <p>\{note\}<\/p>\}\s*<\/header>/);
    expect(primitives).not.toContain('ord-panel__head');
    expect(primitives).toContain('aria-label={`Открыть ${line.name}`}');
    expect(primitives).not.toContain('new Date(order.createdAt)');
    expect(variant).toContain('<CancelOrderButton');
  });
});

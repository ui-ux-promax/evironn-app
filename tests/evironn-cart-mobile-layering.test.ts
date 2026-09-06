import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Evironn cart mobile layering', () => {
  it('keeps the checkout bar below the mobile navigation sheet', () => {
    const cartCss = readSource('styles/evironn/CartVariantA.css');
    const headerCss = readSource('styles/evironn/header.css');

    expect(cartCss).toMatch(/\.cart-a__mobile-bar\s*\{[\s\S]*?z-index:\s*199;/);
    expect(headerCss).toMatch(/#evironn-header\s*\{[\s\S]*?z-index:\s*200;/);
  });
});

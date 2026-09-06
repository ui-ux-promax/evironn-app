import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Evironn mobile commerce layering', () => {
  it('keeps fixed commerce panels below the mobile navigation sheet', () => {
    const cartCss = readSource('styles/evironn/CartVariantA.css');
    const checkoutCss = readSource('styles/evironn/CheckoutPrimitives.css');
    const cartPrimitivesCss = readSource('styles/evironn/CartPrimitives.css');
    const headerCss = readSource('styles/evironn/header.css');

    expect(cartCss).toMatch(/\.cart-a__mobile-bar\s*\{[\s\S]*?z-index:\s*199;/);
    expect(checkoutCss).toMatch(/\.chk-bar\s*\{[\s\S]*?z-index:\s*199;/);
    expect(cartPrimitivesCss).toMatch(/\.crt-undo\s*\{[\s\S]*?z-index:\s*199;/);
    expect(headerCss).toMatch(/#evironn-header\s*\{[\s\S]*?z-index:\s*200;/);
  });
});

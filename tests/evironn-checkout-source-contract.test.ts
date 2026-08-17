import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = [
  'components/evironn/checkout/checkout-variant-a.tsx',
  'components/evironn/checkout/checkout-primitives.tsx',
  'components/evironn/checkout/use-checkout-variant-a.ts',
];

const source = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

describe('Evironn Checkout Variant A source boundary', () => {
  it('ports the production shell and exact clone CSS', () => {
    for (const file of files) expect(existsSync(file), file).toBe(true);
    expect(source(files[0])).toContain("import '../../../styles/evironn/CheckoutVariantA.css'");
    expect(source(files[1])).toContain("import '../../../styles/evironn/CheckoutPrimitives.css'");
    expect(source(files[0])).toContain('chk-a__grid');
    expect(source(files[1])).toContain('chk-receive');
  });

  it('uses production DTOs/actions and contains no clone mocks or client money math', () => {
    const production = files.map(source).join('\n');
    expect(production).toContain('CheckoutPageDto');
    expect(production).toContain('getCheckoutQuote');
    expect(production).toContain('placeOrder');
    expect(production).toContain('useCartStore');
    expect(production).toContain('quoteRevisionRef');
    expect(production).not.toMatch(/useCheckout\(|checkoutState|useCart\(|cartState|PAY_MS|setTimeout|CardFields/);
    expect(production).not.toMatch(/Math\.floor|FREE_\w*SHIPPING|SHIP_COST|ASSEMBLY_PRICE|OLD_AWAY_PRICE|carryPrice/);
  });

  it('keeps route owner-only and cart-only', () => {
    const page = source('app/(shop)/checkout/page.tsx');
    expect(page).toContain('auth()');
    expect(page).toContain("redirect('/login?callbackUrl=%2Fcheckout')");
    expect(page).toContain("redirect('/cart')");
    expect(page).toContain('getCheckoutPageDto');
    expect(page).toContain('<CheckoutVariantA initialData={checkout} />');
    expect(page).not.toContain('buyNow');
    expect(page).not.toContain('CheckoutForm');
  });

  it('renders distinct pending and blocked payment initialization states', () => {
    const production = files.map(source).join('\n');
    expect(production).toContain('PAYMENT_INITIALIZATION_PENDING');
    expect(production).toContain('PAYMENT_INITIALIZATION_BLOCKED');
    expect(production).toContain('submitLocked');
    expect(production).toContain('continuePaymentUrl');
    expect(production).toContain('allowedActions');
  });

  it('removes the inherited checkout form after replacement', () => {
    expect(existsSync('components/shared/checkout/checkout-form.tsx')).toBe(false);
  });
});

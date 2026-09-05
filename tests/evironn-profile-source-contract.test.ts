import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const component = readFileSync('components/evironn/profile/profile-variant-a.tsx', 'utf8');
const controller = readFileSync('components/evironn/profile/use-profile-variant-a.ts', 'utf8');
const route = readFileSync('app/(shop)/profile/page.tsx', 'utf8');
const css = readFileSync('styles/evironn/ProfilePage.css', 'utf8');

describe('production profile Variant A source contract', () => {
  it('keeps the clone shell/classes and exact supported sections', () => {
    expect(component).toMatch(/className="prf prf--a"/);
    for (const className of [
      'prf__head',
      'prf__identity',
      'prf__shell',
      'prf__nav',
      'prf__nav-indicator',
      'prf__content',
      'prf__loyalty',
      'prf__active-order',
      'prf__quick',
      'ord-track',
      'prf__orders',
      'prf__favorites',
      'prf__form-grid',
      'prf__subsection',
      'prf__address-list',
    ]) {
      expect(component).toContain(className);
    }
    expect(component).toMatch(/overview|orders|favorites|profile|addresses/);
    expect(component).not.toMatch(/\b(?:payment|bonuses|notifications|saved cards)\b/i);
    expect(component).not.toMatch(/onClick={[^}]+(tracking|reorder|receipt|cancel)/i);
  });

  it('uses production DTO/actions and real Auth.js/cart boundaries', () => {
    expect(route).toContain('auth()');
    expect(route).toContain('getProfilePageDto');
    expect(route).not.toContain('profile-view');
    for (const symbol of [
      'updateProfile',
      'updatePassword',
      'addAddress',
      'deleteAddress',
      'setDefaultAddress',
      'toggleWishlist',
    ]) {
      expect(controller).toContain(symbol);
    }
    expect(controller).toContain('signOut');
    expect(controller).toContain('addCartItem');
    expect(component).toContain('primarySkuId');
    expect(component).toContain('readOnly');
    expect(component).toContain('CatalogCard');
  });

  it('keeps profile favorite removal under one pending owner', () => {
    expect(component).toContain('wishlisted={!removePending}');
    expect(component).toContain('wishlistPending={removePending}');
    expect(component).toContain(
      'wishlistAriaLabel={removePending ? `Убрать ${product.name} из избранного` : undefined}',
    );
    expect(component).toContain('disabled={removePending}');
    expect(component).toContain('aria-busy={removePending || undefined}');
    expect(component).not.toMatch(/removePending\s*\?\s*<FadeArc/);
    expect(controller).toContain('favorite:${productId}:remove');
  });

  it('keeps exact responsive profile CSS and mobile navigation indicator', () => {
    expect(css).toContain('.prf');
    expect(css).toContain('.prf__nav-indicator');
    expect(css).toMatch(/overflow-x:\s*auto/);
    expect(css).toMatch(/@media \(max-width: 580px\)/);
    expect(css).toMatch(/\.prf__favorites[\s\S]*grid-template-columns/);
    expect(createHash('sha256').update(css).digest('hex')).toBe(
      '3c506c471ced075908c7103af5b56d9e9266d4afbc72dffc213caed960a84460',
    );
  });

  it('adds separation above the password submit button', () => {
    expect(css).toMatch(/\.prf__subsection form > \.chk-submit\s*\{[\s\S]*margin-top:\s*16px;/);
  });
});

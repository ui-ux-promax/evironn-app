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
      'prf__active-order',
      'prf__quick',
      'prf__orders',
      'prf__favorites',
      'prf__form-grid',
      'prf__subsection',
      'prf__address-list',
    ]) {
      expect(component).toContain(className);
    }
    expect(component).toMatch(/overview|orders|favorites|profile|addresses/);
    expect(component).not.toMatch(/payment|bonuses|notifications|loyalty|bonus|saved cards/i);
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

  it('keeps exact responsive profile CSS and mobile navigation indicator', () => {
    expect(css).toContain('.prf');
    expect(css).toContain('.prf__nav-indicator');
    expect(css).toMatch(/overflow-x:\s*auto/);
    expect(css).toMatch(/@media \(max-width: 580px\)/);
    expect(css).toMatch(/\.prf__favorites[\s\S]*grid-template-columns/);
    expect(createHash('sha256').update(css).digest('hex')).toBe(
      'e55a53ded3f4fd65dfc341470a0f686e8b3b9a4402d26a21ba9ae298a713ea10',
    );
  });
});

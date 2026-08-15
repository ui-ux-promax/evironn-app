import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const paths = [
  'components/evironn/cart/cart-primitives.tsx',
  'components/evironn/cart/cart-variant-a.tsx',
  'components/evironn/cart/use-cart-variant-a.ts',
  'styles/evironn/CartPrimitives.css',
  'styles/evironn/CartVariantA.css',
];

function source(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

describe('Evironn Cart Variant A source boundary', () => {
  it('contains exact cart files and CSS imports', () => {
    for (const path of paths) expect(existsSync(path), path).toBe(true);

    expect(source(paths[0])).toContain("import '../../../styles/evironn/CartPrimitives.css'");
    expect(source(paths[1])).toContain("import '../../../styles/evironn/CartVariantA.css'");
    expect(source(paths[0])).toMatch(
      /export function (Steps|QtyStepper|PromoField|SummaryRows|UndoBar|EmptyCart|SupportLink)/,
    );
    expect(source(paths[1])).toContain('cart-a__grid');
  });

  it('uses production cart state and forbids clone controllers and client checkout math', () => {
    const production = paths.map(source).join('\n');
    expect(production).toContain('useCartStore');
    expect(production).toContain('addToWishlist');
    expect(production).toContain('validateCoupon');
    expect(production).not.toMatch(/useCart\(|from ['"][^'"]*useCart|cartState|CATALOG_PRODUCTS|PROMO_CODES/);
    expect(production).not.toMatch(
      /DeliveryPicker|PaymentRow|FREE_\w*SHIPPING|SHIP_COST|DELIVERY_OPTIONS|PAYMENT_METHODS/,
    );
    expect(production).not.toContain('productVariantId');
    expect(production).not.toMatch(/href\s*=\s*["']\/checkout|href=\{[^}]*checkout/);
    expect(production).not.toMatch(/Math\.(round|floor|ceil)\([^)]*percent|shipping|deliveryCost/);
  });

  it('exposes canonical props/actions and server snapshot summary fields', () => {
    const variant = source('components/evironn/cart/cart-variant-a.tsx');
    const hook = source('components/evironn/cart/use-cart-variant-a.ts');
    expect(variant).toContain('related: CatalogBCard[]');
    expect(variant).toContain('initialWishlistedIds: string[]');
    for (const method of [
      'step',
      'remove',
      'clear',
      'undo',
      'saveToWishlist',
      'addRelated',
      'applyCoupon',
      'clearCoupon',
    ])
      expect(hook).toContain(`${method}`);
    const presentation = `${variant}\n${source(paths[0])}`;
    for (const field of ['compareAtSubtotal', 'saleDiscount', 'couponDiscount', 'total'])
      expect(presentation).toContain(field);
    expect(variant).toContain('aria-disabled');
    expect(variant).toContain('Оформление заказа будет доступно на следующем этапе.');
    expect(variant).not.toContain('role="radiogroup"');
    expect(variant).toContain('aria-label={`Добавить ${product.name} в корзину`}');
    expect(`${variant}\n${readFileSync('app/(shop)/cart/page.tsx', 'utf8')}`).toContain('relatedProductHref');
  });

  it('builds related cards from canonical furniture data', () => {
    const page = readFileSync('app/(shop)/cart/page.tsx', 'utf8');
    expect(page).toContain('furnitureProductCardInclude');
    expect(page).toContain('buildFurnitureProductCardData');
    expect(page).toContain('buildCatalogBCard');
    expect(`${page}\n${source('components/evironn/cart/cart-variant-a.tsx')}`).toContain('primarySkuId');
  });
});

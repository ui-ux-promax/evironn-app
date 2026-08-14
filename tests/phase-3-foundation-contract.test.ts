import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('Phase 3 foundation boundary', () => {
  it('keeps canonical SKU, cart, and order relations in the Prisma schema', () => {
    const schema = read('prisma/schema.prisma');

    expect(schema).toMatch(/model Sku\s*\{[\s\S]*?cartItems\s+CartItem\[\][\s\S]*?orderItems\s+OrderItem\[\]/);
    expect(schema).toMatch(/model CartItem\s*\{[\s\S]*?skuId\s+String\?[\s\S]*?sku\s+Sku\?/);
    expect(schema).toMatch(/model OrderItem\s*\{[\s\S]*?skuId\s+String\?[\s\S]*?canonicalSku\s+Sku\?/);
    expect(schema).toContain('@@unique([cartId, skuId])');
    expect(schema).toContain('skuArticleNumber  String?');
    expect(schema).toContain('skuCombinationKey String?');
  });

  it('keeps Auth.js role propagation and safe callback boundaries', () => {
    const authConfig = read('auth.config.ts');
    const auth = read('auth.ts');
    const safeRedirect = read('lib/safe-redirect.ts');
    const authAction = read('app/actions/auth.ts');

    expect(authConfig).toContain("type Role = 'CUSTOMER' | 'ADMIN';");
    expect(authConfig).toContain('token.role');
    expect(authConfig).toContain('session.user.role');
    expect(auth).toContain("from 'next-auth'");
    expect(safeRedirect).toContain('export function safeCallbackUrl');
    expect(authAction).toContain("import('@/lib/safe-redirect')");
    expect(authAction).toContain('safeCallbackUrl(callbackUrl)');
  });

  it('merges guest cart and wishlist during the Auth.js sign-in event', () => {
    const auth = read('auth.ts');

    expect(auth).toContain("import('@/lib/cart-merge')");
    expect(auth).toContain('safeMergeGuestCart(guestToken, user.id)');
    expect(auth).toContain("import('@/lib/wishlist-merge')");
    expect(auth).toContain('safeMergeGuestWishlist(guestWishlistToken, user.id)');
  });

  it('contains no clone or technical-source absolute imports in production code', () => {
    const productionFiles = [
      ...['app', 'components', 'lib', 'services'].flatMap((directory) =>
        execFileSync('rg', ['--files', directory], { cwd: root, encoding: 'utf8' })
          .trim()
          .split(/\r?\n/)
          .filter(Boolean),
      ),
      'auth.ts',
      'auth.config.ts',
      'middleware.ts',
    ];
    const forbidden = /D:\\Projects\\fashion-shop|D:\\Новая папка \(2\)\\evironn-clone|fashion-shop|evironn-clone/iu;

    for (const file of productionFiles) {
      const source = read(file);
      for (const line of source.split(/\r?\n/)) {
        if (/\bfrom\s+['"]/.test(line)) expect(line).not.toMatch(forbidden);
      }
    }
  });

  it('uses read-only HTTP keep-warm and disposable database environment keys', () => {
    const globalSetup = read('e2e/global-setup.ts');
    const envExample = read('.env.example');

    expect(globalSetup).not.toContain("from '@neondatabase/serverless'");
    expect(globalSetup).not.toMatch(/\bneon\s*\(/i);
    expect(globalSetup).not.toMatch(/\bctx\.post\b|\bctx\.put\b|\bctx\.patch\b|\bctx\.delete\b/);
    expect(globalSetup).toContain("'/api/cart'");
    expect(globalSetup).toContain("'/api/wishlist/count'");
    expect(globalSetup).toContain("'/product/noma-woven-lounge'");
    expect(globalSetup).toContain('setInterval');
    expect(globalSetup).toContain('15_000');
    expect(globalSetup).toContain('clearInterval');
    expect(globalSetup).toContain('ctx.dispose');
    expect(envExample).toMatch(/^E2E_DATABASE_URL=""$/m);
    expect(envExample).toMatch(/^E2E_DATABASE_URL_UNPOOLED=""$/m);
    expect(envExample).toMatch(/^E2E_DATABASE_ALLOW_WRITES=""$/m);
  });
});

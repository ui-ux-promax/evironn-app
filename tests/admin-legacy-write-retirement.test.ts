import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const adminActionRoot = resolve(root, 'app/actions/admin');
const adminRouteRoot = resolve(root, 'app/(admin)');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function relative(path: string): string {
  return path.slice(root.length + 1).replaceAll('\\', '/');
}

describe('legacy admin-write retirement', () => {
  it('allows exactly one named legacy stock-restoration write site in the cancellation server module', () => {
    const mutationPattern =
      /\b(?:prisma|txn|transaction)\.(productColorway|productImage|productVariant)\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/g;
    const mutations = [...sourceFiles(adminActionRoot), ...sourceFiles(adminRouteRoot)].flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return [...source.matchAll(mutationPattern)].map((match) => ({
        path: relative(path),
        model: match[1],
        operation: match[2],
      }));
    });

    expect(mutations).toEqual([]);

    const cancellationMutations = [
      ...readFileSync(resolve(root, 'lib/admin/order-cancellation.server.ts'), 'utf8').matchAll(mutationPattern),
    ].map((match) => ({ path: 'lib/admin/order-cancellation.server.ts', model: match[1], operation: match[2] }));
    expect(cancellationMutations).toEqual([
      { path: 'lib/admin/order-cancellation.server.ts', model: 'productVariant', operation: 'update' },
    ]);

    const orders = readFileSync(resolve(root, 'app/actions/admin/orders.ts'), 'utf8');
    expect(orders).not.toMatch(/productVariant\.(?:create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/);

    const cancellation = readFileSync(resolve(root, 'lib/admin/order-cancellation.server.ts'), 'utf8');
    expect(cancellation).toContain('await transaction.productVariant.update({');
    expect(cancellation).toContain('data: { stock: { increment: item.quantity } },');
  });

  it('removes the admin productSchema path and retired clothing components', () => {
    const productsAction = readFileSync(resolve(root, 'app/actions/admin/products.ts'), 'utf8');
    const productDto = readFileSync(resolve(root, 'services/dto/product.dto.ts'), 'utf8');

    expect(productsAction).not.toMatch(/\bproductSchema\b|\bProductValues\b/);
    expect(productDto).not.toMatch(/\bproductSchema\b|\bProductValues\b/);
    expect(existsSync(resolve(root, 'app/(admin)/admin/catalog/products/_components/variant-matrix.tsx'))).toBe(false);
    expect(existsSync(resolve(root, 'app/(admin)/admin/catalog/products/_components/colorway-card.tsx'))).toBe(false);
  });

  it('keeps compatibility read paths present', () => {
    const readPaths = [
      'lib/admin/analytics.ts',
      'app/actions/admin/orders.ts',
      'app/actions/order.ts',
      'lib/payment-sync.ts',
      'lib/cart-merge.ts',
      'lib/checkout-page.ts',
      'lib/order.ts',
      'lib/review.ts',
    ];

    for (const path of readPaths) {
      expect(statSync(resolve(root, path)).isFile(), path).toBe(true);
    }
  });
});

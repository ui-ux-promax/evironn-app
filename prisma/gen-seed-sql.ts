// Генератор seed-SQL из seed-data.ts (для вставки в Neon SQL Editor preview-ветки).
// НЕ трогает БД — читает данные и печатает SQL в stdout. Запуск:
//   npx ts-node --compiler-options {"module":"CommonJS"} prisma/gen-seed-sql.ts > seed-preview.sql
import { categories, products } from './seed-data';
import { productDenormFromColorways } from '../lib/product-aggregates';
import { CLOTHING_SIZE_ORDER } from '../constants/config';

const q = (s: string | null | undefined) => (s == null ? 'NULL' : `'${s.replace(/'/g, "''")}'`);
const j = (o: unknown) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;

export function generateSeedSql() {
  const out: string[] = [];
  out.push('BEGIN;');
  out.push(
    'TRUNCATE TABLE "CartItem","Cart","ProductImage","ProductVariant","ProductColorway","Product","Category" RESTART IDENTITY CASCADE;',
  );

  // Categories
  for (const c of categories) {
    out.push(
      `INSERT INTO "Category" (id,name,slug,tagline,"sortOrder") VALUES ('cat_${c.slug}',${q(c.name)},${q(c.slug)},${q(c.tagline)},${c.sortOrder});`,
    );
  }

  for (const p of products) {
    const pid = `prod_${p.slug}`;
    const denorm = productDenormFromColorways(p.colorways);
    out.push(
      `INSERT INTO "Product" (id,name,slug,brand,gender,"categoryId",description,"fitNote",specs,"isBestseller",active,"sortOrder","salesCount","minPrice","discountPct","createdAt") ` +
        `VALUES (${q(pid)},${q(p.name)},${q(p.slug)},${q(p.brand)},'${p.gender}','cat_${p.categorySlug}',${q(p.description)},${q(p.fitNote)},${j(p.specs)},${p.isBestseller},true,${p.sortOrder},0,${denorm.minPrice},${denorm.discountPct},now());`,
    );
    for (const cw of p.colorways) {
      const cwid = `cw_${p.slug}__${cw.slug}`;
      out.push(
        `INSERT INTO "ProductColorway" (id,"productId",name,slug,"swatchHex","isDefault","sortOrder") ` +
          `VALUES (${q(cwid)},${q(pid)},${q(cw.name)},${q(cw.slug)},${q(cw.swatchHex)},${cw.isDefault},${cw.sortOrder});`,
      );
      for (const im of cw.images) {
        const imid = `${p.slug}__${cw.slug}__img${im.sortOrder}`;
        out.push(
          `INSERT INTO "ProductImage" (id,"colorwayId",url,alt,"sortOrder") ` +
            `VALUES (${q(imid)},${q(cwid)},${q(im.url)},${q(im.alt)},${im.sortOrder});`,
        );
      }
      for (const v of cw.variants) {
        out.push(
          `INSERT INTO "ProductVariant" (id,"colorwayId",size,"sizeOrder",sku,price,"compareAtPrice",stock,active) ` +
            `VALUES ('var_${v.sku}',${q(cwid)},${q(v.size)},${CLOTHING_SIZE_ORDER[v.size]},${q(v.sku)},${v.price},${v.compareAtPrice == null ? 'NULL' : v.compareAtPrice},${v.stock},true);`,
        );
      }
    }
  }

  const coupons = [
    { code: 'RITM10', percent: 10, active: true, expiresAt: null },
    { code: 'WELCOME15', percent: 15, active: true, expiresAt: null },
    { code: 'EXPIRED', percent: 50, active: true, expiresAt: '2020-01-01T00:00:00.000Z' },
  ] as const;

  for (const coupon of coupons) {
    out.push(
      `INSERT INTO "Coupon" (id,code,percent,active,"expiresAt") VALUES (${q(`coupon_${coupon.code.toLowerCase()}`)},${q(coupon.code)},${coupon.percent},${coupon.active},${q(coupon.expiresAt)}) ` +
        `ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = EXCLUDED.active, "expiresAt" = EXCLUDED."expiresAt";`,
    );
  }

  out.push('COMMIT;');
  return out.join('\n');
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  console.log(generateSeedSql());
}

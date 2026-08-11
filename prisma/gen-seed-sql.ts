import { furnitureCategories, furnitureProducts, rooms, coupons } from './seed-data';

const q = (value: string | null | undefined) => (value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`);
const j = (value: unknown) => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
const idFor = (...parts: string[]) => parts.join('__');
const naturalId = (table: string, column: string, value: string) =>
  `(SELECT id FROM "${table}" WHERE "${column}" = ${q(value)})`;
const optionValueNaturalId = (groupSlug: string, valueSlug: string) =>
  `(SELECT id FROM "OptionValue" WHERE "optionGroupId" = ${naturalId('OptionGroup', 'slug', groupSlug)} AND "slug" = ${q(valueSlug)})`;

export function generateSeedSql() {
  const out: string[] = ['BEGIN;'];

  for (const room of rooms) {
    out.push(
      `INSERT INTO "Room" (id,name,slug,"sortOrder") VALUES (${q(`room_${room.slug}`)},${q(room.name)},${q(room.slug)},${room.sortOrder}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "sortOrder" = EXCLUDED."sortOrder";`,
    );
  }
  for (const category of furnitureCategories) {
    out.push(
      `INSERT INTO "Category" (id,name,slug,tagline,"sortOrder") VALUES (${q(`cat_${category.slug}`)},${q(category.name)},${q(category.slug)},${q(category.tagline)},${category.sortOrder}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, tagline = EXCLUDED.tagline, "sortOrder" = EXCLUDED."sortOrder";`,
    );
  }

  const optionGroupIds = new Map<string, string>();
  const optionValueIds = new Map<string, string>();
  for (const product of furnitureProducts) {
    for (const group of product.optionGroups) {
      const groupId = optionGroupIds.get(group.slug) ?? `group_${group.slug}`;
      if (!optionGroupIds.has(group.slug)) {
        optionGroupIds.set(group.slug, groupId);
        out.push(
          `INSERT INTO "OptionGroup" (id,name,slug,"sortOrder") VALUES (${q(groupId)},${q(group.name)},${q(group.slug)},${group.sortOrder}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "sortOrder" = EXCLUDED."sortOrder";`,
        );
      }
      for (const value of group.values) {
        const valueId = `value_${group.slug}_${value.slug}`;
        if (!optionValueIds.has(`${group.slug}:${value.slug}`)) {
          optionValueIds.set(`${group.slug}:${value.slug}`, valueId);
          out.push(
            `INSERT INTO "OptionValue" (id,"optionGroupId",name,slug,"swatchHex","sortOrder") VALUES (${q(valueId)},${naturalId('OptionGroup', 'slug', group.slug)},${q(value.name)},${q(value.slug)},${q(value.swatchHex)},${value.sortOrder}) ON CONFLICT ("optionGroupId",slug) DO UPDATE SET name = EXCLUDED.name, "swatchHex" = EXCLUDED."swatchHex", "sortOrder" = EXCLUDED."sortOrder";`,
          );
        }
      }
    }
  }

  for (const product of furnitureProducts) {
    const productId = `prod_${product.slug}`;
    const minPrice = Math.min(...product.skus.map((sku) => sku.price));
    const discountPct = Math.max(
      ...product.skus.map((sku) =>
        sku.oldPrice && sku.oldPrice > sku.price ? Math.round(((sku.oldPrice - sku.price) / sku.oldPrice) * 100) : 0,
      ),
    );
    out.push(
      `INSERT INTO "Product" (id,name,slug,brand,"categoryId",description,specs,"isBestseller",active,"sortOrder","minPrice","discountPct") VALUES (${q(productId)},${q(product.name)},${q(product.slug)},'Evironn',${naturalId('Category', 'slug', product.categorySlug)},${q(product.description)},${j(product.specs)},${product.isBestseller},true,${product.sortOrder},${minPrice},${discountPct}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, brand = EXCLUDED.brand, "categoryId" = EXCLUDED."categoryId", description = EXCLUDED.description, specs = EXCLUDED.specs, "isBestseller" = EXCLUDED."isBestseller", active = EXCLUDED.active, "sortOrder" = EXCLUDED."sortOrder", "minPrice" = EXCLUDED."minPrice", "discountPct" = EXCLUDED."discountPct";`,
    );
    for (const roomSlug of product.roomSlugs) {
      out.push(
        `INSERT INTO "ProductRoom" ("productId","roomId") VALUES (${naturalId('Product', 'slug', product.slug)},${naturalId('Room', 'slug', roomSlug)}) ON CONFLICT DO NOTHING;`,
      );
    }
    for (const group of product.optionGroups) {
      out.push(
        `INSERT INTO "ProductOptionGroup" ("productId","optionGroupId") VALUES (${naturalId('Product', 'slug', product.slug)},${naturalId('OptionGroup', 'slug', group.slug)}) ON CONFLICT DO NOTHING;`,
      );
      for (const value of group.values) {
        out.push(
          `INSERT INTO "ProductOptionValue" ("productId","optionGroupId","optionValueId") VALUES (${naturalId('Product', 'slug', product.slug)},${naturalId('OptionGroup', 'slug', group.slug)},${optionValueNaturalId(group.slug, value.slug)}) ON CONFLICT DO NOTHING;`,
        );
      }
    }
    for (const media of product.media) {
      out.push(
        `INSERT INTO "ProductMedia" (id,"productId",kind,url,alt,"sortOrder") VALUES (${q(idFor('media', product.slug, media.kind, String(media.sortOrder)))},${naturalId('Product', 'slug', product.slug)},'${media.kind}',${q(media.url)},${q(media.alt)},${media.sortOrder}) ON CONFLICT (id) DO UPDATE SET "productId" = EXCLUDED."productId", kind = EXCLUDED.kind, url = EXCLUDED.url, alt = EXCLUDED.alt, "sortOrder" = EXCLUDED."sortOrder";`,
      );
    }
    for (const sku of product.skus) {
      const skuId = `sku_${sku.articleNumber}`;
      out.push(
        `INSERT INTO "Sku" (id,"productId","combinationKey","articleNumber",price,"oldPrice",stock,active) VALUES (${q(skuId)},${naturalId('Product', 'slug', product.slug)},${q(sku.combinationKey)},${q(sku.articleNumber)},${sku.price},${sku.oldPrice ?? 'NULL'},${sku.stock},${sku.active}) ON CONFLICT ("articleNumber") DO UPDATE SET "productId" = EXCLUDED."productId", "combinationKey" = EXCLUDED."combinationKey", price = EXCLUDED.price, "oldPrice" = EXCLUDED."oldPrice", stock = EXCLUDED.stock, active = EXCLUDED.active;`,
      );
      for (const selected of sku.selectedOptions) {
        out.push(
          `INSERT INTO "SkuOptionValue" ("skuId","optionGroupId","optionValueId") VALUES (${naturalId('Sku', 'articleNumber', sku.articleNumber)},${naturalId('OptionGroup', 'slug', selected.groupSlug)},${optionValueNaturalId(selected.groupSlug, selected.valueSlug)}) ON CONFLICT ("skuId","optionGroupId") DO UPDATE SET "optionValueId" = EXCLUDED."optionValueId";`,
        );
      }
    }
  }

  for (const category of furnitureCategories) {
    if (category.turntableProductSlug)
      out.push(
        `UPDATE "Category" SET "turntableProductId" = ${naturalId('Product', 'slug', category.turntableProductSlug)} WHERE slug = ${q(category.slug)};`,
      );
  }
  for (const coupon of coupons) {
    out.push(
      `INSERT INTO "Coupon" (id,code,percent,active,"expiresAt") VALUES (${q(`coupon_${coupon.code.toLowerCase()}`)},${q(coupon.code)},${coupon.percent},${coupon.active},${q(coupon.expiresAt)}) ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = EXCLUDED.active, "expiresAt" = EXCLUDED."expiresAt";`,
    );
  }
  out.push('COMMIT;');
  return out.join('\n');
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  console.log(generateSeedSql());
}

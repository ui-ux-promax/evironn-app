import { furnitureCategories, furnitureProducts, rooms, coupons } from './seed-data';

const q = (value: string | null | undefined) => (value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`);
const j = (value: unknown) => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
const idFor = (...parts: string[]) => parts.join('__');

export function generateSeedSql() {
  const out: string[] = ['BEGIN;'];
  out.push(
    'TRUNCATE TABLE "CartItem","ProductMedia","SkuMedia","SkuOptionValue","ProductOptionValue","ProductOptionGroup","ProductRoom","Sku","Product","OptionValue","OptionGroup","Room","Category" RESTART IDENTITY CASCADE;',
  );

  for (const room of rooms) {
    out.push(
      `INSERT INTO "Room" (id,name,slug,"sortOrder") VALUES (${q(`room_${room.slug}`)},${q(room.name)},${q(room.slug)},${room.sortOrder});`,
    );
  }
  for (const category of furnitureCategories) {
    out.push(
      `INSERT INTO "Category" (id,name,slug,tagline,"sortOrder") VALUES (${q(`cat_${category.slug}`)},${q(category.name)},${q(category.slug)},${q(category.tagline)},${category.sortOrder});`,
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
          `INSERT INTO "OptionGroup" (id,name,slug,"sortOrder") VALUES (${q(groupId)},${q(group.name)},${q(group.slug)},${group.sortOrder});`,
        );
      }
      for (const value of group.values) {
        const valueId = `value_${group.slug}_${value.slug}`;
        if (!optionValueIds.has(`${group.slug}:${value.slug}`)) {
          optionValueIds.set(`${group.slug}:${value.slug}`, valueId);
          out.push(
            `INSERT INTO "OptionValue" (id,"optionGroupId",name,slug,"swatchHex","sortOrder") VALUES (${q(valueId)},${q(groupId)},${q(value.name)},${q(value.slug)},${q(value.swatchHex)},${value.sortOrder});`,
          );
        }
      }
    }
  }

  for (const product of furnitureProducts) {
    const productId = `prod_${product.slug}`;
    const categoryId = `cat_${product.categorySlug}`;
    const minPrice = Math.min(...product.skus.map((sku) => sku.price));
    out.push(
      `INSERT INTO "Product" (id,name,slug,brand,"categoryId",description,specs,"isBestseller",active,"sortOrder","minPrice") VALUES (${q(productId)},${q(product.name)},${q(product.slug)},'Evironn',${q(categoryId)},${q(product.description)},${j(product.specs)},${product.isBestseller},true,${product.sortOrder},${minPrice});`,
    );
    for (const roomSlug of product.roomSlugs) {
      out.push(`INSERT INTO "ProductRoom" ("productId","roomId") VALUES (${q(productId)},${q(`room_${roomSlug}`)});`);
    }
    for (const group of product.optionGroups) {
      out.push(
        `INSERT INTO "ProductOptionGroup" ("productId","optionGroupId") VALUES (${q(productId)},${q(optionGroupIds.get(group.slug)!)});`,
      );
      for (const value of group.values) {
        out.push(
          `INSERT INTO "ProductOptionValue" ("productId","optionGroupId","optionValueId") VALUES (${q(productId)},${q(optionGroupIds.get(group.slug)!)},${q(optionValueIds.get(`${group.slug}:${value.slug}`)!)});`,
        );
      }
    }
    for (const media of product.media) {
      out.push(
        `INSERT INTO "ProductMedia" (id,"productId",kind,url,alt,"sortOrder") VALUES (${q(idFor('media', product.slug, media.kind, String(media.sortOrder)))},${q(productId)},'${media.kind}',${q(media.url)},${q(media.alt)},${media.sortOrder});`,
      );
    }
    for (const sku of product.skus) {
      const skuId = `sku_${sku.articleNumber}`;
      out.push(
        `INSERT INTO "Sku" (id,"productId","combinationKey","articleNumber",price,"oldPrice",stock,active) VALUES (${q(skuId)},${q(productId)},${q(sku.combinationKey)},${q(sku.articleNumber)},${sku.price},${sku.oldPrice ?? 'NULL'},${sku.stock},${sku.active});`,
      );
      for (const selected of sku.selectedOptions) {
        out.push(
          `INSERT INTO "SkuOptionValue" ("skuId","optionGroupId","optionValueId") VALUES (${q(skuId)},${q(optionGroupIds.get(selected.groupSlug)!)},${q(optionValueIds.get(`${selected.groupSlug}:${selected.valueSlug}`)!)});`,
        );
      }
    }
  }

  for (const category of furnitureCategories) {
    if (category.turntableProductSlug)
      out.push(
        `UPDATE "Category" SET "turntableProductId" = ${q(`prod_${category.turntableProductSlug}`)} WHERE slug = ${q(category.slug)};`,
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

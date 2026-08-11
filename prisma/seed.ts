import { prisma } from '../lib/prisma-client';
import { furnitureCategories, furnitureProducts, rooms, coupons } from './seed-data';
import { upsertAdmin } from './seed-admin';

const idFor = (...parts: string[]) => parts.join('__');

function discountPercent(price: number, oldPrice: number | null): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

async function up() {
  const roomIdBySlug = new Map<string, string>();
  for (const room of rooms) {
    const created = await prisma.room.upsert({
      where: { slug: room.slug },
      create: room,
      update: { name: room.name, sortOrder: room.sortOrder },
    });
    roomIdBySlug.set(room.slug, created.id);
  }

  const categoryIdBySlug = new Map<string, string>();
  for (const category of furnitureCategories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        tagline: category.tagline,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        tagline: category.tagline,
        sortOrder: category.sortOrder,
        turntableProductId: null,
      },
    });
    categoryIdBySlug.set(category.slug, created.id);
  }

  const optionValueIdByKey = new Map<string, string>();
  for (const item of furnitureProducts) {
    const categoryId = categoryIdBySlug.get(item.categorySlug);
    if (!categoryId) throw new Error(`Category not found: ${item.categorySlug}`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        name: item.name,
        slug: item.slug,
        brand: 'Evironn',
        categoryId,
        description: item.description,
        specs: item.specs,
        isBestseller: item.isBestseller,
        sortOrder: item.sortOrder,
        minPrice: Math.min(...item.skus.map((sku) => sku.price)),
        discountPct: Math.max(...item.skus.map((sku) => discountPercent(sku.price, sku.oldPrice))),
      },
      update: {
        name: item.name,
        brand: 'Evironn',
        categoryId,
        description: item.description,
        specs: item.specs,
        isBestseller: item.isBestseller,
        active: true,
        sortOrder: item.sortOrder,
        minPrice: Math.min(...item.skus.map((sku) => sku.price)),
        discountPct: Math.max(...item.skus.map((sku) => discountPercent(sku.price, sku.oldPrice))),
      },
    });

    for (const roomSlug of item.roomSlugs) {
      const roomId = roomIdBySlug.get(roomSlug);
      if (!roomId) throw new Error(`Room not found: ${roomSlug}`);
      await prisma.productRoom.upsert({
        where: { productId_roomId: { productId: product.id, roomId } },
        create: { productId: product.id, roomId },
        update: {},
      });
    }

    for (const group of item.optionGroups) {
      const optionGroup = await prisma.optionGroup.upsert({
        where: { slug: group.slug },
        create: { name: group.name, slug: group.slug, sortOrder: group.sortOrder },
        update: { name: group.name, sortOrder: group.sortOrder },
      });
      await prisma.productOptionGroup.upsert({
        where: { productId_optionGroupId: { productId: product.id, optionGroupId: optionGroup.id } },
        create: { productId: product.id, optionGroupId: optionGroup.id },
        update: {},
      });

      for (const value of group.values) {
        const optionValue = await prisma.optionValue.upsert({
          where: { optionGroupId_slug: { optionGroupId: optionGroup.id, slug: value.slug } },
          create: {
            optionGroupId: optionGroup.id,
            name: value.name,
            slug: value.slug,
            swatchHex: value.swatchHex,
            sortOrder: value.sortOrder,
          },
          update: { name: value.name, swatchHex: value.swatchHex, sortOrder: value.sortOrder },
        });
        optionValueIdByKey.set(`${group.slug}:${value.slug}`, optionValue.id);
        await prisma.productOptionValue.upsert({
          where: {
            productId_optionGroupId_optionValueId: {
              productId: product.id,
              optionGroupId: optionGroup.id,
              optionValueId: optionValue.id,
            },
          },
          create: { productId: product.id, optionGroupId: optionGroup.id, optionValueId: optionValue.id },
          update: {},
        });
      }
    }

    for (const media of item.media) {
      await prisma.productMedia.upsert({
        where: { id: idFor('media', item.slug, media.kind, String(media.sortOrder)) },
        create: {
          id: idFor('media', item.slug, media.kind, String(media.sortOrder)),
          productId: product.id,
          kind: media.kind,
          url: media.url,
          alt: media.alt,
          sortOrder: media.sortOrder,
        },
        update: { productId: product.id, kind: media.kind, url: media.url, alt: media.alt, sortOrder: media.sortOrder },
      });
    }

    for (const itemSku of item.skus) {
      const savedSku = await prisma.sku.upsert({
        where: { articleNumber: itemSku.articleNumber },
        create: {
          productId: product.id,
          combinationKey: itemSku.combinationKey,
          articleNumber: itemSku.articleNumber,
          price: itemSku.price,
          oldPrice: itemSku.oldPrice,
          stock: itemSku.stock,
          active: itemSku.active,
        },
        update: {
          productId: product.id,
          combinationKey: itemSku.combinationKey,
          price: itemSku.price,
          oldPrice: itemSku.oldPrice,
          stock: itemSku.stock,
          active: itemSku.active,
        },
      });

      for (const selected of itemSku.selectedOptions) {
        const optionGroup = await prisma.optionGroup.findUniqueOrThrow({ where: { slug: selected.groupSlug } });
        const optionValueId = optionValueIdByKey.get(`${selected.groupSlug}:${selected.valueSlug}`);
        if (!optionValueId) throw new Error(`Option value not found: ${selected.groupSlug}/${selected.valueSlug}`);
        await prisma.skuOptionValue.upsert({
          where: { skuId_optionGroupId: { skuId: savedSku.id, optionGroupId: optionGroup.id } },
          create: { skuId: savedSku.id, optionGroupId: optionGroup.id, optionValueId },
          update: { optionValueId },
        });
      }
    }
  }

  for (const category of furnitureCategories) {
    if (!category.turntableProductSlug) continue;
    const categoryId = categoryIdBySlug.get(category.slug);
    const product = await prisma.product.findUnique({
      where: { slug: category.turntableProductSlug },
      select: { id: true },
    });
    if (!categoryId || !product) throw new Error(`Turntable product not found for category: ${category.slug}`);
    await prisma.category.update({ where: { id: categoryId }, data: { turntableProductId: product.id } });
  }

  for (const coupon of coupons) {
    await prisma.coupon.upsert({ where: { code: coupon.code }, update: coupon, create: coupon });
  }

  const reviewUsers = [
    { email: 'review-demo-1@seed.invalid', name: 'Алексей' },
    { email: 'review-demo-2@seed.invalid', name: 'Марина' },
  ];
  for (const user of reviewUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, isPortfolioFixture: true },
      create: { email: user.email, name: user.name, isPortfolioFixture: true },
    });
  }
  const reviewProduct = await prisma.product.findUnique({ where: { slug: 'noma-woven-lounge' }, select: { id: true } });
  const reviewUser = await prisma.user.findUnique({ where: { email: reviewUsers[0].email }, select: { id: true } });
  if (reviewProduct && reviewUser) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: reviewProduct.id, userId: reviewUser.id } },
      update: { rating: 5, body: 'Очень удобное кресло, ткань выглядит спокойно и дорого.' },
      create: {
        productId: reviewProduct.id,
        userId: reviewUser.id,
        rating: 5,
        body: 'Очень удобное кресло, ткань выглядит спокойно и дорого.',
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) await upsertAdmin(prisma, adminEmail, adminPassword);
}

async function main() {
  await up();
  const [categoryN, roomN, productN, groupN, valueN, skuN, mediaN] = await Promise.all([
    prisma.category.count(),
    prisma.room.count(),
    prisma.product.count(),
    prisma.optionGroup.count(),
    prisma.optionValue.count(),
    prisma.sku.count(),
    prisma.productMedia.count(),
  ]);
  console.log(
    `Seeded furniture catalog: categories=${categoryN} rooms=${roomN} products=${productN} optionGroups=${groupN} optionValues=${valueN} skus=${skuN} media=${mediaN}`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

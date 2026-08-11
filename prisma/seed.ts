import { prisma } from '../lib/prisma-client';
import { categories, coupons, products } from './seed-data';
import { productDenormFromColorways } from '../lib/product-aggregates';
import { upsertAdmin } from './seed-admin';
import { CLOTHING_SIZE_ORDER } from '../constants/config';

// Neon HTTP-Р°РґР°РїС‚РµСЂ РќР• РїРѕРґРґРµСЂР¶РёРІР°РµС‚ С‚СЂР°РЅР·Р°РєС†РёРё. РџРѕСЌС‚РѕРјСѓ РќР• РёСЃРїРѕР»СЊР·СѓРµРј createMany /
// РІР»РѕР¶РµРЅРЅС‹Рµ create / $transaction. РљР°Р¶РґР°СЏ Р·Р°РїРёСЃСЊ вЂ” РѕРґРёРЅРѕС‡РЅС‹Р№ upsert
// (`INSERT ... ON CONFLICT DO UPDATE` вЂ” РѕРґРёРЅ statement, Р±РµР· С‚СЂР°РЅР·Р°РєС†РёРё).
// Upsert РґРµР»Р°РµС‚ СЃРёРґ РР”Р•РњРџРћРўР•РќРўРќР«Рњ: retry-РѕР±С‘СЂС‚РєР° prisma-client РїСЂРё РїРѕС‚РµСЂРµ РѕС‚РІРµС‚Р°
// РЅР° С‚СЂР°РЅР·РёРµРЅС‚РЅРѕР№ РѕС€РёР±РєРµ РјРѕР¶РµС‚ РїРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РїРёСЃСЊ вЂ” СЃ upsert СЌС‚Рѕ Р±РµР·РІСЂРµРґРЅРѕ
// (РїРѕРІС‚РѕСЂ РїСЂРµРІСЂР°С‰Р°РµС‚СЃСЏ РІ UPDATE), Р±РµР· unique-violation 23505.

async function down() {
  // РћРґРёРЅ statement в†’ РѕРґРёРЅ HTTP-Р·Р°РїСЂРѕСЃ. Р§РёСЃС‚РёС‚ В«СЃРЅСЏС‚С‹РµВ» С‚РѕРІР°СЂС‹ РїРµСЂРµРґ РїРµСЂРµ-СЃРёРґРѕРј.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "CartItem","Cart","ProductImage","ProductVariant","ProductColorway","Product","Category" RESTART IDENTITY CASCADE',
  );
}

async function up() {
  const categoryIdBySlug = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, tagline: c.tagline, sortOrder: c.sortOrder },
    });
    categoryIdBySlug.set(created.slug, created.id);
  }

  for (const item of products) {
    const categoryId = categoryIdBySlug.get(item.categorySlug);
    if (!categoryId) throw new Error(`РљР°С‚РµРіРѕСЂРёСЏ РЅРµ РЅР°Р№РґРµРЅР°: ${item.categorySlug}`);

    const productData = {
      name: item.name,
      slug: item.slug,
      brand: item.brand,
      gender: item.gender,
      description: item.description,
      fitNote: item.fitNote,
      specs: item.specs,
      isBestseller: item.isBestseller,
      sortOrder: item.sortOrder,
      categoryId,
    };
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: productData,
      update: productData,
    });

    for (const cw of item.colorways) {
      const colorway = await prisma.productColorway.upsert({
        where: { productId_slug: { productId: product.id, slug: cw.slug } },
        create: {
          productId: product.id,
          name: cw.name,
          slug: cw.slug,
          swatchHex: cw.swatchHex,
          isDefault: cw.isDefault,
          sortOrder: cw.sortOrder,
        },
        update: { name: cw.name, swatchHex: cw.swatchHex, isDefault: cw.isDefault, sortOrder: cw.sortOrder },
      });

      for (const im of cw.images) {
        // РЈ ProductImage РЅРµС‚ РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ unique в†’ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹Р№ РіР»РѕР±Р°Р»СЊРЅРѕ-СѓРЅРёРєР°Р»СЊРЅС‹Р№ id.
        const imageId = `${item.slug}__${cw.slug}__img${im.sortOrder}`;
        await prisma.productImage.upsert({
          where: { id: imageId },
          create: { id: imageId, colorwayId: colorway.id, url: im.url, alt: im.alt, sortOrder: im.sortOrder },
          update: { url: im.url, alt: im.alt, sortOrder: im.sortOrder, colorwayId: colorway.id },
        });
      }

      for (const v of cw.variants) {
        const variantData = {
          colorwayId: colorway.id,
          size: v.size,
          sizeOrder: CLOTHING_SIZE_ORDER[v.size],
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? undefined,
          stock: v.stock,
          active: true,
        };
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          create: variantData,
          update: variantData,
        });
      }
    }

    // Р”РµРЅРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Рµ РєР»СЋС‡Рё СЃРѕСЂС‚РёСЂРѕРІРєРё РєР°С‚Р°Р»РѕРіР° (РјРёРЅРёРјР°Р»СЊРЅР°СЏ С†РµРЅР°/СЃРєРёРґРєР° РґРµС„РѕР»С‚РЅРѕР№ СЂР°СЃС†РІРµС‚РєРё).
    // РЎРёРґ вЂ” РµРґРёРЅСЃС‚РІРµРЅРЅС‹Р№ РїСѓС‚СЊ Р·Р°РїРёСЃРё С†РµРЅС‹, РїРѕСЌС‚РѕРјСѓ СЃС‡РёС‚Р°РµРј Р·РґРµСЃСЊ. salesCount РЅРµ С‚СЂРѕРіР°РµРј
    // (default 0; РґРІРёР¶РµС‚СЃСЏ Р·Р°РєР°Р·Р°РјРё; TRUNCATE РїСЂРё РїРµСЂРµ-СЃРёРґРµ СЃР±СЂР°СЃС‹РІР°РµС‚ РІ 0).
    const denorm = productDenormFromColorways(item.colorways);
    await prisma.product.update({
      where: { id: product.id },
      data: { minPrice: denorm.minPrice, discountPct: denorm.discountPct },
    });
  }

  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }
  console.log(`Seeded ${coupons.length} coupons`);

  // Demo-РѕС‚Р·С‹РІС‹: seed РЅРµ СЃРѕР·РґР°С‘С‚ Р·Р°РєР°Р·С‹, РїРѕСЌС‚РѕРјСѓ РїРёС€РµРј РЅР°РїСЂСЏРјСѓСЋ (verified-РіРµР№С‚ С‚РѕР»СЊРєРѕ РЅР° write-РїСѓС‚Рё
  // submitReview). Demo-СЋР·РµСЂС‹ РЅРµР°СѓС‚РµРЅС‚РёС„РёС†РёСЂСѓРµРјС‹ (passwordHash null) Рё РќР• РґРѕР»Р¶РЅС‹ Р»РёРЅРєРѕРІР°С‚СЊСЃСЏ С‡РµСЂРµР· OAuth вЂ”
  // РґРѕРјРµРЅ @seed.invalid (RFC 2606) РіР°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅРѕ РЅРµРґРѕСЃС‚Р°РІР»СЏРµРј. Р§РёСЃС‚РёРј РїРµСЂРµРґ РїРµСЂРµ-СЃРёРґРѕРј РґР»СЏ РёРґРµРјРїРѕС‚РµРЅС‚РЅРѕСЃС‚Рё.
  const demoUsers = [
    { email: 'review-demo-1@seed.invalid', name: 'РђР»РµРєСЃРµР№' },
    { email: 'review-demo-2@seed.invalid', name: 'РњР°СЂРёРЅР°' },
  ];
  await prisma.review.deleteMany({ where: { user: { email: { in: demoUsers.map((u) => u.email) } } } });
  await prisma.user.deleteMany({ where: { email: { in: demoUsers.map((u) => u.email) } } });
  const reviewUserIdByEmail = new Map<string, string>();
  for (const u of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isPortfolioFixture: true },
      create: { email: u.email, name: u.name, isPortfolioFixture: true },
    });
    reviewUserIdByEmail.set(u.email, created.id);
  }

  const demoReviews = [
    {
      slug: 'ritm-white-tee-oversize',
      email: 'review-demo-1@seed.invalid',
      rating: 5,
      body: 'Плотная ткань и свободная посадка, беру вторую футболку.',
    },
    {
      slug: 'ritm-white-tee-oversize',
      email: 'review-demo-2@seed.invalid',
      rating: 4,
      body: 'Хорошая база, размер чуть свободнее обычного.',
    },
  ];
  for (const r of demoReviews) {
    const product = await prisma.product.findUnique({ where: { slug: r.slug }, select: { id: true } });
    const reviewUserId = reviewUserIdByEmail.get(r.email);
    if (!product || !reviewUserId) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: reviewUserId } },
      update: { rating: r.rating, body: r.body },
      create: { productId: product.id, userId: reviewUserId, rating: r.rating, body: r.body },
    });
  }
  console.log(`Seeded ${demoReviews.length} reviews`);

  // --- Admin foundation (3.0): РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹Р№ ADMIN-Р°РїСЃРµСЂС‚ (РѕР±С‰Р°СЏ Р»РѕРіРёРєР° СЃ seed-admin.ts) ---
  // РќР° demo/preview-СЃРёРґРµ СѓРґРѕР±РЅРѕ Р·Р°РІРµСЃС‚Рё Р°РґРјРёРЅР° СЃСЂР°Р·Сѓ. Р”Р»СЏ РїСЂРѕРґ-Р±СѓС‚Р° Р±РµР· СЃРЅРѕСЃР° РєР°С‚Р°Р»РѕРіР°
  // РµСЃС‚СЊ РѕС‚РґРµР»СЊРЅС‹Р№ Р±РµР·РѕРїР°СЃРЅС‹Р№ РїСѓС‚СЊ вЂ” prisma/seed-admin.ts (npm run prisma:seed-admin).
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const email = await upsertAdmin(prisma, adminEmail, adminPassword);
    console.log(`Seeded ADMIN user: ${email}`);
  } else {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD РЅРµ Р·Р°РґР°РЅС‹ вЂ” РїСЂРѕРїСѓСЃРєР°СЋ admin-СЃРёРґ');
  }
}

async function main() {
  await down();
  await up();
  const [categoryN, productN, colorwayN, imageN, variantN, soldOutN, couponN, reviewN] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productColorway.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { stock: 0 } }),
    prisma.coupon.count(),
    prisma.review.count(),
  ]);
  console.log(
    `Seed РіРѕС‚РѕРІ: categories=${categoryN} products=${productN} colorways=${colorwayN} ` +
      `images=${imageN} variants=${variantN} (variants stock=0: ${soldOutN}) coupons=${couponN} reviews=${reviewN}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { request } from '@playwright/test';
import { neon } from '@neondatabase/serverless';

// РџСЂРѕРіСЂРµРІ РїРµСЂРµРґ e2e: Р±СѓРґРёС‚ Neon-compute Рё WRITE-РїСѓС‚СЊ, РєРѕРјРїРёР»РёСЂСѓРµС‚ dev-РјР°СЂС€СЂСѓС‚С‹,
// С‡С‚РѕР±С‹ РїРµСЂРІС‹Р№ С‚РµСЃС‚ РЅРµ РЅС‘СЃ РЅР° СЃРµР±Рµ cold-start (РѕРґРёРЅ Р·Р°РїСЂРѕСЃ Рє Neon РјРѕР¶РµС‚ СѓРїРµСЂРµС‚СЊСЃСЏ
// РІ fetch-С‚Р°Р№РјР°СѓС‚, Р° POST /api/cart РґРµР»Р°РµС‚ РЅРµСЃРєРѕР»СЊРєРѕ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅС‹С… Р·Р°РїСЂРѕСЃРѕРІ).
export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' });
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  // 1) READ-РјР°СЂС€СЂСѓС‚С‹ (РєРѕРјРїРёР»СЏС†РёСЏ dev + РїСЂРѕР±СѓР¶РґРµРЅРёРµ compute)
  if (url) {
    for (const u of [
      '/api/cart',
      '/',
      '/catalog',
      '/catalog?category=tees',
      '/product/ritm-white-tee-oversize',
      '/wishlist',
    ]) {
      for (let attempt = 1; attempt <= 8; attempt++) {
        try {
          const res = await ctx.get(u, { timeout: 60_000 });
          if (res.ok()) break;
        } catch {
          /* С‚СЂР°РЅР·РёРµРЅС‚РЅС‹Р№ cold-start вЂ” РїРѕРІС‚РѕСЂСЏРµРј */
        }
      }
    }

    // 2) WRITE-РїСѓС‚СЊ: СЂРµР°Р»СЊРЅС‹Р№ POST /api/cart (findOrCreateCartв†’variantв†’cartItemв†’recalc) РїСЂРѕРіСЂРµРІР°РµС‚ Р·Р°РїРёСЃСЊ.
  }
  try {
    if (url) {
      const sql = neon(url);
      // neon http sql() СЂР°Р±РѕС‚Р°РµС‚ РєР°Рє tagged template; РІС‹РїРѕР»РЅСЏРµРј СЃС‹СЂСѓСЋ СЃС‚СЂРѕРєСѓ С‡РµСЂРµР· РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Р№ РјР°СЃСЃРёРІ
      const q = 'SELECT id FROM "ProductVariant" WHERE sku = \'SVT-LIME-42\' LIMIT 1';
      const t = [q] as unknown as TemplateStringsArray;
      (t as unknown as { raw: string[] }).raw = [q];
      const rows = await (sql as unknown as (s: TemplateStringsArray) => Promise<Array<{ id: string }>>)(t);
      const vid = rows?.[0]?.id;
      if (vid) {
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            const res = await ctx.post('/api/cart', { data: { productVariantId: vid }, timeout: 60_000 });
            if (res.ok()) break;
          } catch {
            /* РїСЂРѕРіСЂРµРІР°РµРј вЂ” РёРіРЅРѕСЂРёСЂСѓРµРј */
          }
        }
      }
    }
  } catch {
    /* РїСЂРѕРіСЂРµРІ write-РїСѓС‚Рё РЅРµРѕР±СЏР·Р°С‚РµР»РµРЅ */
  }

  await ctx.dispose();

  // 3) KEEP-WARM: РїРѕРєР° РёРґС‘С‚ РїСЂРѕРіРѕРЅ, Р»С‘РіРєРёР№ SELECT 1 РєР°Р¶РґС‹Рµ 15СЃ РЅРµ РґР°С‘С‚ Neon-compute
  // РїРѕРІС‚РѕСЂРЅРѕ В«Р·Р°СЃРЅСѓС‚СЊВ» РїРѕ idle-С‚Р°Р№РјР°СѓС‚Сѓ (РїРѕСЃР»РµРґРЅРёРµ РїРѕ Р°Р»С„Р°РІРёС‚Сѓ СЃРїРµРєРё вЂ” product.* вЂ” РёРЅР°С‡Рµ
  // Р±СЊСЋС‚ РїРѕ С…РѕР»РѕРґРЅРѕРјСѓ compute, С†РµРїРѕС‡РєРё HTTP round-trip СѓРїРёСЂР°СЋС‚СЃСЏ РІ С‚Р°Р№РјР°СѓС‚С‹ Playwright).
  // globalSetup, РІРµСЂРЅСѓРІС€РёР№ С„СѓРЅРєС†РёСЋ, РІС‹Р·С‹РІР°РµС‚ РµС‘ РєР°Рє globalTeardown вЂ” С‚Р°Рј РіР°СЃРёРј РёРЅС‚РµСЂРІР°Р».
  let keepWarm: ReturnType<typeof setInterval> | undefined;
  if (url) {
    const sql = neon(url);
    keepWarm = setInterval(() => {
      void (sql as unknown as (s: TemplateStringsArray) => Promise<unknown>)(
        Object.assign(['SELECT 1'], { raw: ['SELECT 1'] }) as unknown as TemplateStringsArray,
      ).catch(() => {
        /* С‚СЂР°РЅР·РёРµРЅС‚РЅС‹Р№ вЂ” РёРіРЅРѕСЂ */
      });
    }, 15_000);
    keepWarm.unref?.(); // РЅРµ РґРµСЂР¶Р°С‚СЊ РїСЂРѕС†РµСЃСЃ Р¶РёРІС‹Рј СЂР°РґРё РёРЅС‚РµСЂРІР°Р»Р°
  }

  return async () => {
    if (keepWarm) clearInterval(keepWarm);
  };
}

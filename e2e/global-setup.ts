import { request } from '@playwright/test';

const warmupRoutes = ['/', '/catalog', '/product/noma-woven-lounge', '/api/cart', '/api/wishlist/count'];

export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' });

  for (const route of warmupRoutes) {
    try {
      await ctx.get(route, { timeout: 60_000 });
    } catch {
      // A transient cold start must not prevent the test runner from starting.
    }
  }

  const keepWarm = setInterval(() => {
    void ctx.get('/catalog', { timeout: 60_000 }).catch(() => {
      // A transient keep-warm failure is harmless; the next interval retries.
    });
  }, 15_000);

  return async () => {
    clearInterval(keepWarm);
    await ctx.dispose();
  };
}

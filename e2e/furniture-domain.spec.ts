import { expect, test } from '@playwright/test';

const furnitureMedia = [
  { url: '/assets/products/01-bar-stool-idle.webp', type: 'image/webp' },
  { url: '/assets/products/03-ivory-lounge-turntable.mp4', type: 'video/mp4' },
  { url: '/assets/products/03-ivory-lounge-turntable-alpha-poster.png', type: 'image/png' },
  { url: '/assets/products/03-ivory-lounge-cutout.png', type: 'image/png' },
] as const;

test.describe('Phase 1 furniture media contract', () => {
  for (const media of furnitureMedia) {
    test(`serves ${media.url}`, async ({ request }) => {
      const response = await request.get(media.url);

      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain(media.type);
      expect(Number(response.headers()['content-length'] ?? 0)).toBeGreaterThan(0);
    });
  }
});

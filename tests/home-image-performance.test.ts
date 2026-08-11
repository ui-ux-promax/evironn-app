import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('homepage image performance contract', () => {
  it('preloads only the first hero slide', () => {
    const source = read('components/shared/home/hero.tsx');
    expect(source).toContain('priority={index === 0}');
    expect(source).not.toContain('priority={index === active}');
  });

  it('matches editorial image sizes to card spans', () => {
    const source = read('components/shared/home/editorial-bento.tsx');
    expect(source).toContain(
      "const FIRST_CARD_SIZES = '(max-width: 639px) 100vw, (max-width: 1240px) calc(50vw - 34px), 586px';",
    );
    expect(source).toContain(
      "const DESKTOP_SINGLE_SIZES = '(max-width: 639px) 50vw, (max-width: 1240px) calc(25vw - 27px), 283px';",
    );
    expect(source).toContain(
      "const DESKTOP_DOUBLE_SIZES = '(max-width: 639px) 50vw, (max-width: 1240px) calc(50vw - 34px), 586px';",
    );

    const expectedSizesByImage = [
      ['/home/hero-slide-3.png', 'FIRST_CARD_SIZES'],
      ['/home/collection-rail.png', 'DESKTOP_SINGLE_SIZES'],
      ['/home/coming-card.png', 'DESKTOP_SINGLE_SIZES'],
      ['/home/blog-wardrobe.png', 'DESKTOP_SINGLE_SIZES'],
      ['/home/blog-chic.png', 'DESKTOP_DOUBLE_SIZES'],
      ['/home/season-collage.png', 'DESKTOP_DOUBLE_SIZES'],
      ['/home/blog-arrival.png', 'DESKTOP_SINGLE_SIZES'],
    ];

    for (const [src, sizes] of expectedSizesByImage) {
      expect(source).toMatch(new RegExp(`src: '${src}',[\\s\\S]*?sizes: ${sizes},`));
    }

    expect(source).toContain('sizes={item.sizes}');
  });
});

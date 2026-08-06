import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) return listSourceFiles(path);
    return /\.(?:css|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('curated application assets', () => {
  it('declares four hero rooms and five featured furniture cards', async () => {
    const { featuredProducts, heroRooms } = await import('../src/content/home');

    expect(heroRooms).toHaveLength(4);
    expect(featuredProducts).toHaveLength(5);
  });

  it('declares the active turntable and fixed room composition', async () => {
    const { productMedia } = await import('../src/content/product');

    expect(productMedia.chairLayers).toHaveLength(6);
    expect(productMedia.turntableVideo).toMatch(/\.webm$/);
    expect(productMedia.turntablePoster).toMatch(/\.(?:avif|png|webp)$/);
    expect(productMedia.roomBackground).toMatch(/\.(?:avif|png|webp)$/);
  });

  it('references only existing local application assets', () => {
    const sourceFiles = listSourceFiles(resolve(repositoryRoot, 'src'));
    const assetReferences = sourceFiles.flatMap((path) => {
      const source = readFileSync(path, 'utf8');

      return [...source.matchAll(/['"(](\/assets\/[^'"\s)]+)['"\s)]/g)].map(
        ([, asset]) => asset,
      );
    });

    expect(assetReferences.length).toBeGreaterThan(0);
    for (const asset of assetReferences) {
      expect(
        existsSync(resolve(repositoryRoot, 'public', asset.slice(1))),
        asset,
      ).toBe(true);
    }
  });

  it('keeps editorial assets under a semantic directory', () => {
    const showcase = readFileSync(
      resolve(repositoryRoot, 'src/components/CategoryShowcase.tsx'),
      'utf8',
    );

    expect(showcase).toContain('/assets/editorial/');
  });
});

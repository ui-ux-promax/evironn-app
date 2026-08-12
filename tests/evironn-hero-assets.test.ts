import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const cloneRoot = 'D:\\Новая папка (2)\\evironn-clone';
const heroFiles = [
  'living-room-idle.png',
  'sofa-forward.mp4',
  'sofa-reverse.mp4',
  'sofa-focus.webp',
  'chair-forward.mp4',
  'chair-reverse.mp4',
  'chair-focus.webp',
  'kitchen-idle.jpg',
  'kitchen-dining-forward.mp4',
  'kitchen-dining-reverse.mp4',
  'kitchen-dining-focus.webp',
  'kitchen-island-forward.mp4',
  'kitchen-island-reverse.mp4',
  'kitchen-island-focus.webp',
  'bedroom-idle.jpg',
  'bedroom-chair-forward.mp4',
  'bedroom-chair-reverse.mp4',
  'bedroom-chair-focus.webp',
  'bedroom-bed-forward.mp4',
  'bedroom-bed-reverse.mp4',
  'bedroom-bed-focus.webp',
  'terrace-idle.jpg',
  'terrace-chair-forward.mp4',
  'terrace-chair-reverse.mp4',
  'terrace-chair-focus.webp',
  'terrace-sofa-forward.mp4',
  'terrace-sofa-reverse.mp4',
  'terrace-sofa-focus.webp',
] as const;

function digest(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('Evironn hero binary contract', () => {
  it('enumerates exactly 28 required files and compares source/target bytes', () => {
    expect(heroFiles).toHaveLength(28);
    for (const file of heroFiles) {
      const source =
        file === 'living-room-idle.png'
          ? path.join(cloneRoot, 'src/assets/furni-hero.png')
          : path.join(cloneRoot, 'public/assets/hero', file);
      const target = path.join(repositoryRoot, 'public/assets/hero', file);
      expect(existsSync(source), `Missing clone asset: ${file}`).toBe(true);
      expect(existsSync(target), `Missing production asset: ${file}`).toBe(true);
      expect(statSync(target).size, file).toBe(statSync(source).size);
      expect(digest(target), file).toBe(digest(source));
    }
  });

  it('keeps the audited inventory below the object-size boundary', () => {
    const sizes = heroFiles.map((file) => statSync(path.join(repositoryRoot, 'public/assets/hero', file)).size);
    expect(sizes.reduce((total, size) => total + size, 0)).toBeGreaterThan(0);
    expect(Math.max(...sizes)).toBeLessThan(100 * 1024 * 1024);
  });
});

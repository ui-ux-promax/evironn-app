import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const cloneRoot = 'D:\\Новая папка (2)\\evironn-clone';

const assets = [
  ['src/assets/evironn-logo.svg', 'public/assets/evironn-logo.svg'],
  ['src/assets/sentient-italic-400-reference.woff2', 'public/assets/fonts/sentient-italic-400-reference.woff2'],
  ['src/assets/sentient-normal-400-reference.woff2', 'public/assets/fonts/sentient-normal-400-reference.woff2'],
  ['src/assets/sentient-italic-300-reference.woff2', 'public/assets/fonts/sentient-italic-300-reference.woff2'],
  [
    'src/assets/sentient-benefits-normal-400-reference.woff2',
    'public/assets/fonts/sentient-benefits-normal-400-reference.woff2',
  ],
  [
    'src/assets/sentient-benefits-italic-300-reference.woff2',
    'public/assets/fonts/sentient-benefits-italic-300-reference.woff2',
  ],
  ['src/assets/open-design-albert-sans.woff2', 'public/assets/fonts/open-design-albert-sans.woff2'],
] as const;

function digest(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('Evironn shell binary contract', () => {
  it('copies exactly the normative logo and six local fonts', () => {
    expect(assets).toHaveLength(7);

    for (const [source, target] of assets) {
      const sourcePath = path.join(cloneRoot, source);
      const targetPath = path.join(repositoryRoot, target);

      expect(existsSync(sourcePath), `Missing clone asset: ${source}`).toBe(true);
      expect(existsSync(targetPath), `Missing production asset: ${target}`).toBe(true);
      expect(statSync(targetPath).size, target).toBe(statSync(sourcePath).size);
      expect(digest(targetPath), target).toBe(digest(sourcePath));
    }
  });
});

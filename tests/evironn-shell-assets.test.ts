import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();

const assets = [
  ['public/assets/evironn-logo.svg', 549, '9cc311d431969206aeef60a940f8f610a3045c80'],
  [
    'public/assets/fonts/sentient-italic-400-reference.woff2',
    24640,
    'a377e89eef03b0f83490b71ea95cb0c9c7b918ae2c3b58485821d4f9c0ef5ca7',
  ],
  [
    'public/assets/fonts/sentient-normal-400-reference.woff2',
    24348,
    'f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd8a2161fd26b14',
  ],
  [
    'public/assets/fonts/sentient-italic-300-reference.woff2',
    24796,
    'db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfddfd4c5b9ecd8bf019a',
  ],
  [
    'public/assets/fonts/sentient-benefits-normal-400-reference.woff2',
    24348,
    'f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd8a2161fd26b14',
  ],
  [
    'public/assets/fonts/sentient-benefits-italic-300-reference.woff2',
    24796,
    'db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfddfd4c5b9ecd8bf019a',
  ],
  [
    'public/assets/fonts/open-design-albert-sans.woff2',
    52216,
    '685123f02baf3d077e46af89c765789e47ae9e6a4a873ddccfe713f3a189eac1',
  ],
  [
    'public/assets/fonts/golos-text-cyrillic.woff2',
    22032,
    '17d048ca05cb1218af3c0d6dcdf882989e6d1cc5dcb598ea50eaf54850ff7229',
  ],
  [
    'public/assets/fonts/golos-text-latin.woff2',
    37916,
    '9a69d0aa4734c4022224c002a3d944a702e0204972a49d892789f5668b922c2a',
  ],
] as const;

function digest(file: string, expectedHash: string): string {
  if (expectedHash.length === 40) {
    return execFileSync('git', ['hash-object', `--path=${file}`, '--', file], { encoding: 'utf8' }).trim();
  }

  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function committedByteLength(file: string, expectedHash: string): number {
  const contents = readFileSync(file);

  return expectedHash.length === 40
    ? Buffer.byteLength(contents.toString('utf8').replace(/\r\n/g, '\n'))
    : contents.length;
}

describe('Evironn shell binary contract', () => {
  it('enumerates the exact committed logo and local font manifest', () => {
    expect(assets).toHaveLength(9);

    for (const [target, bytes, sha256] of assets) {
      const targetPath = path.join(repositoryRoot, target);

      expect(existsSync(targetPath), `Missing production asset: ${target}`).toBe(true);
      expect(committedByteLength(targetPath, sha256), target).toBe(bytes);
      expect(digest(targetPath, sha256), target).toBe(sha256);
    }
  });

  it('wires Golos Text as a local family without remote font imports', () => {
    const tokens = readFileSync(path.join(repositoryRoot, 'styles/evironn/tokens.css'), 'utf8');

    expect(tokens).toMatch(/@font-face\s*\{[\s\S]*font-family:\s*'Golos Text'[\s\S]*golos-text-cyrillic\.woff2/);
    expect(tokens).toMatch(/@font-face\s*\{[\s\S]*font-family:\s*'Golos Text'[\s\S]*golos-text-latin\.woff2/);
    expect(tokens).not.toMatch(/https?:\/\//);
    expect(tokens).toContain("--ev-font-body: 'Golos Text', system-ui, sans-serif;");
  });
});

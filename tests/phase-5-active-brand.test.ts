import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const activeBrandFiles = [
  'components/shared/site-header.tsx',
  'components/shared/mobile-nav.tsx',
  'components/shared/catalog-header-nav.tsx',
  'components/shared/profile/profile-view.tsx',
  'components/shared/auth/auth-card.tsx',
  'components/shared/home/category-bento.tsx',
  'components/shared/home/drop-promo.tsx',
  'components/shared/home/editorial-bento.tsx',
  'components/shared/home/engineered-feature.tsx',
  'components/shared/home/hero.tsx',
  'components/shared/home/season-parallax.tsx',
  'app/(auth)/login/page.tsx',
  'app/(auth)/register/page.tsx',
  'lib/email/send-email.ts',
  'lib/verification/service.ts',
  'lib/seo.ts',
  'emails/_layout.tsx',
  'emails/verification-code.tsx',
  'emails/welcome.tsx',
] as const;

const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.svg', '.json']);

function collectTextFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(path).map((file) => file.replaceAll('\\', '/'));
    return textExtensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [path.replaceAll('\\', '/')] : [];
  });
}

describe('Phase 5 active Evironn brand contract', () => {
  it('has zero active Ritm output in exact current owners and email templates', () => {
    for (const file of activeBrandFiles) expect(readFileSync(resolve(root, file), 'utf8'), file).not.toMatch(/ritm/i);
  });

  it('keeps exactly the two symbol-based production compatibility namespaces', () => {
    const folders = readFileSync(resolve(root, 'lib/cloudinary/folders.ts'), 'utf8');
    const resetLock = readFileSync(resolve(root, 'lib/demo-data/reset-lock.ts'), 'utf8');
    expect(folders.match(/LEGACY_MEDIA_PREFIX\s*=\s*['"]ritm\/['"]/g)).toEqual(["LEGACY_MEDIA_PREFIX = 'ritm/'"]);
    expect(resetLock.match(/['"]ritm:demo-reset-lock['"]/g)).toEqual(["'ritm:demo-reset-lock'"]);

    const productionHits = collectTextFiles('app')
      .concat(
        collectTextFiles('components'),
        collectTextFiles('lib'),
        collectTextFiles('services'),
        collectTextFiles('emails'),
        collectTextFiles('prisma'),
        collectTextFiles('public'),
      )
      .flatMap((file) => {
        const source = readFileSync(resolve(root, file), 'utf8');
        return source
          .split(/\r?\n/)
          .map((line, index) => ({ file, line, lineNumber: index + 1 }))
          .filter(({ line }) => /ritm/i.test(line));
      });
    expect(productionHits).toEqual([
      {
        file: 'lib/cloudinary/folders.ts',
        line: "export const LEGACY_MEDIA_PREFIX = 'ritm/';",
        lineNumber: 17,
      },
      {
        file: 'lib/demo-data/reset-lock.ts',
        line: "  const lockKey = 'ritm:demo-reset-lock';",
        lineNumber: 9,
      },
    ]);
  });

  it('removes retired Ritm logos and every source reference to them', () => {
    expect(existsSync(resolve(root, 'public/ritm-logo.svg'))).toBe(false);
    expect(existsSync(resolve(root, 'public/ritm-logo-light.svg'))).toBe(false);
    const references = collectTextFiles('app')
      .concat(
        collectTextFiles('components'),
        collectTextFiles('lib'),
        collectTextFiles('emails'),
        collectTextFiles('prisma'),
      )
      .filter((file) => /ritm-logo/i.test(readFileSync(resolve(root, file), 'utf8')));
    expect(references).toEqual([]);
  });
});

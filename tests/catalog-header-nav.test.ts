import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('CatalogHeaderNav', () => {
  it('uses the active state to choose the Catalog header button surface', async () => {
    const source = await readFile('components/shared/catalog-header-nav.tsx', 'utf8');

    expect(source).toMatch(
      /className=\{cn\([\s\S]*?catalogActive\s+\? 'header-active-in border-primary bg-primary text-primary-foreground[\s\S]*?: 'border-line bg-surface text-ink-muted/,
    );
    expect(source).toContain("aria-current={catalogActive ? 'page' : undefined}");
  });
});

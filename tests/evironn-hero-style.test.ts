import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Evironn hero recovery styles', () => {
  it('keeps retry text visible on the dark recovery button', () => {
    const css = readFileSync(path.join(process.cwd(), 'styles/evironn/home/hero.css'), 'utf8');

    expect(css).toMatch(/\.furni-hero-recovery button\s*\{[\s\S]*?color:\s*var\(--ev-bg\)/);
    expect(css).not.toContain('--ev-background');
  });

  it('marks the oversized editorial typography for denser Firefox header glass', () => {
    const source = readFileSync(path.join(process.cwd(), 'components/evironn/home/editorial-statement.tsx'), 'utf8');

    expect(source).toContain('data-header-glass-density="dense"');
  });
});

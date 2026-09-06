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

  it('keeps the full-resolution living-room poster for tall hero crops', () => {
    const source = readFileSync(path.join(process.cwd(), 'components/evironn/home/hero-room-media.tsx'), 'utf8');
    const livingPosterStart = source.indexOf("return room === 'living-room'");
    const livingPoster = source.slice(livingPosterStart, source.indexOf(') : (', livingPosterStart));

    expect(livingPoster).toContain('width={1536}');
    expect(livingPoster).toContain('height={1024}');
    expect(livingPoster).toContain('unoptimized');
  });

  it('hides the hero copy through 600px and keeps the tablet actions centered', () => {
    const css = readFileSync(path.join(process.cwd(), 'styles/evironn/home/hero.css'), 'utf8');

    expect(css).toContain(
      '@media (max-width: 600px) {\n  #evironn-hero .furni-hero-copy {\n    display: none;\n  }\n}',
    );
    expect(css).toContain('@media (min-width: 376px) and (max-width: 600px)');
    expect(css).toMatch(/\.furni-hero-stack\s*\{\s*top:\s*80px;/);
    expect(css).toContain('@media (min-width: 481px) and (max-width: 600px)');
    expect(css).toMatch(/\.furni-hero-actions\s*\{\s*justify-content:\s*center;/);
  });
});

/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import '@testing-library/jest-dom/vitest';

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  onchange: null,
  dispatchEvent: vi.fn(),
}));
vi.mock('next/link', () => ({
  default: forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(function MockLink(
    { children, ...props }: React.ComponentProps<'a'>,
    ref: React.Ref<HTMLAnchorElement>,
  ) {
    return (
      <a {...props} ref={ref}>
        {children}
      </a>
    );
  }),
}));
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
import { describe, expect, it, vi } from 'vitest';

import {
  BenefitsShowcaseSection,
  EditorialStatement,
  FurnitureCategorySection,
  FurnitureWorksParallax,
  InstagramFollowSection,
  InteractiveFurnitureCards,
  NatureSection,
} from '@/components/evironn/home';

describe('Evironn post-hero home sections', () => {
  it('keeps the client barrel boundary and exact normative export order', () => {
    const barrel = readFileSync(path.join(process.cwd(), 'components/evironn/home/index.ts'), 'utf8');
    expect(barrel).toBe(
      "'use client';\n\n" +
        "export { FurnitureCategorySection } from './furniture-editorial-sections';\n" +
        "export { InteractiveFurnitureCards } from './interactive-furniture-cards';\n" +
        "export { EditorialStatement } from './editorial-statement';\n" +
        "export { NatureSection } from './nature-section';\n" +
        "export { BenefitsShowcaseSection } from './benefits-showcase-section';\n" +
        "export { FurnitureWorksParallax } from './furniture-editorial-sections';\n" +
        "export { InstagramFollowSection } from './instagram-follow-section';\n",
    );
  });

  it('keeps the exact clone Instagram card alt copy', () => {
    const instagramSource = readFileSync(
      path.join(process.cwd(), 'components/evironn/home/instagram-follow-section.tsx'),
      'utf8',
    );
    expect(instagramSource).toContain('alt="Идея для интерьера"');
  });

  it('exports and renders the seven sections in normative order with Russian copy', () => {
    render(
      <main>
        <FurnitureCategorySection />
        <InteractiveFurnitureCards />
        <EditorialStatement />
        <NatureSection />
        <BenefitsShowcaseSection />
        <FurnitureWorksParallax />
        <InstagramFollowSection />
      </main>,
    );

    const sections = Array.from(document.querySelectorAll('main > section'));
    expect(sections.map((section) => section.className)).toEqual([
      'furniture-category-section',
      'interactive-furniture',
      'editorial-statement',
      'nature-section',
      'benefits-showcase',
      'furniture-works-parallax',
      'instagram-follow',
    ]);
    expect(screen.getByText('Диваны')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Уют, продуманный со всех сторон' })).toBeInTheDocument();
    expect(screen.getByText('Форма,')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /М а т е р и а л ы/ })).toBeInTheDocument();
    expect(screen.getByText('Мебель')).toBeInTheDocument();
    expect(screen.getByText('Пространство для жизни')).toBeInTheDocument();
    expect(screen.getByText('Детали')).toBeInTheDocument();
  });

  it('uses showcase product links and canonical catalog query links', () => {
    render(<FurnitureCategorySection />);
    expect(screen.getAllByRole('heading', { name: 'Диваны' })[0].closest('a')).toHaveAttribute(
      'href',
      '/catalog?category=sofas',
    );
  });
  it('keeps animation hooks at component boundaries', () => {
    const natureSource = readFileSync(path.join(process.cwd(), 'components/evironn/home/nature-section.tsx'), 'utf8');
    const benefitsSource = readFileSync(
      path.join(process.cwd(), 'components/evironn/home/benefits-showcase-section.tsx'),
      'utf8',
    );
    const natureCharacterStart = natureSource.indexOf('function NatureHeadingCharacter');
    const natureCharacterEnd = natureSource.indexOf('\n}\n', natureCharacterStart);
    const natureCharacterSource = natureSource.slice(natureCharacterStart, natureCharacterEnd);
    const natureMapStart = natureSource.indexOf('Array.from(word).map');
    const natureMapEnd = natureSource.indexOf('</span>', natureMapStart);
    const revealMediaStart = benefitsSource.indexOf('function RevealMedia');
    const reducedMotionIndex = benefitsSource.indexOf('const reduceMotion = useReducedMotion();', revealMediaStart);
    const revealBranchIndex = benefitsSource.indexOf(
      "if (className === 'benefit-materials-product-reveal'",
      revealMediaStart,
    );

    expect(natureCharacterStart).toBeGreaterThanOrEqual(0);
    expect(natureCharacterSource).toContain('useEditorialAnimation');
    expect(natureSource.slice(natureMapStart, natureMapEnd)).not.toContain('useEditorialAnimation');
    expect(reducedMotionIndex).toBeGreaterThanOrEqual(0);
    expect(reducedMotionIndex).toBeLessThan(revealBranchIndex);
  });
});

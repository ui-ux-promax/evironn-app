/** @vitest-environment jsdom */

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
  default: forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(
    ({ children, ...props }: React.ComponentProps<'a'>, ref: React.Ref<HTMLAnchorElement>) => (
      <a {...props} ref={ref}>
        {children}
      </a>
    ),
  ),
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
});

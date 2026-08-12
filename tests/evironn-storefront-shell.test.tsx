/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { StorefrontHeader } from '@/components/evironn/storefront-header';
import { NotFoundView } from '@/components/evironn/not-found-view';

afterEach(() => cleanup());

describe('Evironn storefront shell', () => {
  it('renders the clone header labels, logo, and cart count', () => {
    render(<StorefrontHeader cartCount={0} />);

    expect(screen.getByRole('img', { name: 'Evironn' })).toHaveAttribute('src', '/assets/evironn-logo.svg');
    expect(screen.getByRole('link', { name: 'Evironn' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toHaveTextContent(
      'Вся мебельГостинаяСтоловаяСпальняТерраса',
    );
    expect(screen.getByRole('link', { name: 'Корзина (0)' })).toHaveAttribute('href', '/cart');
  });

  it('opens and closes the accessible mobile menu with canonical links', () => {
    render(<StorefrontHeader cartCount={2} />);

    const menuButton = screen.getByRole('button', { name: 'Открыть меню' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Мобильное меню' })).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Закрыть меню' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Мобильное меню' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Мобильная корзина (2)' })).toHaveAttribute('href', '/cart');

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть меню' }));
    expect(screen.queryByRole('dialog', { name: 'Мобильное меню' })).not.toBeInTheDocument();
  });

  it('renders Footer15 copy and four canonical navigation columns', () => {
    render(<StorefrontFooter />);

    expect(screen.getByRole('contentinfo')).toHaveClass('footer-15');
    expect(
      screen.getByText(
        'Мебель для тихих, наполненных жизнью интерьеров — с вниманием к форме, материалу и ежедневному комфорту.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Навигация в подвале' })).toHaveTextContent(
      'КаталогДиваныСтолыКроватиКомнатыГостинаяСпальняТеррасаМатериалыДеревоТканьКаменьПомощьКонтактыДоставкаУход за мебелью',
    );
    expect(screen.getByRole('link', { name: 'Смотреть каталог' })).toHaveAttribute('href', '/catalog');
  });

  it('renders the chrome-free not-found view with canonical actions', () => {
    render(<NotFoundView />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Открыть каталог' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'Перейти в корзину' })).toHaveAttribute('href', '/cart');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});

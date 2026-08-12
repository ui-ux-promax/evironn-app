/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
import { useCartStore } from '@/store';

afterEach(() => {
  cleanup();
  useCartStore.setState({ items: [], loading: true, totalAmount: 0, error: false });
});

describe('Evironn storefront shell', () => {
  it('renders the clone header labels, logo, and cart count', () => {
    render(<StorefrontHeader cartCount={0} />);

    expect(screen.getByRole('img', { name: 'Evironn' })).toHaveAttribute('src', '/assets/evironn-logo.svg');
    expect(screen.getByRole('link', { name: 'Evironn' })).toHaveAttribute('href', '/');
    const desktopNavigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    expect(
      within(desktopNavigation)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim()),
    ).toEqual(['Вся мебель', 'Гостиная', 'Столовая', 'Спальня', 'Терраса']);
    expect(
      within(desktopNavigation)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/catalog', '/catalog', '/catalog', '/catalog', '/catalog']);
    expect(screen.getByRole('link', { name: 'Корзина (0)' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('link', { name: 'Поиск' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'Аккаунт' })).toHaveAttribute('href', '/profile');
    expect(document.body).not.toHaveTextContent(/RITM/i);
  });

  it('opens and closes the accessible mobile menu with canonical links', () => {
    render(<StorefrontHeader cartCount={2} />);

    const menuButton = screen.getByRole('button', { name: 'Открыть меню' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Мобильное меню' })).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Закрыть меню' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Мобильное меню' })).toBeInTheDocument();
    const mobileMenu = screen.getByRole('dialog', { name: 'Мобильное меню' });
    expect(
      within(mobileMenu)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim()),
    ).toEqual(['Вся мебель', 'Гостиная', 'Столовая', 'Спальня', 'Терраса', 'Поиск', 'Аккаунт', 'Корзина (2)']);
    expect(
      within(mobileMenu)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/catalog', '/catalog', '/catalog', '/catalog', '/catalog', '/catalog', '/profile', '/cart']);

    fireEvent.keyDown(mobileMenu, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Мобильное меню' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Открыть меню' }));
    expect(
      within(screen.getByRole('dialog', { name: 'Мобильное меню' })).getByRole('link', { name: 'Гостиная' }),
    ).toHaveAttribute('href', '/catalog');
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть меню' }));
    expect(screen.queryByRole('dialog', { name: 'Мобильное меню' })).not.toBeInTheDocument();
  });

  it('updates the cart label from the existing client cart state after route interactions', async () => {
    render(<StorefrontHeader cartCount={1} />);
    expect(screen.getByRole('link', { name: 'Корзина (1)' })).toHaveAttribute('href', '/cart');

    useCartStore.setState({
      loading: false,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 1,
          name: 'Chair',
          productSlug: 'chair',
          colorwayName: 'Oak',
          size: '',
          imageUrl: null,
          unitPrice: 100,
          lineTotal: 100,
          stock: 5,
          available: true,
        },
        {
          id: 'item-2',
          productId: 'product-2',
          quantity: 1,
          name: 'Table',
          productSlug: 'table',
          colorwayName: 'Walnut',
          size: '',
          imageUrl: null,
          unitPrice: 200,
          lineTotal: 200,
          stock: 5,
          available: true,
        },
      ],
      totalAmount: 300,
    });

    await waitFor(() => expect(screen.getByRole('link', { name: 'Корзина (2)' })).toHaveAttribute('href', '/cart'));
  });

  it('does not move focus to the mobile menu trigger on initial render', () => {
    const preexistingControl = document.createElement('button');
    preexistingControl.textContent = 'Before header';
    document.body.append(preexistingControl);
    preexistingControl.focus();

    try {
      render(<StorefrontHeader cartCount={0} />);

      expect(document.activeElement).toBe(preexistingControl);
    } finally {
      preexistingControl.remove();
    }
  });

  it('moves focus into the dialog, traps tab, hides the background, and restores the trigger', () => {
    const background = document.createElement('main');
    background.setAttribute('data-testid', 'background-content');
    const footer = document.createElement('footer');
    footer.setAttribute('inert', '');
    footer.setAttribute('data-testid', 'background-footer');
    document.body.append(background, footer);

    render(<StorefrontHeader cartCount={0} />);
    const trigger = screen.getByRole('button', { name: 'Открыть меню' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Мобильное меню' });
    const controls = within(dialog).getAllByRole('link');
    expect(document.activeElement).toBe(controls[0]);
    expect(document.querySelector('#evironn-header > .od-header-inner')).toHaveAttribute('inert');
    expect(background).toHaveAttribute('inert');
    expect(footer).toHaveAttribute('inert');

    controls[controls.length - 1].focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(controls[0]);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(controls[controls.length - 1]);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(background).not.toHaveAttribute('inert');
    expect(footer).toHaveAttribute('inert');

    background.remove();
    footer.remove();
  });

  it('renders Footer15 copy and four canonical navigation columns', () => {
    render(<StorefrontFooter />);

    expect(screen.getByRole('contentinfo')).toHaveClass('footer-15');
    expect(
      screen.getByText(
        'Мебель для тихих, наполненных жизнью интерьеров — с вниманием к форме, материалу и ежедневному комфорту.',
      ),
    ).toBeInTheDocument();
    const footerLinks = screen.getAllByRole('link');
    expect(footerLinks.map((link) => link.textContent?.trim())).toEqual([
      'Смотреть каталог',
      'Диваны',
      'Столы',
      'Кровати',
      'Гостиная',
      'Спальня',
      'Терраса',
      'Дерево',
      'Ткань',
      'Камень',
      'Контакты',
      'Доставка',
      'Уход за мебелью',
    ]);
    expect(footerLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
      '/catalog',
    ]);
  });

  it('renders the chrome-free not-found view with canonical actions', () => {
    render(<NotFoundView />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Открыть каталог' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'Перейти в корзину' })).toHaveAttribute('href', '/cart');
    expect(
      screen.getByText(
        'Похоже, ссылка устарела или адрес был введен с ошибкой. Вернитесь на понятный публичный маршрут и продолжите просмотр.',
        { exact: true },
      ),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/RITM/i);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});

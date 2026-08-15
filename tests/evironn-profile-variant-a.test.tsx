/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import type { ProfilePageDto } from '@/services/dto/profile-page.dto';

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  addAddress: vi.fn(),
  deleteAddress: vi.fn(),
  setDefaultAddress: vi.fn(),
  toggleWishlist: vi.fn(),
  addCartItem: vi.fn(),
  signOut: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions/profile', () => ({
  updateProfile: mocks.updateProfile,
  updatePassword: mocks.updatePassword,
}));
vi.mock('@/app/actions/address', () => ({
  addAddress: mocks.addAddress,
  deleteAddress: mocks.deleteAddress,
  setDefaultAddress: mocks.setDefaultAddress,
}));
vi.mock('@/app/actions/wishlist', () => ({ toggleWishlist: mocks.toggleWishlist }));
vi.mock('next-auth/react', () => ({ signOut: mocks.signOut }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/store/cart', () => ({
  useCartStore: (selector: (state: { addCartItem: typeof mocks.addCartItem }) => unknown) =>
    selector({ addCartItem: mocks.addCartItem }),
}));
vi.mock('@/components/evironn/catalog/catalog-card', () => ({
  CatalogCard: ({
    product,
    wishlisted,
    onWishlistToggle,
  }: {
    product: CatalogBCard;
    wishlisted: boolean;
    onWishlistToggle: (productId: string) => Promise<unknown>;
  }) => (
    <article data-testid="catalog-card">
      <span>{product.name}</span>
      <span data-testid={`wishlisted-${product.id}`}>{String(wishlisted)}</span>
      <button type="button" onClick={() => void onWishlistToggle(product.id)}>
        Toggle favorite card
      </button>
    </article>
  ),
}));

import { ProfileVariantA } from '@/components/evironn/profile/profile-variant-a';

const favorite = {
  id: 'product-1',
  slug: 'noma',
  name: 'Noma',
  brand: 'Evironn',
  categoryName: 'Кресла',
  imageUrl: '/noma.webp',
  imageAlt: 'Noma',
  primarySkuId: 'sku-1',
  minPrice: 89000,
  minOldPrice: null,
  badges: [],
  soldOut: false,
  optionSwatches: [],
  href: '/product/noma',
  media: { idle: '/noma.webp', forward: '/noma.mp4', reverse: '/noma-reverse.mp4' },
  note: 'Кресла',
  colors: [],
} as CatalogBCard;

const soldOutFavorite = { ...favorite, id: 'product-2', name: 'Sold out', primarySkuId: null, soldOut: true };

const dto: ProfilePageDto = {
  user: {
    name: 'Анна Иванова',
    email: 'anna@example.com',
    phone: '+7 999',
    birthdate: '1990-05-01T00:00:00.000Z',
    createdAt: '2026-08-01T10:00:00.000Z',
    initials: 'АИ',
  },
  stats: { orders: 1, favorites: 2, addresses: 2 },
  orders: [
    {
      id: 'order-1',
      orderNumber: 42,
      status: 'DELIVERED',
      createdAt: '2026-08-01T10:00:00.000Z',
      shippingMethod: 'courier',
      city: 'Москва',
      addressLine: 'ул. Ленина, 1',
      itemsTotal: 89000,
      discountAmount: 0,
      shippingAmount: 0,
      totalAmount: 89000,
      items: [
        {
          id: 'line-1',
          name: 'Noma snapshot',
          configuration: 'Отделка: Дуб',
          imageUrl: '/noma.webp',
          quantity: 1,
          unitPrice: 89000,
          lineTotal: 89000,
        },
      ],
    },
  ],
  favorites: [favorite, soldOutFavorite],
  addresses: [
    { id: 'address-1', label: 'Дом', city: 'Москва', street: 'Ленина, 1', comment: 'Позвонить', isDefault: true },
    { id: 'address-2', label: 'Дача', city: 'Москва', street: 'Новая, 2', comment: null, isDefault: false },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateProfile.mockResolvedValue({ ok: true });
  mocks.updatePassword.mockResolvedValue({ ok: true });
  mocks.addAddress.mockResolvedValue({ ok: true, id: 'address-3' });
  mocks.deleteAddress.mockResolvedValue({ ok: true });
  mocks.setDefaultAddress.mockResolvedValue({ ok: true });
  mocks.toggleWishlist.mockResolvedValue({ ok: true, active: false });
  mocks.addCartItem.mockResolvedValue({ items: [], totals: {} });
  mocks.signOut.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

function openSection(label: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
}

describe('Profile Variant A', () => {
  it('keeps the exact profile shell classes and supported navigation only', () => {
    render(<ProfileVariantA dto={dto} />);

    expect(screen.getByRole('main')).toHaveClass('prf', 'prf--a');
    expect(screen.getByRole('navigation', { name: 'Разделы кабинета' })).toHaveClass('prf__nav');
    expect(screen.getByRole('navigation').querySelector('.prf__nav-indicator')).toBeInTheDocument();
    for (const label of ['Обзор', 'Заказы', 'Избранное', 'Профиль', 'Адреса']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    }
    expect(screen.queryByText('Оплата')).not.toBeInTheDocument();
    expect(screen.queryByText('Бонусы')).not.toBeInTheDocument();
    expect(screen.queryByText('Уведомления')).not.toBeInTheDocument();
  });

  it('shows real overview counts and latest snapshot without invented loyalty state', () => {
    render(<ProfileVariantA dto={dto} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/Noma snapshot/)).toBeInTheDocument();
    expect([...document.querySelectorAll('.prf__quick b')].map((node) => node.textContent)).toContain('2');
    expect(screen.queryByText(/бонус|круг|уровня/i)).not.toBeInTheDocument();
  });

  it('renders orders as read-only snapshots with no order mutations', () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Заказы');

    expect(screen.getByText(/Noma snapshot/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Отменить|Повторить|Скачать чек|Оплатить|Трекинг/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Подробнее|К заказу/i })).not.toBeInTheDocument();
  });

  it('uses controlled CatalogCard favorites and canonical SKU cart add', async () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Избранное');

    const addButtons = screen.getAllByRole('button', { name: 'В корзину' });
    expect(addButtons[0]).toBeEnabled();
    expect(addButtons[1]).toBeDisabled();
    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(mocks.addCartItem).toHaveBeenCalledWith({ skuId: 'sku-1', quantity: 1 }));

    fireEvent.click(screen.getByRole('button', { name: 'Убрать Noma из избранного' }));
    await waitFor(() => expect(mocks.toggleWishlist).toHaveBeenCalledWith({ productId: 'product-1' }));
  });

  it('submits profile and password forms while keeping email read-only', async () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Профиль');

    const email = screen.getByLabelText('E-mail');
    expect(email).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Имя и фамилия'), { target: { value: 'Анна Новая' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Анна Новая' })),
    );

    fireEvent.change(screen.getByLabelText('Текущий пароль'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }));
    await waitFor(() =>
      expect(mocks.updatePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password',
        repeatPassword: 'new-password',
      }),
    );
  });

  it('adds, defaults, and deletes owner-scoped addresses', async () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Адреса');
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Студия' } });
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Москва' } });
    fireEvent.change(screen.getByLabelText('Улица и дом'), { target: { value: 'Тверская, 10' } });
    fireEvent.change(screen.getByLabelText('Комментарий'), { target: { value: 'Домофон 10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить адрес' }));
    await waitFor(() =>
      expect(mocks.addAddress).toHaveBeenCalledWith({
        label: 'Студия',
        city: 'Москва',
        street: 'Тверская, 10',
        comment: 'Домофон 10',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сделать адрес Дача основным' }));
    await waitFor(() => expect(mocks.setDefaultAddress).toHaveBeenCalledWith('address-2'));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить Дача' }));
    await waitFor(() => expect(mocks.deleteAddress).toHaveBeenCalledWith('address-2'));
  });

  it('keeps address display and shows server errors when add rejects', async () => {
    mocks.addAddress.mockRejectedValueOnce(new Error('Адрес недоступен'));
    render(<ProfileVariantA dto={dto} />);
    openSection('Адреса');
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Москва' } });
    fireEvent.change(screen.getByLabelText('Улица и дом'), { target: { value: 'Тверская, 10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить адрес' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Адрес недоступен'));
    expect(screen.getByText('Дача')).toBeInTheDocument();
  });

  it('logs out through Auth.js and preserves prior display on server error', async () => {
    mocks.updateProfile.mockResolvedValueOnce({ ok: false, error: 'Сервер недоступен' });
    render(<ProfileVariantA dto={dto} />);
    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());

    openSection('Профиль');
    fireEvent.change(screen.getByLabelText('Имя и фамилия'), { target: { value: 'Не сохранено' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Сервер недоступен'));
    expect(screen.getByLabelText('Имя и фамилия')).toHaveValue('Не сохранено');
  });
});

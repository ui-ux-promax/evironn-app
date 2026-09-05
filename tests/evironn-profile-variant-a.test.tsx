/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import type { ProfilePageDto } from '@/services/dto/profile-page.dto';
import { useProfileVariantA } from '@/components/evironn/profile/use-profile-variant-a';

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

function ProfileDataProbe({ dto }: { dto: ProfilePageDto }) {
  const profile = useProfileVariantA(dto);
  return (
    <>
      <output data-testid="profile-data">{JSON.stringify(profile.data)}</output>
      <button
        type="button"
        onClick={() =>
          void profile.actions.saveProfile({ name: 'Локальное имя', phone: ' +7 999 ', birthdate: '1991-06-15' })
        }
      >
        Save profile
      </button>
      <button type="button" onClick={() => void profile.actions.setDefaultAddress('address-2')}>
        Set default address
      </button>
      <button type="button" onClick={() => void profile.actions.toggleFavorite('product-1')}>
        Toggle favorite
      </button>
    </>
  );
}

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
      paymentMethod: 'online',
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
  it('isolates profile save progress and keeps its label while pending', async () => {
    let resolveSave: ((result: { ok: true }) => void) | undefined;
    mocks.updateProfile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<ProfileVariantA dto={dto} />);
    openSection('Профиль');

    const save = screen.getByRole('button', { name: 'Сохранить изменения' });
    fireEvent.click(save);

    await waitFor(() => {
      expect(save).toBeDisabled();
      expect(save).toHaveAttribute('aria-busy', 'true');
      expect(save).toHaveTextContent('Сохранить изменения');
      expect(save.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
    expect(screen.getByRole('button', { name: 'Изменить пароль' })).toBeEnabled();

    resolveSave?.({ ok: true });
    await waitFor(() => expect(save).toBeEnabled());
    expect(save).not.toHaveAttribute('aria-busy', 'true');
  });

  it('isolates address add progress and restores the control after rejection', async () => {
    let rejectAdd: ((reason?: unknown) => void) | undefined;
    mocks.addAddress.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectAdd = reject;
        }),
    );
    render(<ProfileVariantA dto={dto} />);
    openSection('Адреса');
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));
    fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Москва' } });
    fireEvent.change(screen.getByLabelText('Улица и дом'), { target: { value: 'Тверская, 10' } });
    const save = screen.getByRole('button', { name: 'Сохранить адрес' });
    fireEvent.click(save);

    await waitFor(() => {
      expect(save).toBeDisabled();
      expect(save).toHaveAttribute('aria-busy', 'true');
      expect(save).toHaveTextContent('Сохранить адрес');
      expect(save.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
    expect(screen.getByRole('button', { name: 'Сделать адрес Дача основным' })).toBeEnabled();

    rejectAdd?.(new Error('Адрес недоступен'));
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('Адрес недоступен');
  });

  it('isolates favorite cart progress and prevents duplicate requests', async () => {
    let rejectAdd: ((reason?: unknown) => void) | undefined;
    mocks.addCartItem.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectAdd = reject;
        }),
    );
    render(<ProfileVariantA dto={dto} />);
    openSection('Избранное');

    const add = screen.getAllByRole('button', { name: 'В корзину' })[0];
    fireEvent.click(add);
    fireEvent.click(add);
    await waitFor(() => {
      expect(mocks.addCartItem).toHaveBeenCalledTimes(1);
      expect(add).toBeDisabled();
      expect(add).toHaveAttribute('aria-busy', 'true');
      expect(add).toHaveTextContent('В корзину');
      expect(add.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
    expect(screen.getAllByRole('button', { name: 'В корзину' })[1]).toBeDisabled();

    rejectAdd?.(new Error('Корзина недоступна'));
    await waitFor(() => expect(add).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('Корзина недоступна');
  });

  it('keeps a favorite card mounted while removal is pending and rolls it back on rejection', async () => {
    let rejectToggle: ((reason?: unknown) => void) | undefined;
    mocks.toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectToggle = reject;
        }),
    );
    render(<ProfileVariantA dto={dto} />);
    openSection('Избранное');

    const remove = screen.getByRole('button', { name: 'Убрать Noma из избранного' });
    fireEvent.click(remove);
    fireEvent.click(remove);
    await waitFor(() => {
      expect(mocks.toggleWishlist).toHaveBeenCalledTimes(1);
      expect(remove).toBeDisabled();
      expect(remove).toHaveAttribute('aria-busy', 'true');
      expect(remove.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText('Noma')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Убрать Sold out из избранного' })).toBeEnabled();

    rejectToggle?.(new Error('Избранное недоступно'));
    await waitFor(() => expect(remove).toBeEnabled());
    expect(screen.getByText('Noma')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Избранное недоступно');
  });

  it('guards logout, keeps its label, and restores the button after rejection', async () => {
    let rejectLogout: ((reason?: unknown) => void) | undefined;
    mocks.signOut.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectLogout = reject;
        }),
    );
    render(<ProfileVariantA dto={dto} />);

    const logout = screen.getByRole('button', { name: 'Выйти' });
    fireEvent.click(logout);
    fireEvent.click(logout);
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(logout).toBeDisabled();
      expect(logout).toHaveAttribute('aria-busy', 'true');
      expect(logout).toHaveTextContent('Выйти');
      expect(logout.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    rejectLogout?.(new Error('Выход недоступен'));
    await waitFor(() => expect(logout).toBeEnabled());
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Выход недоступен');
  });

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

  it('shows the reference loyalty block, real overview counts, and latest snapshot', () => {
    render(<ProfileVariantA dto={dto} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/Noma snapshot/)).toBeInTheDocument();
    expect(screen.getByText('Evironn круг')).toBeInTheDocument();
    expect(screen.getByText('Тёплый дом')).toBeInTheDocument();
    expect(screen.getAllByText('4 460')).not.toHaveLength(0);
    expect(screen.getAllByText('бонусов')).not.toHaveLength(0);
    expect([...document.querySelectorAll('.prf__quick b')].map((node) => node.textContent)).toContain('2');
  });

  it('renders the active-order tracker with the production status', () => {
    render(
      <ProfileVariantA
        dto={{
          ...dto,
          orders: [{ ...dto.orders[0], status: 'PROCESSING' }],
        }}
      />,
    );

    expect(screen.getByText('Активный заказ')).toBeInTheDocument();
    expect(screen.getAllByText('Собираем')).not.toHaveLength(0);
    expect(screen.getByRole('list', { name: 'Статус заказа' })).toBeInTheDocument();
    expect(screen.getByText('К заказу')).toBeInTheDocument();
  });

  it('matches the reference order tools and read-only order snapshot', () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Заказы');

    expect(screen.getByPlaceholderText('Номер заказа')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('all');
    expect(screen.getByText(/Noma snapshot/)).toBeInTheDocument();
    expect(screen.getByText('Картой онлайн')).toBeInTheDocument();
    expect(screen.getByText('Срок')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Подробнее' })).toHaveAttribute('href', '/orders/42');
    expect(
      screen.queryByRole('button', { name: /Отменить|Повторить|Скачать чек|Оплатить|Трекинг/i }),
    ).not.toBeInTheDocument();
  });

  it('filters orders by number and status without mutating the snapshot', () => {
    render(<ProfileVariantA dto={dto} />);
    openSection('Заказы');

    fireEvent.change(screen.getByPlaceholderText('Номер заказа'), { target: { value: '999' } });
    expect(screen.queryByText('Noma snapshot')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Номер заказа'), { target: { value: '' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PROCESSING' } });
    expect(screen.queryByText('Noma snapshot')).not.toBeInTheDocument();
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

  it('reconciles a stale wishlist toggle result and preserves the favorite when active', async () => {
    mocks.toggleWishlist.mockResolvedValueOnce({ ok: true, active: true });
    render(<ProfileVariantA dto={dto} />);
    openSection('Избранное');

    fireEvent.click(screen.getByRole('button', { name: 'Убрать Noma из избранного' }));

    await waitFor(() => expect(mocks.toggleWishlist).toHaveBeenCalledWith({ productId: 'product-1' }));
    expect(screen.getByText('Noma')).toBeInTheDocument();
    expect(screen.getByTestId('wishlisted-product-1')).toHaveTextContent('true');
    expect(screen.getByRole('button', { name: /^Избранное/ })).toHaveTextContent('2');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('syncs refreshed DTO props without replacing an optimistic favorite mutation', async () => {
    let resolveToggle: ((result: { ok: true; active: false }) => void) | undefined;
    mocks.toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve;
        }),
    );
    const refreshedDto: ProfilePageDto = {
      ...dto,
      user: { ...dto.user, name: 'Мария Петрова', initials: 'МП' },
      favorites: [soldOutFavorite],
      stats: { ...dto.stats, favorites: 1 },
    };
    const view = render(<ProfileVariantA dto={dto} />);
    openSection('Избранное');

    fireEvent.click(screen.getByRole('button', { name: 'Убрать Noma из избранного' }));
    await waitFor(() => expect(screen.getByText('Noma')).toBeInTheDocument());

    view.rerender(<ProfileVariantA dto={refreshedDto} />);

    expect(screen.getByText('МП')).toBeInTheDocument();
    expect(screen.getByText('Noma')).toBeInTheDocument();
    expect(screen.getByTestId('wishlisted-product-2')).toHaveTextContent('true');

    resolveToggle?.({ ok: true, active: false });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it('accepts normalized server profile, sorted addresses, and refreshed stats after local updates', async () => {
    const refreshedDto: ProfilePageDto = {
      ...dto,
      user: {
        ...dto.user,
        name: 'Серверное имя',
        phone: '+7 900',
        birthdate: '1991-06-15T00:00:00.000Z',
        initials: 'СИ',
      },
      stats: { orders: 4, favorites: 3, addresses: 2 },
      addresses: [
        { ...dto.addresses[1], isDefault: true },
        { ...dto.addresses[0], isDefault: false },
      ],
    };
    const view = render(<ProfileDataProbe dto={dto} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Set default address' }));
    await waitFor(() => expect(mocks.setDefaultAddress).toHaveBeenCalledTimes(1));

    view.rerender(<ProfileDataProbe dto={refreshedDto} />);

    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.user).toMatchObject({
        name: 'Серверное имя',
        phone: '+7 900',
        birthdate: '1991-06-15T00:00:00.000Z',
        initials: 'СИ',
      });
      expect(data.addresses.map((address) => address.id)).toEqual(['address-2', 'address-1']);
      expect(data.addresses[0].isDefault).toBe(true);
      expect(data.stats).toEqual({ orders: 4, favorites: 3, addresses: 2 });
    });
  });

  it('preserves only an in-flight favorite mutation and releases it for later server refreshes', async () => {
    let resolveToggle: ((result: { ok: true; active: false }) => void) | undefined;
    mocks.toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve;
        }),
    );
    const view = render(<ProfileDataProbe dto={dto} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle favorite' }));
    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-2']);
    });

    const staleRefresh: ProfilePageDto = {
      ...dto,
      user: { ...dto.user, name: 'Обновлённое имя', birthdate: '1992-07-16' },
      stats: { orders: 5, favorites: 2, addresses: 2 },
      addresses: [
        { ...dto.addresses[1], isDefault: true },
        { ...dto.addresses[0], isDefault: false },
      ],
    };
    view.rerender(<ProfileDataProbe dto={staleRefresh} />);

    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.user.birthdate).toBe('1992-07-16T00:00:00.000Z');
      expect(data.addresses.map((address) => address.id)).toEqual(['address-2', 'address-1']);
      expect(data.stats.orders).toBe(5);
      expect(data.stats.favorites).toBe(1);
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-2']);
    });

    resolveToggle?.({ ok: true, active: false });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());

    view.rerender(<ProfileDataProbe dto={{ ...staleRefresh }} />);
    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-2']);
      expect(data.stats.favorites).toBe(2);
    });
  });

  it('rolls back only the failed favorite after an in-flight profile refresh', async () => {
    let rejectToggle: ((reason?: unknown) => void) | undefined;
    mocks.toggleWishlist.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectToggle = reject;
        }),
    );
    const refreshedFavorite = { ...soldOutFavorite, id: 'product-3', name: 'Refreshed favorite' };
    const refreshedDto: ProfilePageDto = {
      ...dto,
      user: { ...dto.user, name: 'Обновлённый профиль' },
      stats: { orders: 7, favorites: 2, addresses: 4 },
      favorites: [favorite, refreshedFavorite],
    };
    const view = render(<ProfileDataProbe dto={dto} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle favorite' }));
    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-2']);
    });

    view.rerender(<ProfileDataProbe dto={refreshedDto} />);
    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.user.name).toBe('Обновлённый профиль');
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-3']);
      expect(data.stats).toMatchObject({ orders: 7, addresses: 4, favorites: 1 });
    });

    rejectToggle?.(new Error('wishlist unavailable'));
    await waitFor(() => {
      const data = JSON.parse(screen.getByTestId('profile-data').textContent ?? '{}') as ProfilePageDto;
      expect(data.favorites.map((product) => product.id)).toEqual(['product-1', 'product-3']);
      expect(data.stats).toEqual({ orders: 7, favorites: 2, addresses: 4 });
    });
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
    expect(document.querySelector('.prf__avatar')).toHaveTextContent('АН');

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

// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ProductForm } from '@/app/(admin)/admin/catalog/products/_components/product-form';
import type { FurnitureProductValues } from '@/services/dto/product.dto';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/app/actions/admin/products', () => ({
  saveFurnitureProduct: vi.fn(),
  deleteFurnitureProduct: vi.fn(),
}));

const optionGroups = [
  {
    id: 'material-id',
    name: 'Материал',
    slug: 'material',
    sortOrder: 0,
    values: [{ id: 'oak-id', name: 'Дуб', slug: 'oak', sortOrder: 0 }],
  },
];

const baseValues: FurnitureProductValues = {
  name: 'Дубовый стул',
  slug: 'dubovyi-stul',
  brand: 'Evironn',
  categoryId: 'chair-category',
  roomIds: ['living-room'],
  description: 'Описание товара',
  specs: [{ key: 'Материал', value: 'Массив дуба' }],
  isBestseller: false,
  active: true,
  sortOrder: 0,
  optionGroups,
  skus: [
    {
      id: 'sku-1',
      articleNumber: 'EV-CHAIR-OAK',
      combinationKey: 'material=oak',
      selectedOptions: [{ groupSlug: 'material', valueSlug: 'oak' }],
      price: 42000,
      oldPrice: null,
      stock: 4,
      active: true,
      media: [],
    },
  ],
  media: [],
  turntable: false,
};

const commonProps = {
  categories: [{ id: 'chair-category', name: 'Стулья' }],
  brands: ['Evironn'],
  availableRooms: [{ id: 'living-room', name: 'Гостиная', slug: 'living-room', sortOrder: 0, productCount: 1 }],
};

afterEach(() => {
  cleanup();
  push.mockReset();
});

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('ProductForm approved presentation', () => {
  it('renders the create composition with canonical fields and grouped sections', () => {
    render(<ProductForm {...commonProps} initialValues={{ ...baseValues, name: '', slug: '', skus: [] }} />);

    expect(screen.getByTestId('admin-product-form')).toBeTruthy();
    expect(screen.getByTestId('admin-product-form-hero')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Новый товар' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Товары' })).toHaveAttribute('href', '/admin/catalog/products');
    expect(screen.getByRole('button', { name: /Создать/ })).toHaveAttribute('type', 'submit');

    for (const section of ['Основное', 'Медиа', 'Опции и SKU', 'Публикация', 'Характеристики']) {
      expect(screen.getByRole('heading', { name: section })).toBeTruthy();
    }

    expect(screen.getByRole('textbox', { name: 'Название товара *' })).toHaveAttribute('name', 'name');
    expect(screen.getByRole('textbox', { name: 'Slug *' })).toHaveAttribute('name', 'slug');
    expect(screen.getByRole('combobox', { name: 'Бренд *' })).toHaveAttribute('name', 'brand');
    expect(screen.getByRole('combobox', { name: 'Категория *' })).toHaveAttribute('name', 'categoryId');
    expect(screen.getByTestId('admin-product-form-rooms')).toHaveAttribute('name', 'roomIds');
    expect(screen.getByRole('textbox', { name: 'Краткое описание' })).toHaveAttribute('name', 'description');
    expect(screen.getByTestId('admin-product-active-switch')).toBeTruthy();
    expect(screen.getByText(/комбинации сформируются автоматически/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Удалить товар' })).toBeNull();
  });

  it('renders edit-only publication and destructive controls while preserving SKU editing', () => {
    render(<ProductForm {...commonProps} initial={{ id: 'product-1', ...baseValues }} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Дубовый стул' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Сохранить/ })).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'Удалить товар' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Опасная зона' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Article number material=oak' })).toHaveValue('EV-CHAIR-OAK');
    expect(screen.getByRole('spinbutton', { name: 'Price material=oak' })).toHaveValue(42000);
    expect(screen.getByTestId('admin-product-matrix-stock-material=oak')).toHaveAttribute('readonly');
  });

  it('keeps the active status switch interactive', () => {
    render(<ProductForm {...commonProps} initial={{ id: 'product-1', ...baseValues }} />);

    const activeSwitch = screen.getByTestId('admin-product-active-switch');
    expect(activeSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(activeSwitch);

    expect(activeSwitch).toHaveAttribute('aria-checked', 'false');
  });
});

/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import ProductLoading from '@/app/(shop)/product/[slug]/loading';

describe('Evironn product loading boundary', () => {
  it('reserves the clone product body while the dynamic route resolves', () => {
    render(<ProductLoading />);

    const main = screen.getByRole('main', { name: 'Загрузка страницы товара' });

    expect(main).toHaveClass('product-page', 'product-page--loading');
    expect(main).toHaveAttribute('aria-busy', 'true');
    expect(main.querySelector('.product-page__scene')).toBeInTheDocument();
    expect(main.querySelector('.product-page__loading-panel')).toBeInTheDocument();
  });
});

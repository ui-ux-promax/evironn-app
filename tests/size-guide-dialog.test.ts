/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SizeGuideDialog } from '@/components/shared/product/size-guide-dialog';

afterEach(() => cleanup());

describe('SizeGuideDialog', () => {
  it('opens the size table and closes it from the close button', () => {
    render(React.createElement(SizeGuideDialog));

    fireEvent.click(screen.getByRole('button', { name: 'Таблица размеров' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Таблица размеров' })).toBeTruthy();
    expect(screen.getByText('Обхват груди, см')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть таблицу размеров' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CheckRow,
  ChipRow,
  EmptyState,
  Pagination,
  PriceRange,
  ResultCount,
} from '@/components/evironn/catalog/catalog-primitives';

describe('catalog primitives', () => {
  afterEach(() => cleanup());

  it('renders compact box pagination with current page and inert gaps', () => {
    const onChange = vi.fn();

    render(<Pagination page={6} total={12} onChange={onChange} />);

    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getAllByText('…').every((gap) => gap.tagName === 'SPAN')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onChange).toHaveBeenCalledWith(5);
    expect(screen.getByRole('button', { name: 'Назад' })).not.toBeDisabled();
  });

  it('clamps pagination at first and last pages and omits null pagination', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Pagination page={0} total={4} onChange={onChange} />);

    expect(screen.getByRole('button', { name: '1', current: 'page' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(<Pagination page={99} total={4} onChange={onChange} />);
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(<Pagination page={1} total={1} onChange={onChange} />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('clamps dual price range to server bounds with one step gap', () => {
    const onChange = vi.fn();

    render(<PriceRange value={[1000, 5000]} min={1000} max={5000} onChange={onChange} />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveAttribute('min', '1000');
    expect(sliders[0]).toHaveAttribute('max', '5000');
    expect(sliders[0]).toHaveAttribute('step', '100');
    expect(sliders[1]).toHaveAttribute('step', '100');
    expect(screen.getByRole('textbox', { name: 'Цена от' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Цена до' })).toBeInTheDocument();

    fireEvent.change(sliders[0], { target: { value: '5000' } });
    expect(onChange).toHaveBeenLastCalledWith([4900, 5000]);
    fireEvent.change(sliders[1], { target: { value: '1000' } });
    expect(onChange).toHaveBeenLastCalledWith([1000, 1100]);

    const fields = screen.getAllByRole('textbox');
    fireEvent.change(fields[0], { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith([1000, 5000]);
    fireEvent.change(fields[1], { target: { value: '999999' } });
    expect(onChange).toHaveBeenLastCalledWith([1000, 5000]);
  });

  it('snaps relative to non-round server minimum and normalizes crossed values', () => {
    const onChange = vi.fn();

    render(<PriceRange value={[1500, 1300]} min={1050} max={1360} onChange={onChange} />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveValue('1250');
    expect(sliders[1]).toHaveValue('1350');
    expect(screen.getByRole('textbox', { name: 'Цена до' })).toHaveValue('1 350');
    fireEvent.change(sliders[0], { target: { value: '1360' } });
    expect(onChange).toHaveBeenLastCalledWith([1250, 1350]);
    expect(Number(sliders[0].getAttribute('min'))).toBeGreaterThanOrEqual(1050);
    expect(Number(sliders[1].getAttribute('max'))).toBeLessThanOrEqual(1360);
  });

  it('keeps narrow server bounds inside range without crossing', () => {
    const onChange = vi.fn();

    render(<PriceRange value={[1100, 1050]} min={1050} max={1090} onChange={onChange} />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveValue('1050');
    expect(sliders[1]).toHaveValue('1090');
    fireEvent.change(sliders[0], { target: { value: '1090' } });
    fireEvent.change(sliders[1], { target: { value: '1050' } });
    expect(onChange).toHaveBeenLastCalledWith([1050, 1090]);
  });

  it('renders checked, disabled, counted, and swatched check row with focus hook', () => {
    const onChange = vi.fn();

    render(
      <>
        <CheckRow label="Дуб" count={3} checked swatchHex="#c8a97e" onChange={onChange} />
        <CheckRow label="Чёрный" count={0} checked={false} onChange={onChange} />
      </>,
    );

    const [checked, disabled] = screen.getAllByRole('checkbox');
    expect(checked).toBeChecked();
    expect(checked).not.toBeDisabled();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTitle('Дуб')).toHaveStyle({ background: 'rgb(200, 169, 126)' });

    expect(disabled).toBeDisabled();
    expect(screen.getByText('Чёрный').closest('.cat-check')).toHaveClass('is-disabled');
    fireEvent.click(checked);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('respects explicit disabled state and prevents disabled callbacks', () => {
    const onChange = vi.fn();

    render(<CheckRow label="Явно выключено" checked={false} disabled onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    fireEvent.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes chips and clears all filters', () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();

    render(<ChipRow chips={[{ id: 'finish:oak', label: 'Дуб' }]} onRemove={onRemove} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /Дуб/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }));
    expect(onRemove).toHaveBeenCalledWith('finish:oak');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('renders no chip row when chips are empty', () => {
    render(<ChipRow chips={[]} onRemove={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Сбросить всё' })).toBeNull();
  });

  it('renders result status and empty reset action', () => {
    const onReset = vi.fn();

    render(
      <>
        <ResultCount shown={12} total={42} />
        <EmptyState onReset={onReset} />
      </>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Показано 12 из 42');
    expect(screen.getByText('Ничего не нашлось')).toBeInTheDocument();
    expect(screen.getByText(/диапазон цены/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('keeps primitive CSS scoped and accessible under reduced motion', () => {
    const css = readFileSync('styles/evironn/catalog-primitives.css', 'utf8');

    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).not.toMatch(/(^|\n)\s*(html|body|button|input|label|ul|p|\*)\s*\{/);
    expect(css).not.toContain(':root');
  });
});

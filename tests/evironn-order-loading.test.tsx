// @vitest-environment jsdom

import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import OrderLoading from '@/app/(shop)/orders/[number]/loading';

describe('order loading boundary', () => {
  it('mirrors the order page grid instead of rendering unrelated flat cards', () => {
    const { container } = render(<OrderLoading />);
    const main = container.querySelector('main');

    expect(main).toHaveClass('ord-a', 'ord-loading');
    expect(main?.querySelector('.ord-a__head')).toBeInTheDocument();
    expect(main?.querySelector('.ord-a__grid')).toBeInTheDocument();
    expect(main?.querySelector('.ord-a__main .ord-panel')).toBeInTheDocument();
    expect(main?.querySelector('.ord-a__side .ord-a__summary')).toBeInTheDocument();
    expect(main?.querySelectorAll('.ord-loading__track-item')).toHaveLength(5);
    expect(main?.querySelectorAll('.ord-loading__line')).not.toHaveLength(0);
  });
});

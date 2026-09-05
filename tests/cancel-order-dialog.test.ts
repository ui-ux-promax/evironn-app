/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type SVGProps } from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cancelOrder: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions/order', () => ({ cancelOrder: mocks.cancelOrder }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/components/loading-ui/fade-arc', () => ({
  FadeArc: (props: SVGProps<SVGSVGElement>) => createElement('svg', { 'data-testid': 'fade-arc', ...props }),
}));

import { CancelOrderButton } from '@/components/shared/orders/cancel-order-button';

beforeEach(() => {
  mocks.cancelOrder.mockReset();
  mocks.refresh.mockReset();
});

afterEach(cleanup);

describe('customer order cancellation dialog', () => {
  it('replaces the browser confirmation with the Ritm dialog', () => {
    const source = readFileSync('components/shared/orders/cancel-order-button.tsx', 'utf8');

    expect(source).not.toContain('window.confirm');
    expect(source).toContain('<Dialog.Root');
    expect(source).toContain('Отменить заказ?');
    expect(source).toContain('Не отменять');
    expect(source).toContain('<Button variant="danger" onClick={confirmCancellation} loading={busy}>');
    expect(source).toContain('Отменить заказ');
  });

  it('keeps the cancellation label beside FadeArc, blocks duplicates, and restores after rejection', async () => {
    let rejectCancellation!: (error: Error) => void;
    mocks.cancelOrder.mockReturnValue(new Promise((_, reject) => (rejectCancellation = reject)));
    render(createElement(CancelOrderButton, { orderId: 'order-1' }));

    const openButton = screen.getByRole('button', { name: 'Отменить заказ' });
    fireEvent.click(openButton);
    const confirm = await waitFor(() => {
      const candidate = Array.from(document.querySelectorAll('button')).find(
        (button) => button !== openButton && button.textContent?.includes('Отменить заказ'),
      );
      if (!candidate) throw new Error('confirmation button not rendered');
      return candidate;
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(mocks.cancelOrder).toHaveBeenCalledWith('order-1'));
    expect(mocks.cancelOrder).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(confirm).toHaveTextContent('Отменить заказ');
    expect(confirm.querySelector('[data-testid="fade-arc"]')).toHaveAttribute('aria-hidden', 'true');

    rejectCancellation(new Error('network down'));
    await waitFor(() => expect(confirm).toBeEnabled());
    expect(confirm).not.toHaveAttribute('aria-busy', 'true');
    expect(confirm.querySelector('[data-testid="fade-arc"]')).toBeNull();
  });
});

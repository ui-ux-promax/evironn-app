/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type SVGProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submitReview: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions/review', () => ({ submitReview: mocks.submitReview }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/components/loading-ui/fade-arc', () => ({
  FadeArc: (props: SVGProps<SVGSVGElement>) => createElement('svg', { 'data-testid': 'fade-arc', ...props }),
}));

import { ReviewForm } from '@/components/shared/product/review-form';

beforeEach(() => {
  mocks.submitReview.mockReset();
  mocks.refresh.mockReset();
});

afterEach(cleanup);

describe('review form async feedback', () => {
  it('restores the submit control and shows the rejection after one guarded request', async () => {
    let rejectSubmit!: (error: Error) => void;
    mocks.submitReview.mockReturnValue(new Promise((_, reject) => (rejectSubmit = reject)));
    render(<ReviewForm productId="product-1" />);

    fireEvent.click(screen.getByRole('radio', { name: '5 из 5' }));
    const submit = screen.getByRole('button', { name: 'Оставить отзыв' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(mocks.submitReview).toHaveBeenCalledTimes(1));
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
    expect(submit).toHaveTextContent('Оставить отзыв');
    expect(submit.querySelector('[data-testid="fade-arc"]')).toHaveAttribute('aria-hidden', 'true');

    rejectSubmit(new Error('Отзыв временно недоступен'));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(submit).not.toHaveAttribute('aria-busy', 'true');
    expect(submit.querySelector('[data-testid="fade-arc"]')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Отзыв временно недоступен');
  });
});

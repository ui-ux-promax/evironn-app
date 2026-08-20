/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromoCodeField } from '@/components/shared/promo-code-field';
import { useCouponStore } from '@/store/coupon';

const validateCoupon = vi.hoisted(() => vi.fn());

vi.mock('@/app/actions/coupon', () => ({ validateCoupon }));

afterEach(() => {
  cleanup();
  validateCoupon.mockReset();
  useCouponStore.setState({ coupon: null });
});

describe('PromoCodeField', () => {
  it('disables the input and shows a spinner while applying a promo code', async () => {
    let resolveCoupon: (value: {
      ok: true;
      code: string;
      percent: number;
      discount: number;
      totals: {
        subtotal: number;
        compareAtSubtotal: number;
        saleDiscount: number;
        couponDiscount: number;
        total: number;
        itemCount: number;
        lineCount: number;
      };
    }) => void;
    validateCoupon.mockReturnValue(
      new Promise((resolve) => {
        resolveCoupon = resolve;
      }),
    );
    render(React.createElement(PromoCodeField));

    fireEvent.change(screen.getByRole('textbox', { name: 'Промокод' }), { target: { value: 'ritm10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));

    expect((screen.getByRole('textbox', { name: 'Промокод' }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByRole('status', { name: 'Проверка промокода' })).toBeTruthy();

    resolveCoupon!({
      ok: true,
      code: 'RITM10',
      percent: 10,
      discount: 550,
      totals: {
        subtotal: 5500,
        compareAtSubtotal: 5500,
        saleDiscount: 0,
        couponDiscount: 550,
        total: 4950,
        itemCount: 1,
        lineCount: 1,
      },
    });

    await waitFor(() => {
      expect(useCouponStore.getState().coupon).toEqual({
        code: 'RITM10',
        percent: 10,
        discount: 550,
        totals: {
          subtotal: 5500,
          compareAtSubtotal: 5500,
          saleDiscount: 0,
          couponDiscount: 550,
          total: 4950,
          itemCount: 1,
          lineCount: 1,
        },
      });
    });
  });
});

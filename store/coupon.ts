import { create } from 'zustand';
import type { CartTotalsDto } from '@/services/dto/commerce-cart.dto';

export interface AppliedCoupon {
  code: string;
  percent: number;
  discount?: number;
  totals?: CartTotalsDto;
}

interface CouponState {
  coupon: AppliedCoupon | null;
  setCoupon: (coupon: AppliedCoupon) => void;
  clearCoupon: () => void;
}

export const useCouponStore = create<CouponState>((set) => ({
  coupon: null,
  setCoupon: (coupon) => set({ coupon }),
  clearCoupon: () => set({ coupon: null }),
}));

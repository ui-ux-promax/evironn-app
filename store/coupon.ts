import { create } from 'zustand';

export interface AppliedCoupon {
  code: string;
  percent: number;
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

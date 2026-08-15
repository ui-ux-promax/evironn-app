import { create } from 'zustand';
import { Api } from '@/services/api-client';
import type { CreateCartItemValues } from '@/services/dto/cart.dto';
import type { CartDto, CartLineDto, CartTotalsDto } from '@/services/dto/commerce-cart.dto';
import { useCouponStore } from './coupon';

export interface CartState {
  loading: boolean;
  error: boolean;
  totalAmount: number;
  items: CartLineDto[];
  totals: CartTotalsDto;
  fetchCartItems: () => Promise<CartDto>;
  addCartItem: (values: CreateCartItemValues) => Promise<CartDto>;
  updateItemQuantity: (id: string, quantity: number) => Promise<CartDto>;
  removeCartItem: (id: string) => Promise<CartDto>;
  clearCart: () => Promise<CartDto>;
}

const emptyTotals: CartTotalsDto = {
  subtotal: 0,
  compareAtSubtotal: 0,
  saleDiscount: 0,
  couponDiscount: 0,
  total: 0,
  itemCount: 0,
  lineCount: 0,
};

function setSnapshot(data: CartDto): Pick<CartState, 'items' | 'totals' | 'totalAmount'> {
  return { items: data.items, totals: data.totals, totalAmount: data.totals.subtotal };
}

function setMutationSnapshot(data: CartDto): Pick<CartState, 'items' | 'totals' | 'totalAmount'> {
  useCouponStore.getState().clearCoupon();
  return setSnapshot(data);
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totals: emptyTotals,
  error: false,
  loading: true,
  totalAmount: 0,

  fetchCartItems: async () => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.getCart();
      set(setSnapshot(data));
      return data;
    } catch (error) {
      console.error(error);
      set({ error: true });
      return { items: get().items, totals: get().totals };
    } finally {
      set({ loading: false });
    }
  },

  addCartItem: async (values) => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.addCartItem(values);
      set(setMutationSnapshot(data));
      return data;
    } catch (error) {
      console.error(error);
      set({ error: true });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateItemQuantity: async (id, quantity) => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.updateItemQuantity(id, quantity);
      set(setMutationSnapshot(data));
      return data;
    } catch (error) {
      console.error(error);
      set({ error: true });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeCartItem: async (id) => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.removeCartItem(id);
      set(setMutationSnapshot(data));
      return data;
    } catch (error) {
      console.error(error);
      set({ error: true });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearCart: async () => {
    try {
      set({ loading: true, error: false });
      const data = await Api.cart.clearCart();
      set(setMutationSnapshot(data));
      return data;
    } catch (error) {
      console.error(error);
      set({ error: true });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

import { create } from 'zustand';
import { Api } from '@/services/api-client';
import type { CreateCartItemValues } from '@/services/dto/cart.dto';
import type { CartDto, CartLineDto, CartTotalsDto } from '@/services/dto/commerce-cart.dto';

export interface CartState {
  loading: boolean;
  error: boolean;
  totalAmount: number;
  items: CartLineDto[];
  totals: CartTotalsDto;
  fetchCartItems: () => Promise<void>;
  addCartItem: (values: CreateCartItemValues) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  removeCartItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
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

export const useCartStore = create<CartState>((set) => ({
  items: [],
  totals: emptyTotals,
  error: false,
  loading: true,
  totalAmount: 0,

  fetchCartItems: async () => {
    try {
      set({ loading: true, error: false });
      set(setSnapshot(await Api.cart.getCart()));
    } catch (error) {
      console.error(error);
      set({ error: true });
    } finally {
      set({ loading: false });
    }
  },

  addCartItem: async (values) => {
    try {
      set({ loading: true, error: false });
      set(setSnapshot(await Api.cart.addCartItem(values)));
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
      set(setSnapshot(await Api.cart.updateItemQuantity(id, quantity)));
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
      set(setSnapshot(await Api.cart.removeCartItem(id)));
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
      set(setSnapshot(await Api.cart.clearCart()));
    } catch (error) {
      console.error(error);
      set({ error: true });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

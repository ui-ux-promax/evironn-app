'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToWishlist, toggleWishlist } from '@/app/actions/wishlist';
import { validateCoupon } from '@/app/actions/coupon';
import { useCartStore } from '@/store/cart';
import { useCouponStore } from '@/store/coupon';
import type { CartLineDto, CartTotalsDto } from '@/services/dto/commerce-cart.dto';
import type { PromoState } from './cart-primitives';

export interface CartVariantAActions {
  step(itemId: string, quantity: number): Promise<void>;
  remove(itemId: string): Promise<void>;
  clear(): Promise<void>;
  undo(): Promise<void>;
  saveToWishlist(item: CartLineDto): Promise<void>;
  addRelated(skuId: string): Promise<void>;
  applyCoupon(code: string): Promise<void>;
  clearCoupon(): void;
}

type RemovedItem = { item: CartLineDto; index: number };

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Не удалось обновить корзину';
}

export function useCartVariantA() {
  const cart = useCartStore((state) => state);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const coupon = useCouponStore((state) => state.coupon);
  const setStoredCoupon = useCouponStore((state) => state.setCoupon);
  const clearStoredCoupon = useCouponStore((state) => state.clearCoupon);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, setPromoPending] = useState(false);
  const [removed, setRemoved] = useState<RemovedItem | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCartItems();
  }, [fetchCartItems]);

  const clearAppliedCoupon = useCallback(() => {
    clearStoredCoupon();
    setPromoInput('');
    setPromoError(null);
  }, [clearStoredCoupon]);

  const runMutation = useCallback(
    async (mutation: () => Promise<unknown>) => {
      setError(null);
      try {
        await mutation();
        clearAppliedCoupon();
      } catch (reason) {
        setError(errorMessage(reason));
        throw reason;
      }
    },
    [clearAppliedCoupon],
  );

  const actions = useMemo(
    () => ({
      step: async (itemId: string, quantity: number) => runMutation(() => cart.updateItemQuantity(itemId, quantity)),
      remove: async (itemId: string) => {
        const index = cart.items.findIndex((item) => item.id === itemId);
        const item = index === -1 ? null : cart.items[index];
        if (!item) return;
        await runMutation(() => cart.removeCartItem(itemId));
        setRemoved({ item, index });
      },
      clear: async () => {
        await runMutation(() => cart.clearCart());
        setRemoved(null);
      },
      undo: async () => {
        if (!removed) return;
        await runMutation(() => cart.addCartItem({ skuId: removed.item.skuId, quantity: removed.item.quantity }));
        setRemoved(null);
      },
      saveToWishlist: async (item: CartLineDto) => {
        setError(null);
        try {
          const result = await addToWishlist({ productId: item.productId });
          if (!result.ok) throw new Error(result.error);
          const index = cart.items.findIndex((current) => current.id === item.id);
          await cart.removeCartItem(item.id);
          clearAppliedCoupon();
          setRemoved({ item, index: Math.max(0, index) });
          setSavedMessage('Товар сохранён в избранное');
        } catch (reason) {
          setError(errorMessage(reason));
          throw reason;
        }
      },
      addRelated: async (skuId: string) => runMutation(() => cart.addCartItem({ skuId, quantity: 1 })),
      applyCoupon: async (code: string) => {
        setPromoPending(true);
        setPromoError(null);
        setError(null);
        try {
          const result = await validateCoupon(code);
          if (!result.ok) {
            clearStoredCoupon();
            setPromoError(result.error);
            return;
          }
          setStoredCoupon({
            code: result.code,
            percent: result.percent,
            discount: result.discount,
            totals: result.totals,
          });
          setPromoInput(result.code);
        } catch (reason) {
          setPromoError(errorMessage(reason));
          clearStoredCoupon();
        } finally {
          setPromoPending(false);
        }
      },
      clearCoupon: clearAppliedCoupon,
      toggleWishlist,
      dismissUndo: () => setRemoved(null),
      typePromo: (input: string) => {
        if (coupon) clearAppliedCoupon();
        setPromoInput(input);
        setPromoError(null);
      },
    }),
    [cart, clearAppliedCoupon, clearStoredCoupon, coupon, removed, runMutation, setStoredCoupon],
  );

  const totals: CartTotalsDto = coupon?.totals ?? cart.totals;
  const promo: PromoState = coupon
    ? { input: coupon.code, code: coupon.code, percent: coupon.percent, status: 'applied' }
    : {
        input: promoInput,
        code: '',
        percent: 0,
        status: promoError ? 'invalid' : 'idle',
        message: promoError ?? undefined,
      };

  return {
    items: cart.items,
    totals,
    loading: cart.loading,
    error: error ?? (cart.error ? 'Не удалось обновить корзину' : null),
    removed,
    savedMessage,
    promo,
    promoPending,
    actions,
  };
}

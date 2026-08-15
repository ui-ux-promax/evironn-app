'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addToWishlist, toggleWishlist } from '@/app/actions/wishlist';
import { validateCoupon } from '@/app/actions/coupon';
import { useCartStore } from '@/store/cart';
import { useCouponStore } from '@/store/coupon';
import { useWishlistStore } from '@/store/wishlist';
import type { CartLineDto, CartTotalsDto } from '@/services/dto/commerce-cart.dto';
import type { WishlistMutationResult } from '@/services/dto/wishlist.dto';
import type { PromoState } from './cart-primitives';

export interface CartVariantAActions {
  step(itemId: string, quantity: number): Promise<void>;
  remove(itemId: string): Promise<void>;
  clear(): Promise<void>;
  undo(): Promise<void>;
  saveToWishlist(item: CartLineDto): Promise<void>;
  addRelated(skuId: string): Promise<void>;
  toggleWishlist(productId: string): Promise<WishlistMutationResult>;
  applyCoupon(code: string): Promise<void>;
  clearCoupon(): void;
}

type RemovedItem = { item: CartLineDto; index: number };

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Не удалось обновить корзину';
}

function isCompleteCartTotals(value: unknown): value is CartTotalsDto {
  if (!value || typeof value !== 'object') return false;
  const totals = value as Record<string, unknown>;
  return ['subtotal', 'compareAtSubtotal', 'saleDiscount', 'couponDiscount', 'total', 'itemCount', 'lineCount'].every(
    (key) => typeof totals[key] === 'number' && Number.isFinite(totals[key]),
  );
}

export function useCartVariantA(initialWishlistedIds: string[]) {
  const cart = useCartStore((state) => state);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const coupon = useCouponStore((state) => state.coupon);
  const setStoredCoupon = useCouponStore((state) => state.setCoupon);
  const clearStoredCoupon = useCouponStore((state) => state.clearCoupon);
  const refreshWishlistCount = useWishlistStore((state) => state.refreshAfterMutation);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, setPromoPending] = useState(false);
  const [removed, setRemoved] = useState<RemovedItem | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState(() => new Set(initialWishlistedIds));
  const cartRevisionRef = useRef(0);
  const couponRequestRef = useRef(0);
  const initialWishlistedKey = JSON.stringify(initialWishlistedIds);

  useEffect(() => setWishlistedIds(new Set(initialWishlistedIds)), [initialWishlistedKey]);

  useEffect(() => {
    void fetchCartItems();
  }, [fetchCartItems]);

  const clearAppliedCoupon = useCallback(() => {
    couponRequestRef.current += 1;
    setPromoPending(false);
    clearStoredCoupon();
    setPromoInput('');
    setPromoError(null);
  }, [clearStoredCoupon]);

  const runMutation = useCallback(
    async (mutation: () => Promise<unknown>) => {
      cartRevisionRef.current += 1;
      couponRequestRef.current += 1;
      setPromoPending(false);
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
          setWishlistedIds((current) => {
            const next = new Set(current);
            if (result.active) next.add(item.productId);
            else next.delete(item.productId);
            return next;
          });
          await refreshWishlistCount();
          const index = cart.items.findIndex((current) => current.id === item.id);
          cartRevisionRef.current += 1;
          couponRequestRef.current += 1;
          setPromoPending(false);
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
      toggleWishlist: async (productId: string): Promise<WishlistMutationResult> => {
        const wasWishlisted = wishlistedIds.has(productId);
        setWishlistedIds((current) => {
          const next = new Set(current);
          if (wasWishlisted) next.delete(productId);
          else next.add(productId);
          return next;
        });
        try {
          const result = await toggleWishlist({ productId });
          if (!result.ok) {
            setWishlistedIds((current) => {
              const next = new Set(current);
              if (wasWishlisted) next.add(productId);
              else next.delete(productId);
              return next;
            });
            return result;
          }
          setWishlistedIds((current) => {
            const next = new Set(current);
            if (result.active) next.add(productId);
            else next.delete(productId);
            return next;
          });
          await refreshWishlistCount();
          return result;
        } catch (reason) {
          setWishlistedIds((current) => {
            const next = new Set(current);
            if (wasWishlisted) next.add(productId);
            else next.delete(productId);
            return next;
          });
          throw reason;
        }
      },
      applyCoupon: async (code: string) => {
        const requestRevision = ++couponRequestRef.current;
        const cartRevision = cartRevisionRef.current;
        setPromoPending(true);
        setPromoError(null);
        setError(null);
        try {
          const result = await validateCoupon(code);
          if (requestRevision !== couponRequestRef.current || cartRevision !== cartRevisionRef.current) return;
          if (!result.ok) {
            clearStoredCoupon();
            setPromoError(result.error);
            return;
          }
          if (!isCompleteCartTotals(result.totals)) throw new Error('Некорректный ответ сервера');
          setStoredCoupon({
            code: result.code,
            percent: result.percent,
            discount: result.discount,
            totals: result.totals,
          });
          setPromoInput(result.code);
        } catch (reason) {
          if (requestRevision !== couponRequestRef.current || cartRevision !== cartRevisionRef.current) return;
          setPromoError(errorMessage(reason));
          clearStoredCoupon();
        } finally {
          if (requestRevision === couponRequestRef.current) setPromoPending(false);
        }
      },
      clearCoupon: clearAppliedCoupon,
      dismissUndo: () => setRemoved(null),
      typePromo: (input: string) => {
        if (coupon) clearAppliedCoupon();
        setPromoInput(input);
        setPromoError(null);
      },
    }),
    [
      cart,
      clearAppliedCoupon,
      clearStoredCoupon,
      coupon,
      refreshWishlistCount,
      removed,
      runMutation,
      setStoredCoupon,
      wishlistedIds,
    ],
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
    wishlistedIds,
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

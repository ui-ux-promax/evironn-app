import React from 'react';
import { useCartStore } from '@/store';

export const useCart = () => {
  const state = useCartStore((s) => s);
  const fetchCartItems = useCartStore((s) => s.fetchCartItems);
  React.useEffect(() => {
    void fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
};

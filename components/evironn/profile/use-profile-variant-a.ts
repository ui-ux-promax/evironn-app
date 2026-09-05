'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { addAddress, deleteAddress, setDefaultAddress } from '@/app/actions/address';
import { updatePassword, updateProfile } from '@/app/actions/profile';
import { toggleWishlist } from '@/app/actions/wishlist';
import { useCartStore } from '@/store/cart';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import type { ProfileAddressDto, ProfilePageDto, ProfileSection } from '@/services/dto/profile-page.dto';
import type { ProfileValues } from '@/services/dto/auth.dto';

export type ProfileAddressValues = {
  label: string;
  city: string;
  street: string;
  comment: string;
};

export type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
};

function messageFor(reason: unknown): string {
  return reason instanceof Error && reason.message ? reason.message : 'Не удалось выполнить действие';
}

function initialsFor(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] ?? email.split('@')[0] ?? '').slice(0, 2).toUpperCase();
}

function normalizeIsoDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function normalizeProfileDto(dto: ProfilePageDto): ProfilePageDto {
  const name = dto.user.name.trim();
  return {
    ...dto,
    user: {
      ...dto.user,
      name,
      phone: dto.user.phone.trim(),
      birthdate: normalizeIsoDate(dto.user.birthdate),
      createdAt: normalizeIsoDate(dto.user.createdAt),
      initials: initialsFor(name, dto.user.email),
    },
    stats: { ...dto.stats },
    orders: [...dto.orders],
    favorites: [...dto.favorites],
    addresses: [...dto.addresses],
  };
}

type OptimisticFavoriteMutation = {
  active: boolean;
  product?: CatalogBCard;
  token: symbol;
};

function reconcileProfileDto(
  dto: ProfilePageDto,
  optimisticFavorites: Map<string, OptimisticFavoriteMutation>,
): ProfilePageDto {
  const normalized = normalizeProfileDto(dto);
  if (optimisticFavorites.size === 0) return normalized;

  const favorites = [...normalized.favorites];
  for (const [productId, mutation] of optimisticFavorites) {
    const index = favorites.findIndex((product) => product.id === productId);
    if (!mutation.active) {
      if (index === -1 && mutation.product) favorites.push(mutation.product);
      continue;
    }
    if (index === -1 && mutation.product) favorites.push(mutation.product);
  }

  return {
    ...normalized,
    favorites,
    stats: {
      ...normalized.stats,
      favorites: Math.max(
        0,
        normalized.stats.favorites -
          [...optimisticFavorites.values()].filter(
            (mutation) =>
              !mutation.active &&
              mutation.product &&
              normalized.favorites.some((product) => product.id === mutation.product?.id),
          ).length,
      ),
    },
  };
}

function rollbackFavorite(
  current: ProfilePageDto,
  productId: string,
  toggledProduct: CatalogBCard | undefined,
): ProfilePageDto {
  const favorites = toggledProduct
    ? current.favorites.some((product) => product.id === productId)
      ? current.favorites
      : [...current.favorites, toggledProduct]
    : current.favorites.filter((product) => product.id !== productId);

  return { ...current, favorites, stats: { ...current.stats, favorites: favorites.length } };
}

export function useProfileVariantA(dto: ProfilePageDto) {
  const router = useRouter();
  const addCartItem = useCartStore((state) => state.addCartItem);
  const normalizedDto = useMemo(() => normalizeProfileDto(dto), [dto]);
  const [data, setData] = useState(normalizedDto);
  const optimisticFavorites = useRef(new Map<string, OptimisticFavoriteMutation>());
  const [section, setSection] = useState<ProfileSection>('overview');
  const [error, setError] = useState('');
  const [pendingActions, setPendingActions] = useState<ReadonlySet<string>>(() => new Set());
  const pendingActionsRef = useRef(new Set<string>());

  useEffect(() => {
    setData(reconcileProfileDto(normalizedDto, optimisticFavorites.current));
  }, [normalizedDto]);

  const runPending = useCallback(async <T>(key: string, operation: () => Promise<T>): Promise<T | undefined> => {
    if (pendingActionsRef.current.has(key)) return undefined;
    pendingActionsRef.current.add(key);
    setPendingActions(new Set(pendingActionsRef.current));
    try {
      return await operation();
    } finally {
      pendingActionsRef.current.delete(key);
      setPendingActions(new Set(pendingActionsRef.current));
    }
  }, []);

  const run = useCallback(
    async (key: string, operation: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
      if (pendingActionsRef.current.has(key)) return false;
      setError('');
      try {
        const result = await runPending(key, operation);
        if (!result) return false;
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        return true;
      } catch (reason) {
        setError(messageFor(reason));
        return false;
      }
    },
    [runPending],
  );

  const saveProfile = useCallback(
    async (values: ProfileValues) => {
      const ok = await run('profile:save', () => updateProfile(values));
      if (ok) {
        setData((current) => {
          const name = values.name?.trim() ?? current.user.name;
          const phone = values.phone?.trim() ?? current.user.phone;
          return {
            ...current,
            user: {
              ...current.user,
              name,
              phone,
              birthdate: normalizeIsoDate(values.birthdate ?? current.user.birthdate),
              email: current.user.email,
              initials: initialsFor(name, current.user.email),
            },
          };
        });
        router.refresh();
      }
    },
    [router, run],
  );

  const savePassword = useCallback(
    async (values: PasswordValues) => {
      const ok = await run('password:save', () => updatePassword(values));
      if (ok) router.refresh();
    },
    [router, run],
  );

  const addProfileAddress = useCallback(
    async (values: ProfileAddressValues) => {
      if (pendingActionsRef.current.has('address:add')) return false;
      setError('');
      try {
        const result = await runPending('address:add', () => addAddress(values));
        if (!result) return false;
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        const address: ProfileAddressDto = {
          id: result.id,
          ...values,
          comment: values.comment || null,
          isDefault: data.addresses.length === 0,
        };
        setData((current) => ({
          ...current,
          addresses: [...current.addresses, address],
          stats: { ...current.stats, addresses: current.stats.addresses + 1 },
        }));
        router.refresh();
        return true;
      } catch (reason) {
        setError(messageFor(reason));
        return false;
      }
    },
    [data.addresses.length, router, runPending],
  );

  const removeProfileAddress = useCallback(
    async (id: string) => {
      const ok = await run(`address:${id}:delete`, () => deleteAddress(id));
      if (!ok) return;
      setData((current) => {
        const addresses = current.addresses.filter((address) => address.id !== id);
        if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
          addresses[0] = { ...addresses[0], isDefault: true };
        }
        return { ...current, addresses, stats: { ...current.stats, addresses: addresses.length } };
      });
      router.refresh();
    },
    [router, run],
  );

  const makeDefaultAddress = useCallback(
    async (id: string) => {
      const ok = await run(`address:${id}:default`, () => setDefaultAddress(id));
      if (!ok) return;
      setData((current) => ({
        ...current,
        addresses: current.addresses.map((address) => ({ ...address, isDefault: address.id === id })),
      }));
      router.refresh();
    },
    [router, run],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const toggledProduct = data.favorites.find((product) => product.id === productId);
      const token = Symbol(productId);
      const key = `favorite:${productId}:remove`;
      if (pendingActionsRef.current.has(key)) return { ok: false as const, error: 'ACTION_PENDING' };
      optimisticFavorites.current.set(productId, { active: false, product: toggledProduct, token });
      setData((current) => ({
        ...current,
        stats: { ...current.stats, favorites: Math.max(0, current.stats.favorites - 1) },
      }));
      setError('');
      try {
        const result = await runPending(key, () => toggleWishlist({ productId }));
        if (!result) return { ok: false as const, error: 'ACTION_PENDING' };
        if (!result.ok) {
          setData((current) => rollbackFavorite(current, productId, toggledProduct));
          setError(result.error);
          return result;
        }
        optimisticFavorites.current.set(productId, { active: result.active, product: toggledProduct, token });
        setData((current) => {
          const favorites = result.active
            ? toggledProduct && !current.favorites.some((product) => product.id === productId)
              ? [...current.favorites, toggledProduct]
              : current.favorites
            : current.favorites.filter((product) => product.id !== productId);
          return { ...current, favorites, stats: { ...current.stats, favorites: favorites.length } };
        });
        router.refresh();
        return result;
      } catch (reason) {
        setData((current) => rollbackFavorite(current, productId, toggledProduct));
        setError(messageFor(reason));
        return { ok: false as const, error: messageFor(reason) };
      } finally {
        if (optimisticFavorites.current.get(productId)?.token === token) optimisticFavorites.current.delete(productId);
      }
    },
    [data.favorites, router, runPending],
  );

  const addFavoriteToCart = useCallback(
    async (skuId: string | null, soldOut: boolean) => {
      if (!skuId || soldOut) return false;
      const key = `favorite:${skuId}:cart`;
      if (pendingActionsRef.current.has(key)) return false;
      setError('');
      try {
        await runPending(key, () => addCartItem({ skuId, quantity: 1 }));
        router.refresh();
        return true;
      } catch (reason) {
        setError(messageFor(reason));
        return false;
      }
    },
    [addCartItem, router, runPending],
  );

  const logout = useCallback(async () => {
    if (pendingActionsRef.current.has('logout')) return false;
    setError('');
    try {
      await runPending('logout', () => signOut({ callbackUrl: '/' }));
      return true;
    } catch (reason) {
      setError(messageFor(reason));
      return false;
    }
  }, [runPending]);

  const pending = pendingActions.size > 0;

  return useMemo(
    () => ({
      data,
      section,
      error,
      pending,
      pendingActions,
      actions: {
        go: setSection,
        saveProfile,
        savePassword,
        addAddress: addProfileAddress,
        deleteAddress: removeProfileAddress,
        setDefaultAddress: makeDefaultAddress,
        toggleFavorite,
        addFavoriteToCart,
        logout,
      },
    }),
    [
      addFavoriteToCart,
      addProfileAddress,
      data,
      error,
      logout,
      makeDefaultAddress,
      pending,
      pendingActions,
      removeProfileAddress,
      savePassword,
      saveProfile,
      section,
      toggleFavorite,
    ],
  );
}

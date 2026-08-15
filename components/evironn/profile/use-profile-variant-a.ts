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
      if (index !== -1) favorites.splice(index, 1);
      continue;
    }
    if (index === -1 && mutation.product) favorites.push(mutation.product);
  }

  return {
    ...normalized,
    favorites,
    stats: { ...normalized.stats, favorites: favorites.length },
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
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setData(reconcileProfileDto(normalizedDto, optimisticFavorites.current));
  }, [normalizedDto]);

  const run = useCallback(async (operation: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setPending(true);
    setError('');
    try {
      const result = await operation();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (reason) {
      setError(messageFor(reason));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const saveProfile = useCallback(
    async (values: ProfileValues) => {
      const ok = await run(() => updateProfile(values));
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
      const ok = await run(() => updatePassword(values));
      if (ok) router.refresh();
    },
    [router, run],
  );

  const addProfileAddress = useCallback(
    async (values: ProfileAddressValues) => {
      setPending(true);
      setError('');
      try {
        const result = await addAddress(values);
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
      } finally {
        setPending(false);
      }
    },
    [data.addresses.length, router],
  );

  const removeProfileAddress = useCallback(
    async (id: string) => {
      const ok = await run(() => deleteAddress(id));
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
      const ok = await run(() => setDefaultAddress(id));
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
      optimisticFavorites.current.set(productId, { active: false, product: toggledProduct, token });
      setData((current) => ({
        ...current,
        favorites: current.favorites.filter((product) => product.id !== productId),
        stats: { ...current.stats, favorites: Math.max(0, current.stats.favorites - 1) },
      }));
      setError('');
      try {
        const result = await toggleWishlist({ productId });
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
    [data.favorites, router],
  );

  const addFavoriteToCart = useCallback(
    async (skuId: string | null, soldOut: boolean) => {
      if (!skuId || soldOut) return false;
      setPending(true);
      setError('');
      try {
        await addCartItem({ skuId, quantity: 1 });
        router.refresh();
        return true;
      } catch (reason) {
        setError(messageFor(reason));
        return false;
      } finally {
        setPending(false);
      }
    },
    [addCartItem, router],
  );

  const logout = useCallback(() => signOut({ callbackUrl: '/' }), []);

  return useMemo(
    () => ({
      data,
      section,
      error,
      pending,
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
      removeProfileAddress,
      savePassword,
      saveProfile,
      section,
      toggleFavorite,
    ],
  );
}

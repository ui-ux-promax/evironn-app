'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export function useCatalogUrl() {
  const router = useRouter();
  const sp = useSearchParams();

  const getList = useCallback((key: string) => unique(sp.get(key)?.split(',') ?? []), [sp]);
  const get = useCallback((key: string) => sp.get(key) ?? '', [sp]);

  const push = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(sp.toString());
      mutate(params);
      params.delete('page');
      const query = params.toString();
      router.push(query ? `/catalog?${query}` : '/catalog', { scroll: false });
    },
    [router, sp],
  );

  const toggleInList = useCallback(
    (key: string, value: string) =>
      push((params) => {
        const current = unique(params.get(key)?.split(',') ?? []);
        const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
        if (next.length) params.set(key, next.join(','));
        else params.delete(key);
      }),
    [push],
  );

  const setParam = useCallback(
    (key: string, value: string | null) =>
      push((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      }),
    [push],
  );

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(sp.toString());
      if (page > 1) params.set('page', String(page));
      else params.delete('page');
      const query = params.toString();
      router.push(query ? `/catalog?${query}` : '/catalog', { scroll: false });
    },
    [router, sp],
  );

  const setParams = useCallback(
    (entries: Record<string, string | null>) =>
      push((params) => {
        for (const [key, value] of Object.entries(entries)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
      }),
    [push],
  );

  const reset = useCallback(() => router.push('/catalog', { scroll: false }), [router]);

  return { sp, get, getList, toggleInList, setParam, setParams, setPage, reset };
}

'use client';

import { useEffect, useRef, useState } from 'react';

export interface CheckoutAddressSuggestion {
  value: string;
  city: string | null;
  region: string | null;
  street: string | null;
  house: string | null;
}

export function AddressSuggest({
  query,
  active,
  disabled,
  onSelect,
}: {
  query: string;
  active: boolean;
  disabled: boolean;
  onSelect: (suggestion: CheckoutAddressSuggestion) => void;
}) {
  const [items, setItems] = useState<CheckoutAddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!active || disabled || query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/dadata/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (currentRequest !== requestId.current) return;
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        setItems(suggestions);
        setOpen(suggestions.length > 0);
      } catch {
        if (!controller.signal.aborted && currentRequest === requestId.current) {
          setItems([]);
          setOpen(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, disabled, query]);

  if (!open || items.length === 0) return null;

  return (
    <ul className="chk-address-suggest" role="listbox" aria-label="Подсказки адреса">
      {items.map((suggestion) => (
        <li key={suggestion.value}>
          <button type="button" onClick={() => onSelect(suggestion)}>
            {suggestion.value}
          </button>
        </li>
      ))}
    </ul>
  );
}

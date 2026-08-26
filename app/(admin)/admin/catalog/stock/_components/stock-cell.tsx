'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { setSkuStock } from '@/app/actions/admin/stock';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import type { AdminSkuStockRow } from '@/lib/admin/catalog';

export function StockCell({ row }: { row: AdminSkuStockRow }) {
  const router = useRouter();
  const [value, setValue] = React.useState(String(row.stock));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setValue(String(row.stock));
  }, [row.stock]);

  async function save() {
    const rawValue = value.trim();
    if (rawValue === '') {
      setError('Введите целое число от 0');
      return;
    }

    const nextStock = Number(rawValue);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Введите целое число от 0');
      return;
    }
    if (nextStock === row.stock) {
      setError(null);
      return;
    }

    setPending(true);
    setError(null);
    const result = await setSkuStock({ skuId: row.skuId, expectedStock: row.stock, nextStock });
    setPending(false);

    if (!result.ok) {
      if (result.code === 'STALE_VALUE' && typeof result.details?.currentStock === 'number') {
        setValue(String(result.details.currentStock));
        setError(`Остаток изменён. Текущее значение: ${result.details.currentStock}`);
      } else {
        setError(result.error);
      }
      return;
    }

    router.refresh();
  }

  return (
    <div className="min-w-[190px]" data-testid={`admin-stock-input-${row.skuId}`}>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Остаток ${row.articleNumber}`}
          type="number"
          min={0}
          step={1}
          value={value}
          disabled={pending}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void save();
          }}
          className="w-24 text-right tabular-nums"
        />
        <Button
          type="button"
          size="sm"
          loading={pending}
          disabled={nextValueUnchanged(value, row.stock)}
          onClick={() => void save()}
          data-testid={`admin-stock-save-${row.skuId}`}
        >
          Сохранить
        </Button>
      </div>
      {error && (
        <p
          className="mt-2 max-w-[260px] text-xs font-bold text-admin-error"
          data-testid={`admin-stock-stale-${row.skuId}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function nextValueUnchanged(value: string, currentStock: number): boolean {
  const rawValue = value.trim();
  return rawValue === '' || Number(rawValue) === currentStock;
}

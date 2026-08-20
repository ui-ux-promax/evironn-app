'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resyncOrderPayment } from '@/app/actions/order';
import type { OrderPageDto } from '@/services/dto/order-page.dto';

export function useProductionOrderController(order: OrderPageDto) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const resync = async () => {
    setBusy(true);
    const result = await resyncOrderPayment(order.orderNumber);
    setBusy(false);
    if (!result.ok) setNotice(result.error);
    else router.refresh();
  };
  return { busy, notice, resync };
}

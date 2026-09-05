'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resyncOrderPayment } from '@/app/actions/order';
import type { OrderPageDto } from '@/services/dto/order-page.dto';

export function useProductionOrderController(order: OrderPageDto) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const resync = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await resyncOrderPayment(order.orderNumber);
      if (!result.ok) setNotice(result.error);
      else router.refresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return { busy, notice, resync };
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCheckoutQuote } from '@/app/actions/checkout';
import { placeOrder } from '@/app/actions/order';
import { useCartStore } from '@/store/cart';
import type { CheckoutQuoteInput, PlaceOrderInput } from '@/services/dto/checkout.dto';
import type {
  BlockedPaymentInitializationDto,
  CheckoutPageDto,
  CheckoutQuoteDto,
  DeliveryMethod,
} from '@/services/dto/checkout-page.dto';

type Services = PlaceOrderInput['services'];
type Address = NonNullable<PlaceOrderInput['address']>;

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Не удалось обновить оформление заказа';
}

function slotsFor(data: CheckoutPageDto, method: DeliveryMethod) {
  return method === 'courier'
    ? data.initialSlots.courier
    : method === 'showroom'
      ? data.initialSlots.showroom
      : data.initialSlots.pickupPoint;
}

export function useCheckoutVariantA(initialData: CheckoutPageDto) {
  const router = useRouter();
  const cart = useCartStore((state) => state);
  const quoteRevisionRef = useRef(0);
  const mutationPendingRef = useRef(false);
  const initializedRef = useRef(false);
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethod>('courier');
  const [deliveryZone, setDeliveryZone] = useState<'moscow' | 'moscow-region'>('moscow');
  const [deliverySlotId, setDeliverySlotId] = useState(initialData.initialSlots.courier[0]?.id ?? '');
  const [pickupPointId, setPickupPointId] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialData.savedAddresses.find((address) => address.isDefault)?.id ?? 'new',
  );
  const [address, setAddress] = useState<Address>({
    city: initialData.addressDefaults?.city ?? 'Москва',
    addressLine: initialData.addressDefaults?.addressLine ?? '',
    addressComment: initialData.addressDefaults?.addressComment ?? undefined,
    floor: undefined,
    liftType: 'passenger',
    intercom: '',
  });
  const [services, setServices] = useState<Services>({ carrying: false, assembly: false, removal: false });
  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [quoteRequestVersion, setQuoteRequestVersion] = useState(0);
  const [contactName, setContactName] = useState(initialData.contactDefaults.contactName);
  const [contactPhone, setContactPhone] = useState(initialData.contactDefaults.contactPhone);
  const [contactEmail, setContactEmail] = useState(initialData.contactDefaults.contactEmail);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [quote, setQuote] = useState<CheckoutQuoteDto | null>(null);
  const [quotePending, setQuotePending] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [blocked, setBlocked] = useState<BlockedPaymentInitializationDto | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    useCartStore.setState({
      items: initialData.initialCart.items,
      totals: initialData.initialCart.totals,
      totalAmount: initialData.initialCart.totals.subtotal,
      loading: false,
      error: false,
    });
  }, [initialData.initialCart]);

  const quoteInput = useMemo<CheckoutQuoteInput>(
    () => ({
      deliveryMethod,
      deliveryZone: deliveryMethod === 'courier' ? deliveryZone : undefined,
      deliverySlotId,
      pickupPointId: deliveryMethod === 'courier' ? undefined : pickupPointId || undefined,
      address: deliveryMethod === 'courier' ? address : undefined,
      services: deliveryMethod === 'courier' ? services : { carrying: false, assembly: false, removal: false },
      couponCode: appliedCouponCode || undefined,
    }),
    [address, appliedCouponCode, deliveryMethod, deliverySlotId, deliveryZone, pickupPointId, services],
  );

  useEffect(() => {
    if (mutationPending) {
      ++quoteRevisionRef.current;
      setQuote(null);
      setQuotePending(false);
      setQuoteError(null);
      return;
    }
    if (cart.items.length === 0 || !deliverySlotId) {
      ++quoteRevisionRef.current;
      setQuote(null);
      setQuotePending(false);
      setQuoteError(null);
      return;
    }
    if (deliveryMethod !== 'courier' && !pickupPointId) {
      ++quoteRevisionRef.current;
      setQuote(null);
      setQuotePending(false);
      setQuoteError(null);
      return;
    }
    const revision = ++quoteRevisionRef.current;
    setQuote(null);
    setQuotePending(true);
    setQuoteError(null);
    void getCheckoutQuote(quoteInput)
      .then((result) => {
        if (revision !== quoteRevisionRef.current) return;
        if (!result.ok) {
          setQuote(null);
          setQuoteError(result.message);
          return;
        }
        setQuote(result.quote);
        setMutationError(null);
      })
      .catch((error) => {
        if (revision === quoteRevisionRef.current) {
          setQuote(null);
          setQuoteError(messageOf(error));
        }
      })
      .finally(() => {
        if (revision === quoteRevisionRef.current) setQuotePending(false);
      });
  }, [cart.items, quoteInput, deliveryMethod, deliverySlotId, pickupPointId, mutationPending, quoteRequestVersion]);

  const setDeliveryMethod = useCallback(
    (method: DeliveryMethod) => {
      setDeliveryMethodState(method);
      const slots = slotsFor(initialData, method);
      setDeliverySlotId(slots[0]?.id ?? '');
      if (method === 'courier') {
        setPickupPointId('');
      } else {
        const point = initialData.pickupPoints.find((candidate) => candidate.kind === method);
        setPickupPointId(point?.id ?? '');
        setServices({ carrying: false, assembly: false, removal: false });
      }
    },
    [initialData],
  );

  const pickAddress = useCallback(
    (id: string) => {
      setSelectedAddressId(id);
      const saved = initialData.savedAddresses.find((candidate) => candidate.id === id);
      if (!saved) return;
      setAddress((current) => ({
        ...current,
        city: saved.city.trim(),
        addressLine: saved.street.trim(),
        addressComment: saved.comment?.trim() || undefined,
      }));
    },
    [initialData.savedAddresses],
  );

  const mutateCart = useCallback(async (operation: () => Promise<unknown>) => {
    if (mutationPendingRef.current) return;
    mutationPendingRef.current = true;
    ++quoteRevisionRef.current;
    setQuote(null);
    setQuotePending(false);
    setQuoteError(null);
    setMutationError(null);
    setSubmitError(null);
    setCouponDraft('');
    setAppliedCouponCode('');
    setMutationPending(true);
    try {
      await operation();
    } catch (error) {
      setMutationError(messageOf(error));
    } finally {
      mutationPendingRef.current = false;
      setMutationPending(false);
    }
  }, []);

  const applyCoupon = useCallback(() => {
    const code = couponDraft.trim();
    setCouponDraft(code);
    setAppliedCouponCode(code);
    setQuoteRequestVersion((version) => version + 1);
  }, [couponDraft]);

  const clearCoupon = useCallback(() => {
    setCouponDraft('');
    setAppliedCouponCode('');
    setQuoteRequestVersion((version) => version + 1);
  }, []);

  const submit = useCallback(async () => {
    if (mutationPending || submitPending || submitLocked || !quote) return;
    setSubmitPending(true);
    setSubmitError(null);
    try {
      const payload: PlaceOrderInput = {
        ...quoteInput,
        contactName,
        contactPhone,
        contactEmail,
        paymentMethod,
      };
      const result = await placeOrder(payload);
      if (result.ok && result.code === 'PAYMENT_REDIRECT_READY') {
        window.location.assign(result.paymentUrl);
        return;
      }
      if (result.ok || result.code === 'PAYMENT_INITIALIZATION_PENDING') {
        router.replace(`/orders/${result.orderNumber}?placed=1`);
        return;
      }
      if (result.code === 'PAYMENT_INITIALIZATION_BLOCKED') {
        setBlocked(result.paymentInitialization);
        setSubmitLocked(true);
        router.replace(`/orders/${result.paymentInitialization.orderNumber}?placed=1`);
        return;
      }
      setSubmitError(result.error);
    } catch (error) {
      setSubmitError(messageOf(error));
    } finally {
      setSubmitPending(false);
    }
  }, [
    contactEmail,
    contactName,
    contactPhone,
    mutationPending,
    paymentMethod,
    quote,
    quoteInput,
    router,
    submitLocked,
    submitPending,
  ]);

  return {
    cart,
    quote,
    quotePending,
    quoteError,
    mutationPending,
    mutationError,
    submitPending,
    submitError,
    submitLocked,
    blocked,
    form: {
      deliveryMethod,
      deliveryZone,
      deliverySlotId,
      pickupPointId,
      selectedAddressId,
      address,
      services,
      couponDraft,
      appliedCouponCode,
      contactName,
      contactPhone,
      contactEmail,
      paymentMethod,
    },
    options: {
      delivery: initialData.deliveryOptions,
      pickupPoints: initialData.pickupPoints,
      savedAddresses: initialData.savedAddresses,
      slots: slotsFor(initialData, deliveryMethod),
    },
    actions: {
      setDeliveryMethod,
      setDeliveryZone,
      setDeliverySlotId,
      setPickupPointId,
      pickAddress,
      setAddress,
      setServices,
      setCouponDraft,
      applyCoupon,
      clearCoupon,
      setContactName,
      setContactPhone,
      setContactEmail,
      setPaymentMethod,
      step: (id: string, quantity: number) => mutateCart(() => cart.updateItemQuantity(id, quantity)),
      remove: (id: string) => mutateCart(() => cart.removeCartItem(id)),
      submit,
    },
  };
}

export type CheckoutVariantAController = ReturnType<typeof useCheckoutVariantA>;

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCheckoutQuote } from '@/app/actions/checkout';
import { placeOrder } from '@/app/actions/order';
import { useCartStore } from '@/store/cart';
import { EMPTY_CART_DTO } from '@/services/dto/commerce-cart.dto';
import type { CheckoutQuoteInput, PlaceOrderInput } from '@/services/dto/checkout.dto';
import type {
  BlockedPaymentInitializationDto,
  CheckoutPageDto,
  CheckoutQuoteDto,
  DeliveryMethod,
} from '@/services/dto/checkout-page.dto';

type Services = PlaceOrderInput['services'];
type Address = NonNullable<PlaceOrderInput['address']>;
type CompletedOrder = {
  orderNumber: number;
  heading: string;
  message: string;
  paymentUrl: string | null;
};

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
  const refreshCheckoutPage = router.refresh;
  const cart = useCartStore((state) => state);
  const quoteRevisionRef = useRef(0);
  const mutationPendingRef = useRef(false);
  const submitPendingRef = useRef(false);
  const submitLockedRef = useRef(false);
  const initializedRef = useRef(false);
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethod>('courier');
  const [deliveryZone, setDeliveryZone] = useState<'moscow' | 'moscow-region'>('moscow');
  const [deliverySlotId, setDeliverySlotId] = useState(initialData.initialSlots.courier[0]?.id ?? '');
  const [pickupPointId, setPickupPointId] = useState('');
  const initialSavedAddress =
    initialData.savedAddresses.find((address) => address.isDefault) ?? initialData.savedAddresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState(initialSavedAddress?.id ?? 'new');
  const normalizedInitialAddress = initialSavedAddress
    ? {
        city: initialSavedAddress.city.trim(),
        addressLine: initialSavedAddress.street.trim(),
        addressComment: initialSavedAddress.comment?.trim() || undefined,
      }
    : {
        city: initialData.addressDefaults?.city.trim() || 'Москва',
        addressLine: initialData.addressDefaults?.addressLine.trim() ?? '',
        addressComment: initialData.addressDefaults?.addressComment?.trim() || undefined,
      };
  const [address, setAddress] = useState<Address>({
    ...normalizedInitialAddress,
    floor: undefined,
    liftType: 'passenger',
    intercom: '',
  });
  const [services, setServices] = useState<Services>({ carrying: true, assembly: false, removal: false });
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
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [quoteRecoveryBlocked, setQuoteRecoveryBlocked] = useState(false);

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
    if (quoteRecoveryBlocked) {
      ++quoteRevisionRef.current;
      setQuote(null);
      setQuotePending(false);
      return;
    }
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
      .then(async (result) => {
        if (revision !== quoteRevisionRef.current) return;
        if (!result.ok) {
          setQuote(null);
          setQuoteError(result.message);
          if (result.code === 'INVALID_COUPON' && appliedCouponCode) {
            setCouponDraft('');
            setAppliedCouponCode('');
            setQuoteRequestVersion((version) => version + 1);
          } else if (result.code === 'EMPTY_CART') {
            useCartStore.setState({ ...EMPTY_CART_DTO, loading: false, error: false, totalAmount: 0 });
          } else if (result.code === 'SKU_UNAVAILABLE' || result.code === 'QUANTITY_EXCEEDS_STOCK') {
            setQuoteRecoveryBlocked(true);
            await useCartStore.getState().fetchCartItems();
          } else if (result.code === 'STALE_DELIVERY_SLOT') {
            setQuoteRecoveryBlocked(true);
            refreshCheckoutPage();
          }
          return;
        }
        setQuote(result.quote);
        setQuoteRecoveryBlocked(false);
        setMutationError(null);
        setSubmitError(null);
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
  }, [
    appliedCouponCode,
    cart.items,
    quoteInput,
    deliveryMethod,
    deliverySlotId,
    pickupPointId,
    mutationPending,
    quoteRecoveryBlocked,
    quoteRequestVersion,
    refreshCheckoutPage,
  ]);

  const setDeliveryMethod = useCallback(
    (method: DeliveryMethod) => {
      setQuoteRecoveryBlocked(false);
      setDeliveryMethodState(method);
      const slots = slotsFor(initialData, method);
      setDeliverySlotId(slots[0]?.id ?? '');
      if (method === 'courier') {
        setPickupPointId('');
      } else {
        const point = initialData.pickupPoints.find((candidate) => candidate.kind === method);
        setPickupPointId(point?.id ?? '');
      }
    },
    [initialData],
  );

  const setDeliverySlot = useCallback((slotId: string) => {
    setQuoteRecoveryBlocked(false);
    setDeliverySlotId(slotId);
  }, []);

  const pickAddress = useCallback(
    (id: string) => {
      setSelectedAddressId(id);
      if (id === 'new') {
        setAddress({
          city: initialData.addressDefaults?.city.trim() || 'Москва',
          addressLine: '',
          addressComment: undefined,
          floor: undefined,
          liftType: 'passenger',
          intercom: '',
        });
        return;
      }
      const saved = initialData.savedAddresses.find((candidate) => candidate.id === id);
      if (!saved) return;
      setAddress((current) => ({
        ...current,
        city: saved.city.trim(),
        addressLine: saved.street.trim(),
        addressComment: saved.comment?.trim() || undefined,
      }));
    },
    [initialData.addressDefaults?.city, initialData.savedAddresses],
  );

  const mutateCart = useCallback(async (operation: () => Promise<unknown>) => {
    if (mutationPendingRef.current || submitPendingRef.current || submitLockedRef.current) return;
    mutationPendingRef.current = true;
    ++quoteRevisionRef.current;
    setQuote(null);
    setQuotePending(false);
    setQuoteError(null);
    setMutationError(null);
    setSubmitError(null);
    setCouponDraft('');
    setAppliedCouponCode('');
    setQuoteRecoveryBlocked(false);
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
    if (mutationPendingRef.current || submitPendingRef.current || submitLockedRef.current) return;
    const code = couponDraft.trim();
    setCouponDraft(code);
    setAppliedCouponCode(code);
    setQuoteRequestVersion((version) => version + 1);
  }, [couponDraft]);

  const clearCoupon = useCallback(() => {
    if (mutationPendingRef.current || submitPendingRef.current || submitLockedRef.current) return;
    setCouponDraft('');
    setAppliedCouponCode('');
    setQuoteRequestVersion((version) => version + 1);
  }, []);

  const submit = useCallback(async () => {
    if (mutationPendingRef.current || submitPendingRef.current || submitLockedRef.current || !quote) return;
    submitPendingRef.current = true;
    setSubmitPending(true);
    setSubmitError(null);
    const finalizeCommittedOrder = (completion: CompletedOrder) => {
      ++quoteRevisionRef.current;
      submitLockedRef.current = true;
      setQuote(null);
      setQuotePending(false);
      setQuoteError(null);
      setSubmitLocked(true);
      setCompletedOrder(completion);
      useCartStore.setState({ ...EMPTY_CART_DTO, loading: false, error: false, totalAmount: 0 });
    };
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
        finalizeCommittedOrder({
          orderNumber: result.orderNumber,
          heading: `Заказ №${result.orderNumber} создан`,
          message: 'Заказ сохранён. Перейдите к безопасной оплате YooKassa.',
          paymentUrl: result.paymentUrl,
        });
        window.location.assign(result.paymentUrl);
        return;
      }
      if (result.ok || result.code === 'PAYMENT_INITIALIZATION_PENDING') {
        finalizeCommittedOrder({
          orderNumber: result.orderNumber,
          heading: result.ok ? `Заказ №${result.orderNumber} оформлен` : `Заказ №${result.orderNumber} сохранён`,
          message: result.ok ? 'Заказ сохранён. Откройте страницу заказа.' : 'Статус платежа проверяется.',
          paymentUrl: null,
        });
        router.replace(`/orders/${result.orderNumber}?placed=1`);
        return;
      }
      if (result.code === 'PAYMENT_NOT_CREATED') {
        ++quoteRevisionRef.current;
        setQuote(null);
        setQuotePending(false);
        setQuoteError(null);
        submitLockedRef.current = true;
        setSubmitLocked(true);
        useCartStore.setState({ ...EMPTY_CART_DTO, loading: false, error: false, totalAmount: 0 });
        await useCartStore.getState().fetchCartItems();
        router.replace('/cart');
        return;
      }
      if (result.code === 'PAYMENT_INITIALIZATION_BLOCKED') {
        finalizeCommittedOrder({
          orderNumber: result.paymentInitialization.orderNumber,
          heading: result.paymentInitialization.heading,
          message: result.paymentInitialization.message,
          paymentUrl: null,
        });
        setBlocked(result.paymentInitialization);
        router.replace(`/orders/${result.paymentInitialization.orderNumber}?placed=1`);
        return;
      }
      const recoverablePlacement =
        result.code === 'INVALID_COUPON' ||
        result.code === 'EMPTY_CART' ||
        result.code === 'SKU_UNAVAILABLE' ||
        result.code === 'QUANTITY_EXCEEDS_STOCK' ||
        result.code === 'CART_CONFLICT' ||
        result.code === 'ORDER_TRANSACTION_CONFLICT' ||
        result.code === 'STALE_DELIVERY_SLOT';
      if (recoverablePlacement) {
        ++quoteRevisionRef.current;
        setQuote(null);
        setQuotePending(false);
        setQuoteError(null);
      }
      if (result.code === 'INVALID_COUPON') {
        setCouponDraft('');
        setAppliedCouponCode('');
        setQuoteRequestVersion((version) => version + 1);
      } else if (
        result.code === 'EMPTY_CART' ||
        result.code === 'SKU_UNAVAILABLE' ||
        result.code === 'QUANTITY_EXCEEDS_STOCK' ||
        result.code === 'CART_CONFLICT' ||
        result.code === 'ORDER_TRANSACTION_CONFLICT'
      ) {
        if (result.code === 'EMPTY_CART') {
          useCartStore.setState({ ...EMPTY_CART_DTO, loading: false, error: false, totalAmount: 0 });
        }
        await useCartStore.getState().fetchCartItems();
      } else if (result.code === 'STALE_DELIVERY_SLOT') {
        router.refresh();
      }
      setSubmitError(result.error);
    } catch (error) {
      setSubmitError(messageOf(error));
    } finally {
      submitPendingRef.current = false;
      if (!submitLockedRef.current) setSubmitPending(false);
    }
  }, [contactEmail, contactName, contactPhone, paymentMethod, quote, quoteInput, router]);

  const interactionsLocked = mutationPending || submitPending || submitLocked;
  const guardChange = useCallback(<T>(change: (value: T) => void) => {
    return (value: T) => {
      if (mutationPendingRef.current || submitPendingRef.current || submitLockedRef.current) return;
      change(value);
    };
  }, []);

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
    completedOrder,
    interactionsLocked,
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
      setDeliveryMethod: guardChange(setDeliveryMethod),
      setDeliveryZone: guardChange(setDeliveryZone),
      setDeliverySlotId: guardChange(setDeliverySlot),
      setPickupPointId: guardChange(setPickupPointId),
      pickAddress: guardChange(pickAddress),
      setAddress: guardChange(setAddress),
      setServices: guardChange(setServices),
      setCouponDraft: guardChange(setCouponDraft),
      applyCoupon,
      clearCoupon,
      setContactName: guardChange(setContactName),
      setContactPhone: guardChange(setContactPhone),
      setContactEmail: guardChange(setContactEmail),
      setPaymentMethod: guardChange(setPaymentMethod),
      step: (id: string, quantity: number) => mutateCart(() => cart.updateItemQuantity(id, quantity)),
      remove: (id: string) => mutateCart(() => cart.removeCartItem(id)),
      submit,
    },
  };
}

export type CheckoutVariantAController = ReturnType<typeof useCheckoutVariantA>;

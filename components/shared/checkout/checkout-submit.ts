import { placeOrder } from '@/app/actions/order';
import type { CheckoutValues } from '@/services/dto/order.dto';

export function submitCheckoutValues(values: CheckoutValues) {
  return placeOrder(values);
}

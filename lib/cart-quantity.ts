export const MAX_CART_LINE_QUANTITY = 99;

export function isCanonicalCartQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_CART_LINE_QUANTITY;
}

export function isCheckoutQuantityReady(quantity: number, stock: number): boolean {
  return isCanonicalCartQuantity(quantity) && quantity <= stock;
}

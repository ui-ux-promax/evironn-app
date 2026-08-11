export type CheckoutAddressDefaults = {
  city: string;
  street: string;
  comment: string | null;
};

export type CheckoutDefaultsInput = {
  name: string | null;
  phone: string | null;
  email: string;
  address: CheckoutAddressDefaults | null;
};

export type CheckoutDefaults = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  addressLine: string;
  addressComment: string;
};

export function buildCheckoutDefaults(input: CheckoutDefaultsInput): CheckoutDefaults {
  return {
    contactName: input.name ?? '',
    contactPhone: input.phone ?? '',
    contactEmail: input.email,
    city: input.address?.city ?? '',
    addressLine: input.address?.street ?? '',
    addressComment: input.address?.comment ?? '',
  };
}

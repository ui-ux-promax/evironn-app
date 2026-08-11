import { describe, expect, it } from 'vitest';
import { buildCheckoutDefaults } from '@/lib/checkout-defaults';

describe('buildCheckoutDefaults', () => {
  it('uses profile contact data and empty address when no saved address exists', () => {
    expect(
      buildCheckoutDefaults({
        name: 'Анна',
        phone: '+7 999 000-00-00',
        email: 'anna@example.com',
        address: null,
      }),
    ).toEqual({
      contactName: 'Анна',
      contactPhone: '+7 999 000-00-00',
      contactEmail: 'anna@example.com',
      city: '',
      addressLine: '',
      addressComment: '',
    });
  });

  it('prefills checkout address from saved profile address', () => {
    expect(
      buildCheckoutDefaults({
        name: null,
        phone: null,
        email: 'buyer@example.com',
        address: {
          city: 'г Москва',
          street: 'ул Угличская',
          comment: 'кв. 12',
        },
      }),
    ).toMatchObject({
      contactName: '',
      contactPhone: '',
      contactEmail: 'buyer@example.com',
      city: 'г Москва',
      addressLine: 'ул Угличская',
      addressComment: 'кв. 12',
    });
  });
});

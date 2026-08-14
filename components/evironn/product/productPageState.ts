export const PRODUCT_PAGE_STYLES = [
  { id: 'scandinavian', label: 'Скандинавский' },
  { id: 'loft', label: 'Лофт' },
  { id: 'neoclassicism', label: 'Неоклассицизм' },
  { id: 'minimalism', label: 'Минимализм' },
  { id: '360', label: '360°' },
] as const;

export const UPHOLSTERY_OPTIONS = [
  { id: 'ivory', label: 'Айвори', color: '#f2ece4', disabled: false },
  { id: 'charcoal', label: 'Графит', color: '#31312f', disabled: false },
  { id: 'terracotta', label: 'Терракота', color: '#a85b43', disabled: false },
] as const;

export const WOOD_OPTIONS = [
  { id: 'pine', label: 'Сосна', color: '#b68a61', disabled: false },
  { id: 'walnut', label: 'Орех', color: '#4e3426', disabled: false },
] as const;

export const PRODUCT_SCENE_BACKGROUND = '/assets/products/05-graphite-walnut-room-background-fixed.png';

export const PRODUCT_SCENE_CHAIRS = {
  ivory: {
    walnut: '/assets/products/05-ivory-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-ivory-pine-chair-fixed-alpha.png',
  },
  charcoal: {
    walnut: '/assets/products/05-graphite-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-graphite-pine-chair-fixed-alpha.png',
  },
  terracotta: {
    walnut: '/assets/products/05-terracotta-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-terracotta-pine-chair-fixed-alpha.png',
  },
} as const;

export type AccordionKey = 'description' | 'ideal-for' | 'care' | 'style';

export function toggleAccordion(open: AccordionKey | null, key: AccordionKey): AccordionKey | null {
  return open === key ? null : key;
}

export function addProductToCart(count: number) {
  return Math.max(0, count) + 1;
}

export function dragHintForInput({ isCoarse, maxTouchPoints }: { isCoarse: boolean; maxTouchPoints: number }) {
  return isCoarse || maxTouchPoints > 0 ? 'Потяни кресло' : 'Потяни кресло мышью';
}

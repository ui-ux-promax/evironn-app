// Единый источник бизнес-чисел Фазы 1.

export const FREE_SHIPPING_THRESHOLD = 10_000; // ₽, индикатор «Бесплатно от …»
export const SHIPPING_FLAT = 500; // ₽, курьер ниже порога бесплатной доставки
export const NEW_PRODUCT_WINDOW_DAYS = 30; // окно бейджа «Новинка» по createdAt
export const LOW_STOCK_THRESHOLD = 3; // «Осталось N пар»

export const CATALOG_PAGE_SIZE = 12;

export const CART_COOKIE_NAME = 'cartToken';
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней
export const WISHLIST_COOKIE_NAME = 'wishlistToken';
export const WISHLIST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 дней

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type ClothingSize = (typeof CLOTHING_SIZES)[number];

export const CLOTHING_SIZE_ORDER: Record<ClothingSize, number> = {
  XS: 10,
  S: 20,
  M: 30,
  L: 40,
  XL: 50,
  XXL: 60,
};

// Опции сортировки каталога (значение в URL ?sort=).
export const SORT_OPTIONS = [
  { value: 'new', label: 'Сначала новинки' },
  { value: 'popular', label: 'Популярные' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'discount', label: 'Сначала со скидкой' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];
export const DEFAULT_SORT: SortValue = 'new';

export const GENDER_OPTIONS = [
  { value: 'MEN', label: 'Мужские' },
  { value: 'WOMEN', label: 'Женские' },
  { value: 'UNISEX', label: 'Унисекс' },
  { value: 'KIDS', label: 'Детские' },
] as const;

// --- P2.2c Email-верификация + Newsletter ---

// Cookie, помечающая «есть незавершённая верификация» (подписана HMAC по AUTH_SECRET).
export const PENDING_VERIFICATION_COOKIE = 'pending_verification';
export const PENDING_VERIFICATION_MAX_AGE = 60 * 30; // 30 мин — окно «дойти до ввода кода»

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 мин жизни самого кода
export const VERIFICATION_MAX_ATTEMPTS = 5; // неверных попыток на код до инвалидации
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000; // 60 сек между ресендами
export const VERIFICATION_TICKET_TTL_MS = 60 * 1000; // 60 сек жизни тикета автологина

export const NEWSLETTER_SOURCES = ['footer', 'register', 'checkout'] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

// --- P2.3 Rate-limit (Upstash sliding-window) ---
// window — шаблон `${number} ${'s'|'m'|'h'}`, совместимый с makeLimiter (lib/rate-limit.ts).
export const AUTH_RATE_LIMIT = { points: 5, window: '10 m' } as const; // регистрация на IP (анти-argon2-DoS)
export const CART_RATE_LIMIT = { points: 60, window: '1 m' } as const; // add-to-cart на IP (щедро; режет абуз)

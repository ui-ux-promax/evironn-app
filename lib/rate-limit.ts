// ВАЖНО: этот модуль НЕ импортирует logger. auth.config.ts (бандлится в edge-middleware)
// dynamic-import'ит checkLoginRateLimit отсюда; logger → request-context использует eval('require')
// для node:async_hooks, что запрещено в Edge Runtime (build падает). Поэтому здесь логов нет.

import { AUTH_RATE_LIMIT, CART_RATE_LIMIT } from '@/constants/config';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

function getRedisCredentials(): { url: string; token: string } | undefined {
  const preferred = {
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  };
  if (preferred.url && preferred.token) return preferred as { url: string; token: string };

  const fallback = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  if (fallback.url && fallback.token) return fallback as { url: string; token: string };

  return undefined;
}

export function isRateLimitConfigured(): boolean {
  return Boolean(getRedisCredentials());
}

export function extractClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Login rate-limit: sliding window, 5 attempts per 5 minutes per IP+email key.
// Fail-open: if Upstash env vars are absent, always returns success.
// ---------------------------------------------------------------------------
let loginLimiter:
  { limit(key: string): Promise<{ success: boolean; remaining: number; reset: number }> } | null | false = null;

async function getLoginLimiter(): Promise<typeof loginLimiter> {
  if (loginLimiter !== null) return loginLimiter;
  const credentials = getRedisCredentials();
  if (!credentials) {
    loginLimiter = false;
    return loginLimiter;
  }
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');
  loginLimiter = new Ratelimit({
    redis: new Redis(credentials),
    limiter: Ratelimit.slidingWindow(5, '5 m'),
    prefix: 'evironn-app:login',
  });
  return loginLimiter;
}

export async function checkLoginRateLimit(key: string): Promise<RateLimitResult> {
  const l = await getLoginLimiter();
  if (!l) return { success: true, remaining: -1, reset: 0 }; // fail-open
  const r = await l.limit(key);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

// ---------------------------------------------------------------------------
// P2.2c limiters: verify-code (per email+IP), resend-code (per email), newsletter (per IP).
// P2.3 limiters: auth/register (per IP, anti-argon2-DoS), cart add-to-cart (per IP).
// Same lazy + fail-open pattern as login limiter.
// ---------------------------------------------------------------------------
type Limiter = { limit(key: string): Promise<{ success: boolean; remaining: number; reset: number }> } | null | false;

async function makeLimiter(
  slot: { v: Limiter },
  points: number,
  window: `${number} ${'s' | 'm' | 'h'}`,
  prefix: string,
): Promise<Limiter> {
  if (slot.v !== null) return slot.v;
  const credentials = getRedisCredentials();
  if (!credentials) {
    slot.v = false;
    return slot.v;
  }
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');
  slot.v = new Ratelimit({
    redis: new Redis(credentials),
    limiter: Ratelimit.slidingWindow(points, window),
    prefix,
  });
  return slot.v;
}

const verifySlot = { v: null as Limiter };
const resendSlot = { v: null as Limiter };
const newsletterSlot = { v: null as Limiter };
const dadataSlot = { v: null as Limiter };

export async function checkVerifyRateLimit(key: string): Promise<RateLimitResult> {
  const l = await makeLimiter(verifySlot, 10, '10 m', 'evironn-app:verify');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(key);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

export async function checkResendRateLimit(key: string): Promise<RateLimitResult> {
  const l = await makeLimiter(resendSlot, 5, '1 h', 'evironn-app:resend');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(key);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

export async function checkNewsletterRateLimit(key: string): Promise<RateLimitResult> {
  const l = await makeLimiter(newsletterSlot, 5, '10 m', 'evironn-app:newsletter');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(key);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

export async function checkDadataRateLimit(ip: string): Promise<RateLimitResult> {
  const l = await makeLimiter(dadataSlot, 30, '1 m', 'evironn-app:dadata');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(ip);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

// Fail-open: если Upstash не сконфигурирован — всегда success (sliding window, 60 req/min per IP).
const cartSlot = { v: null as Limiter };
export async function checkCartRateLimit(ip: string): Promise<RateLimitResult> {
  const l = await makeLimiter(cartSlot, CART_RATE_LIMIT.points, CART_RATE_LIMIT.window, 'evironn-app:cart');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(ip);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

// Fail-open: если Upstash не сконфигурирован — всегда success (sliding window, 5 req/10 min per IP).
const authSlot = { v: null as Limiter };
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  const l = await makeLimiter(authSlot, AUTH_RATE_LIMIT.points, AUTH_RATE_LIMIT.window, 'evironn-app:auth');
  if (!l) return { success: true, remaining: -1, reset: 0 };
  const r = await l.limit(ip);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

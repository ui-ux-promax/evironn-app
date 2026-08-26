// Client-safe period config (no prisma import) — safe to import from 'use client' components.
export const PERIOD_VALUES = [7, 30, 90] as const;
export type Period = (typeof PERIOD_VALUES)[number];
export const DEFAULT_PERIOD: Period = 30;

export const DASHBOARD_RECENT_ORDERS_LIMIT = 12;
export const DASHBOARD_LOW_STOCK_LIMIT = 12;
export const DASHBOARD_LOW_STOCK_DISPLAY_MAX = 10;

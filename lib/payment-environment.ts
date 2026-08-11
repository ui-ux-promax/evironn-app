export function assertPortfolioPaymentMode(env: Record<string, string | undefined>): void {
  if (env.DEMO_MODE === 'true' && env.YOOKASSA_MODE !== 'sandbox') {
    throw new Error('Portfolio demo requires YooKassa sandbox');
  }
}

export interface DemoDataInvariants {
  categories: number;
  products: number;
  variants: number;
  fixtureUsers: number;
  visitorUsers: number;
  carts: number;
  subscribers: number;
}

export function assertDemoEnvironment(env: Record<string, string | undefined>) {
  if (env.DEMO_MODE !== 'true' || env.VERCEL_ENV !== 'production') {
    throw new Error('Demo reset is disabled');
  }
}

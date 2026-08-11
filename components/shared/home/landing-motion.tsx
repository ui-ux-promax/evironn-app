'use client';

import type { ReactNode } from 'react';
import { RevealObserver } from '@/components/shared/motion/reveal-observer';

export function LandingMotion({ children }: { children: ReactNode }) {
  return <RevealObserver className="landing-motion">{children}</RevealObserver>;
}

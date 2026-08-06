export const HERO_PRODUCT_IDS = [
  'sofa',
  'chair',
  'kitchen-dining',
  'kitchen-island',
  'bedroom-chair',
  'bedroom-bed',
  'terrace-chair',
  'terrace-sofa',
] as const;

export type HeroProductId = (typeof HERO_PRODUCT_IDS)[number];
export type HeroPhase =
  | 'idle'
  | HeroProductId
  | `entering-${HeroProductId}`
  | `returning-${HeroProductId}`;

export const HERO_CARD_REVEAL_PROGRESS = 0.72;

function isHeroProductId(value: string): value is HeroProductId {
  return (HERO_PRODUCT_IDS as readonly string[]).includes(value);
}

export function getHeroProduct(phase: HeroPhase): HeroProductId | null {
  return (
    HERO_PRODUCT_IDS.find(
      (id) =>
        phase === id ||
        phase === `entering-${id}` ||
        phase === `returning-${id}`,
    ) ?? null
  );
}

export function isHeroTransitioning(phase: HeroPhase) {
  return phase.startsWith('entering-') || phase.startsWith('returning-');
}

export function selectHeroProduct(
  phase: HeroPhase,
  product: HeroProductId,
): HeroPhase {
  return phase === 'idle' ? `entering-${product}` : phase;
}

export function completeHeroForward(phase: HeroPhase): HeroPhase {
  if (!phase.startsWith('entering-')) return phase;
  const product = phase.slice('entering-'.length);
  return isHeroProductId(product) ? product : phase;
}

export function startHeroReturn(phase: HeroPhase): HeroPhase {
  return isHeroProductId(phase) ? `returning-${phase}` : phase;
}

export function cancelHeroProduct(phase: HeroPhase): HeroPhase {
  void phase;
  return 'idle';
}

export function completeHeroReturn(phase: HeroPhase): HeroPhase {
  return phase.startsWith('returning-') ? 'idle' : phase;
}

export function recoverHeroMediaFailure(phase: HeroPhase): HeroPhase {
  if (phase.startsWith('entering-')) return 'idle';
  if (!phase.startsWith('returning-')) return phase;

  const product = phase.slice('returning-'.length);
  return isHeroProductId(product) ? product : 'idle';
}

export function shouldRevealHeroProduct(currentTime: number, duration: number) {
  const progress = duration > 0 ? currentTime / duration : 0;
  return (
    Number.isFinite(duration) &&
    duration > 0 &&
    progress + 1e-6 >= HERO_CARD_REVEAL_PROGRESS
  );
}

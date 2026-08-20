import type { Variants } from 'framer-motion';

export const CAPTION_DESKTOP_DELAY = 0.36;
export const CAPTION_MOBILE_DELAY = 0;
export const CAPTION_STAGGER = 0.06;
export const CAPTION_DURATION = 0.4;
export const CAPTION_EXIT_DURATION = 0.11;

function getRevealDelay(order: number, baseDelay: number) {
  return Number((baseDelay + order * CAPTION_STAGGER).toFixed(3));
}

export function getCaptionOrder(name: string) {
  const nameWords = name.trim().split(/\s+/).filter(Boolean);
  return { nameWords, categoryOrder: nameWords.length, priceOrder: nameWords.length + 1 };
}

export function createFurnitureCaptionVariants(order: number, baseDelay: number, reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0, delay: 0 } },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0, delay: 0 } },
    };
  }
  return {
    hidden: { opacity: 0.001, y: 10, filter: 'blur(10px)', transition: { duration: CAPTION_EXIT_DURATION, delay: 0 } },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'tween',
        duration: CAPTION_DURATION,
        delay: getRevealDelay(order, baseDelay),
        ease: [0.44, 0, 0.56, 1],
      },
    },
  };
}

export function createHeroCardContainerVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 0, transition: { duration: 0 } },
    };
  }

  return {
    hidden: { opacity: 0, y: 18, filter: 'blur(12px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, staggerChildren: 0.06 },
    },
    exit: { opacity: 0, y: 8, filter: 'blur(6px)', transition: { duration: 0.18 } },
  };
}

export function createHeroCardItemVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }

  return {
    hidden: { opacity: 0, y: 8, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.32, ease: [0.44, 0, 0.56, 1] },
    },
  };
}

import type { Variants } from 'framer-motion';

export function createHeroCardContainerVariants(
  reducedMotion: boolean,
): Variants {
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
    exit: {
      opacity: 0,
      y: 8,
      filter: 'blur(6px)',
      transition: { duration: 0.18 },
    },
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

import type { Transition, Variants } from 'framer-motion';

export type FramerAppearAnimation = {
  initial: Record<string, string | number>;
  animate: Record<string, string | number | Transition>;
};

const editorialAppear: FramerAppearAnimation = {
  initial: {
    opacity: 0.001,
    x: 0,
    y: 10,
    scale: 1,
    rotate: 0,
    skewX: 0,
    skewY: 0,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    skewX: 0,
    skewY: 0,
    filter: 'blur(0px)',
  },
};

/**
 * Maps an extracted Framer appear animation to Framer Motion variants.
 * The source JSON uses the same tween curve: [0.44, 0, 0.56, 1].
 */
export function useRevealAnimation(
  appear: FramerAppearAnimation = editorialAppear,
  delay = 0,
): Variants {
  const { transition: sourceTransition, ...animate } = appear.animate;
  void sourceTransition;

  return {
    hidden: appear.initial,
    visible: {
      ...animate,
      transition: {
        type: 'tween',
        duration: 0.4,
        delay,
        ease: [0.44, 0, 0.56, 1],
      },
    },
  };
}

export const framerEditorialAppear = editorialAppear;

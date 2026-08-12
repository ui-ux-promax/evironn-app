import type { Transition, Variants } from 'framer-motion';

export type AppearAnimation = {
  initial: Record<string, string | number>;
  animate: Record<string, string | number | Transition>;
};

const editorialAppear: AppearAnimation = {
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

/** Maps editorial appear settings to Framer Motion variants. */
export function useEditorialAnimation(appear: AppearAnimation = editorialAppear, delay = 0): Variants {
  const { transition: _sourceTransition, ...animate } = appear.animate;

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

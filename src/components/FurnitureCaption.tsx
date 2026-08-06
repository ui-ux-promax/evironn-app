import { motion, useReducedMotion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import {
  CAPTION_DESKTOP_DELAY,
  CAPTION_MOBILE_DELAY,
  createFurnitureCaptionVariants,
  getCaptionOrder,
} from './furnitureCaptionMotion';

type FurnitureCaptionProps = {
  name: string;
  category: string;
  price: string;
  active: boolean;
};

const mobileQuery = '(max-width: 809.98px)';

function useMobileCaptionAnimation() {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia(mobileQuery).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(mobileQuery);
    const onChange = () => setMobile(query.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return mobile;
}

export function FurnitureCaption({
  name,
  category,
  price,
  active,
}: FurnitureCaptionProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const mobile = useMobileCaptionAnimation();
  const baseDelay = mobile ? CAPTION_MOBILE_DELAY : CAPTION_DESKTOP_DELAY;
  const { nameWords, categoryOrder, priceOrder } = getCaptionOrder(name);
  const animate = active ? 'visible' : 'hidden';

  return (
    <span className="interactive-furniture__details">
      <span className="interactive-furniture__name">
        {nameWords.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 && ' '}
            <motion.span
              className="interactive-furniture__caption-token"
              initial="hidden"
              animate={animate}
              variants={createFurnitureCaptionVariants(
                index,
                baseDelay,
                reducedMotion,
              )}
            >
              {word}
            </motion.span>
          </Fragment>
        ))}
      </span>
      <motion.span
        className="interactive-furniture__meta interactive-furniture__caption-token"
        initial="hidden"
        animate={animate}
        variants={createFurnitureCaptionVariants(
          categoryOrder,
          baseDelay,
          reducedMotion,
        )}
      >
        {category}
      </motion.span>
      <motion.span
        className="interactive-furniture__price interactive-furniture__caption-token"
        initial="hidden"
        animate={animate}
        variants={createFurnitureCaptionVariants(
          priceOrder,
          baseDelay,
          reducedMotion,
        )}
      >
        {price}
      </motion.span>
    </span>
  );
}

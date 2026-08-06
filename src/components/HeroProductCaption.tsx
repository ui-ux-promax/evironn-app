import { motion, useReducedMotion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import {
  CAPTION_DESKTOP_DELAY,
  CAPTION_MOBILE_DELAY,
  createFurnitureCaptionVariants,
  getCaptionOrder,
} from './furnitureCaptionMotion';
import type { HeroProduct } from './heroProducts';

type HeroProductCaptionProps = {
  product: HeroProduct;
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

export function HeroProductCaption({ product }: HeroProductCaptionProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const mobile = useMobileCaptionAnimation();
  const baseDelay = mobile ? CAPTION_MOBILE_DELAY : CAPTION_DESKTOP_DELAY;
  const { nameWords, categoryOrder, priceOrder } = getCaptionOrder(
    product.name,
  );
  const linkOrder = priceOrder + 1;

  return (
    <>
      <span className="furni-hero-product__eyebrow">
        <motion.span
          className="furni-hero-product__caption-token"
          initial="hidden"
          animate="visible"
          variants={createFurnitureCaptionVariants(
            categoryOrder,
            baseDelay,
            reducedMotion,
          )}
        >
          {product.category}
        </motion.span>
      </span>
      <h2>
        {nameWords.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 && ' '}
            <motion.span
              className="furni-hero-product__caption-token"
              initial="hidden"
              animate="visible"
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
      </h2>
      <motion.span
        className="furni-hero-product__price furni-hero-product__caption-token"
        initial="hidden"
        animate="visible"
        variants={createFurnitureCaptionVariants(
          priceOrder,
          baseDelay,
          reducedMotion,
        )}
      >
        {product.price}
      </motion.span>
      {product.href ? (
        <motion.a
          href={product.href}
          className="furni-hero-product__link furni-hero-product__caption-token"
          initial="hidden"
          animate="visible"
          variants={createFurnitureCaptionVariants(
            linkOrder,
            baseDelay,
            reducedMotion,
          )}
        >
          Смотреть товар <span aria-hidden="true">↗</span>
        </motion.a>
      ) : (
        <motion.span
          className="furni-hero-product__link furni-hero-product__caption-token is-disabled"
          aria-disabled="true"
          initial="hidden"
          animate="visible"
          variants={createFurnitureCaptionVariants(
            linkOrder,
            baseDelay,
            reducedMotion,
          )}
        >
          Смотреть товар <span aria-hidden="true">↗</span>
        </motion.span>
      )}
    </>
  );
}

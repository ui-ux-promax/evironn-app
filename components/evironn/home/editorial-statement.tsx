import { motion, useReducedMotion } from 'framer-motion';
import { Fragment } from 'react';
import { useEditorialAnimation } from './use-editorial-animation';

const viewport = { once: true, amount: 0.24 };
const editorialCopy = 'Форма, к которой хочется возвращаться.';

function EditorialWord({ word, order }: { word: string; order: number }) {
  const reduceMotion = useReducedMotion();
  const variants = useEditorialAnimation(undefined, order * 0.12);
  return (
    <motion.span
      className="editorial-word"
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={viewport}
      variants={variants}
    >
      {word}
    </motion.span>
  );
}

type EditorialImageProps = { asset: string; alt: string; order: number; rotate?: number; leaf?: boolean };

function EditorialImage({ asset, alt, order, rotate = 0, leaf = false }: EditorialImageProps) {
  const reduceMotion = useReducedMotion();
  const variants = useEditorialAnimation(
    { initial: { opacity: 0.001, scale: 0 }, animate: { opacity: 1, scale: 1 } },
    order * 0.12 + 0.04,
  );
  return (
    <motion.div
      className={leaf ? 'editorial-leaf' : 'editorial-image-card'}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={viewport}
      variants={variants}
      style={{ rotate: `${rotate}deg` }}
    >
      {leaf ? (
        <img src={asset} alt={alt} />
      ) : (
        <div className="editorial-image-frame">
          <div className="editorial-image-inset">
            <div className="editorial-image-crop">
              <img src={asset} alt={alt} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Phrase({ words, firstOrder }: { words: string[]; firstOrder: number }) {
  return (
    <h1 className="editorial-copy">
      {words.map((word, index) => (
        <Fragment key={word}>
          {index > 0 && ' '}
          <EditorialWord word={word} order={firstOrder + index} />
        </Fragment>
      ))}
    </h1>
  );
}

export function EditorialStatement() {
  return (
    <section className="editorial-statement" aria-label={editorialCopy}>
      <div className="editorial-container">
        <div className="editorial-row">
          <div className="editorial-group editorial-group-primary">
            <Phrase words={['Форма,']} firstOrder={0} />
            <EditorialImage
              asset="/assets/furniture/material-wood-detail.png"
              alt="Светлая дубовая деталь мебели"
              order={1}
              rotate={10}
            />
          </div>
          <div className="editorial-group editorial-group-secondary">
            <Phrase words={['к которой', 'хочется']} firstOrder={2} />
            <EditorialImage
              asset="/assets/furniture/material-textile-detail.png"
              alt="Фактура светлой мебельной обивки"
              order={4}
              rotate={-10}
            />
          </div>
          <div className="editorial-group editorial-group-tertiary">
            <Phrase words={['возвращаться.']} firstOrder={5} />
            <EditorialImage
              asset="/assets/furniture/material-joinery-detail.png"
              alt="Точное столярное соединение"
              order={6}
              leaf
            />
          </div>
        </div>
      </div>
    </section>
  );
}

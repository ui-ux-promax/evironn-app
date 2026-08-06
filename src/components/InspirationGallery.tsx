import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRevealAnimation } from '../hooks/useRevealAnimation';
import './InspirationGallery.css';

const galleryImages = [
  '/assets/hero/kitchen-idle.jpg',
  '/assets/hero/bedroom-idle.jpg',
  '/assets/hero/terrace-idle.jpg',
  '/assets/products/01-bar-stool-idle.webp',
  '/assets/products/03-ivory-lounge-idle.webp',
  '/assets/products/05-two-seat-sofa-idle.webp',
];
const revealViewport = { once: true, amount: 0.24 };
const standardTransition = {
  type: 'tween' as const,
  duration: 0.4,
  ease: [0.44, 0, 0.56, 1] as const,
};

function RevealWord({ word, delay }: { word: string; delay: number }) {
  const reduceMotion = useReducedMotion();
  const animation = useRevealAnimation(undefined, delay);
  return (
    <motion.span
      className="instagram-follow-word"
      initial={reduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={revealViewport}
      variants={animation}
    >
      {word}
    </motion.span>
  );
}
function FloatingPhoto({ source, rotate }: { source: string; rotate: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <span className="instagram-follow-floating-photo">
      <motion.span
        className="instagram-follow-floating-photo-motion"
        initial={reduceMotion ? false : { rotate: 0 }}
        whileInView={{ rotate }}
        viewport={revealViewport}
        transition={{ ...standardTransition, delay: 0.08 }}
      >
        <img alt="Деталь интерьера" src={source} />
      </motion.span>
    </span>
  );
}
function RevealGallery({
  children,
  onReveal,
}: {
  children: ReactNode;
  onReveal: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="instagram-follow-gallery-reveal"
      initial={reduceMotion ? false : { opacity: 0, x: -32 }}
      whileInView={{ opacity: 1, x: 0 }}
      onViewportEnter={onReveal}
      viewport={revealViewport}
      transition={standardTransition}
    >
      {children}
    </motion.div>
  );
}
function GalleryCard({
  source,
  onHoverChange,
}: {
  source: string;
  onHoverChange: (value: boolean) => void;
}) {
  return (
    <a
      aria-label="Открыть идею интерьера"
      className="instagram-follow-card"
      href="#"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
    >
      <img alt="Идея для интерьера" src={source} />
      <span aria-hidden="true" className="instagram-follow-card-overlay" />
      <span className="instagram-follow-card-label">Evironn</span>
    </a>
  );
}

function GalleryTrack({
  sources,
  mobile,
  active,
}: {
  sources: string[];
  mobile?: boolean;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const positionRef = useRef(0);
  const speedRef = useRef(0);
  const distance = mobile ? 680 : 2112;
  const baseSpeed = 40;
  const hoverSpeed = 10;

  useEffect(() => {
    if (!active || reduceMotion) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const targetSpeed = hoveredRef.current ? hoverSpeed : baseSpeed;
      speedRef.current +=
        (targetSpeed - speedRef.current) * Math.min(1, delta * 5);
      positionRef.current -= speedRef.current * delta;
      if (positionRef.current <= -distance) positionRef.current += distance;
      if (trackRef.current)
        trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, baseSpeed, distance, hoverSpeed, reduceMotion]);

  const setHovered = (value: boolean) => {
    hoveredRef.current = value;
  };
  return (
    <div
      ref={trackRef}
      className={`instagram-follow-gallery-track${mobile ? ' instagram-follow-gallery-track-mobile' : ' instagram-follow-gallery-track-desktop'}${active ? ' is-ticking' : ''}`}
    >
      {[...sources, ...sources].map((source, index) => (
        <GalleryCard
          key={`${source}-${index}`}
          onHoverChange={setHovered}
          source={source}
        />
      ))}
    </div>
  );
}

export function InspirationGallery() {
  const mobileGalleryImages = galleryImages.slice(0, 5);
  const [isGalleryRevealed, setIsGalleryRevealed] = useState(false);
  return (
    <section
      aria-labelledby="instagram-follow-heading"
      className="instagram-follow"
    >
      <div className="instagram-follow-header">
        <h2 id="instagram-follow-heading">
          <RevealWord delay={0.4} word="Детали" />{' '}
          <span aria-hidden="true" className="instagram-follow-floating-stack">
            <FloatingPhoto
              rotate={-10}
              source="/assets/products/03-ivory-lounge-idle.webp"
            />
            <FloatingPhoto
              rotate={10}
              source="/assets/products/05-two-seat-sofa-idle.webp"
            />
          </span>{' '}
          <RevealWord delay={0.4} word="создающие атмосферу" />
        </h2>
      </div>
      <RevealGallery onReveal={() => setIsGalleryRevealed(true)}>
        <div className="instagram-follow-gallery-viewport">
          <GalleryTrack active={isGalleryRevealed} sources={galleryImages} />
          <GalleryTrack
            active={isGalleryRevealed}
            mobile
            sources={mobileGalleryImages}
          />
        </div>
      </RevealGallery>
    </section>
  );
}

'use client';

import { motion, type Variants } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa6';
import Link from 'next/link';

import { catalogCategoryPath, catalogRoomPath, PUBLIC_ROUTES } from '@/components/evironn/public-routes';

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

const columns: FooterColumn[] = [
  {
    title: 'Каталог',
    links: [
      { label: 'Диваны', href: catalogCategoryPath('sofas') },
      { label: 'Столы', href: PUBLIC_ROUTES.catalog },
      { label: 'Кровати', href: PUBLIC_ROUTES.catalog },
    ],
  },
  {
    title: 'Комнаты',
    links: [
      { label: 'Гостиная', href: catalogRoomPath('living') },
      { label: 'Спальня', href: catalogRoomPath('bedroom') },
      { label: 'Терраса', href: catalogRoomPath('terrace') },
    ],
  },
  {
    title: 'Материалы',
    links: [
      { label: 'Дерево', href: PUBLIC_ROUTES.catalog },
      { label: 'Ткань', href: PUBLIC_ROUTES.catalog },
      { label: 'Камень', href: PUBLIC_ROUTES.catalog },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { label: 'Контакты', href: PUBLIC_ROUTES.catalog },
      { label: 'Доставка', href: PUBLIC_ROUTES.catalog },
      { label: 'Уход за мебелью', href: PUBLIC_ROUTES.catalog },
    ],
  },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const riseItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', duration: 0.6, bounce: 0 } },
};
const heroBrandVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', duration: 2.4, bounce: 0 } },
};

const MotionLink = motion(Link);

function EvironnMark() {
  return (
    <svg aria-hidden="true" className="footer-15-mark" viewBox="0 0 72 72">
      <path d="M36 14C22.745 14 12 24.745 12 38s10.745 24 24 24c8.774 0 16.447-4.71 20.635-11.735" />
      <path d="M23 28h29M23 38h23M23 48h29" />
    </svg>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="footer-15">
      <motion.div
        className="footer-15-content"
        initial="hidden"
        variants={staggerContainer}
        viewport={{ once: true, amount: 0.1 }}
        whileInView="visible"
      >
        <div className="footer-15-layout">
          <motion.div className="footer-15-brand" variants={riseItem}>
            <div className="footer-15-logo">
              <EvironnMark />
              <span>evironn</span>
            </div>
            <p>
              Мебель для тихих, наполненных жизнью интерьеров — с вниманием к форме, материалу и ежедневному комфорту.
            </p>
            <MotionLink
              className="footer-15-cta"
              href={PUBLIC_ROUTES.catalog}
              variants={riseItem}
              whileTap={{ scale: 0.96 }}
            >
              <span>Смотреть каталог</span>
              <span className="footer-15-cta-icon">
                <FaArrowRight aria-hidden="true" />
              </span>
            </MotionLink>
          </motion.div>
          <nav aria-label="Навигация в подвале" className="footer-15-nav">
            {columns.map((column) => (
              <motion.div key={column.title} variants={riseItem}>
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>
      </motion.div>
      <motion.div
        aria-label="evironn"
        className="footer-15-wordmark"
        initial="hidden"
        variants={heroBrandVariant}
        viewport={{ once: true, amount: 0.15 }}
        whileInView="visible"
      >
        <svg
          aria-hidden="true"
          className="footer-15-wordmark-svg"
          viewBox="0 0 1000 190"
          preserveAspectRatio="xMidYMax meet"
        >
          <text
            x="50%"
            y="166"
            fontFamily="Fraunces, Georgia, serif"
            fontSize="176"
            fontWeight="600"
            letterSpacing="-8"
            textAnchor="middle"
            textLength="950"
            lengthAdjust="spacingAndGlyphs"
          >
            EVIRONN
          </text>
        </svg>
      </motion.div>
    </footer>
  );
}

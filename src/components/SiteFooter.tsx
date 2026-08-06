import { motion, type Variants } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa6';
import './SiteFooter.css';

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };
const columns: FooterColumn[] = [
  {
    title: 'Каталог',
    links: [
      { label: 'Диваны', href: '#category-sofas' },
      { label: 'Столы', href: '#category-tables' },
      { label: 'Кровати', href: '#category-beds' },
    ],
  },
  {
    title: 'Комнаты',
    links: [
      { label: 'Гостиная', href: '#' },
      { label: 'Спальня', href: '#' },
      { label: 'Терраса', href: '#' },
    ],
  },
  {
    title: 'Материалы',
    links: [
      { label: 'Дерево', href: '#' },
      { label: 'Ткань', href: '#' },
      { label: 'Камень', href: '#' },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { label: 'Контакты', href: '#' },
      { label: 'Доставка', href: '#' },
      { label: 'Уход за мебелью', href: '#' },
    ],
  },
];
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};
const riseItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.6, bounce: 0 },
  },
};
const heroBrandVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 2.4, bounce: 0 },
  },
};

function EvironnMark() {
  return (
    <svg aria-hidden="true" className="site-footer-mark" viewBox="0 0 72 72">
      <path d="M36 14C22.745 14 12 24.745 12 38s10.745 24 24 24c8.774 0 16.447-4.71 20.635-11.735" />
      <path d="M23 28h29M23 38h23M23 48h29" />
    </svg>
  );
}

export function SiteFooter() {
  const brandName = 'evironn';
  return (
    <footer className="site-footer">
      <motion.div
        className="site-footer-content"
        initial="hidden"
        variants={staggerContainer}
        viewport={{ once: true, amount: 0.1 }}
        whileInView="visible"
      >
        <div className="site-footer-layout">
          <motion.div className="site-footer-brand" variants={riseItem}>
            <div className="site-footer-logo">
              <EvironnMark />
              <span>{brandName}</span>
            </div>
            <p>
              Мебель для тихих, наполненных жизнью интерьеров — с вниманием к
              форме, материалу и ежедневному комфорту.
            </p>
            <motion.a
              className="site-footer-cta"
              href="#"
              variants={riseItem}
              whileTap={{ scale: 0.96 }}
            >
              <span>Смотреть каталог</span>
              <span className="site-footer-cta-icon">
                <FaArrowRight aria-hidden="true" />
              </span>
            </motion.a>
          </motion.div>
          <nav aria-label="Навигация в подвале" className="site-footer-nav">
            {columns.map((column) => (
              <motion.div key={column.title} variants={riseItem}>
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>
      </motion.div>
      <motion.div
        aria-label={brandName}
        className="site-footer-wordmark"
        initial="hidden"
        variants={heroBrandVariant}
        viewport={{ once: true, amount: 0.15 }}
        whileInView="visible"
      >
        <svg
          aria-hidden="true"
          className="site-footer-wordmark-svg"
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
            {brandName.toUpperCase()}
          </text>
        </svg>
      </motion.div>
    </footer>
  );
}

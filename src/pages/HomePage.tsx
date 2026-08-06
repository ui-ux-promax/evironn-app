import { BenefitsShowcaseSection } from '../components/BenefitsShowcaseSection';
import {
  CategoryShowcase,
  InteriorStory,
} from '../components/CategoryShowcase';
import { EditorialStatement } from '../components/EditorialStatement';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { Hero } from '../components/Hero';
import { InspirationGallery } from '../components/InspirationGallery';
import { NatureSection } from '../components/NatureSection';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';

export function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <CategoryShowcase />
        <FeaturedProducts />
        <EditorialStatement />
        <NatureSection />
        <BenefitsShowcaseSection />
        <InteriorStory />
        <InspirationGallery />
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from 'next';
import { defaultOgImage, defaultSeoDescription, defaultSeoTitle, getSiteUrl, siteName } from '@/lib/seo';
import './globals.css';

// Root layout: только <html>/<body> + шрифты. Storefront-chrome живёт в
// app/(shop)/layout.tsx, admin-shell — в app/(admin)/layout.tsx. Это
// единственный layout, который рендерит <html> (требование App Router).
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: defaultSeoTitle, template: '%s · Evironn' },
  description: defaultSeoDescription,
  alternates: { canonical: '/' },
  openGraph: {
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: '/',
    siteName,
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: defaultOgImage, alt: defaultSeoTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [defaultOgImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cloudd3r.eu.cc';

const colors = {
  ink: '#171717',
  muted: '#746f67',
  canvas: '#f5f2ec',
  card: '#fffdf9',
  line: '#e3ded5',
};

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.canvas, margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 36px' }}>
          <Section style={{ padding: '0 8px 18px' }}>
            <Text style={{ color: colors.ink, fontSize: 30, fontWeight: 800, letterSpacing: '-1.8px', margin: 0 }}>
              Evironn
            </Text>
          </Section>
          <Section
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <Section style={{ backgroundColor: colors.ink, height: 5, lineHeight: '5px' }}>&nbsp;</Section>
            <Section style={{ padding: '32px 32px 30px' }}>{children}</Section>
          </Section>
          <Section style={{ padding: '18px 8px 0' }}>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: '18px', margin: 0 }}>
              © 2026 Evironn · {SITE.replace(/^https?:\/\//, '')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: '18px', margin: '2px 0 0' }}>
              Одежда для вашего ритма.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

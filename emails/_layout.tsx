import { Body, Column, Container, Head, Html, Preview, Row, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evironn-app.vercel.app';

const colors = {
  canvas: '#F3F1EC',
  ink: '#2F2D2B',
  line: '#E9E4DC',
  muted: '#817B74',
  surface: '#FFFFFF',
};

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  const host = SITE.replace(/^https?:\/\//, '');

  return (
    <Html lang="ru">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.canvas, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }}>
        <Container style={{ margin: '0 auto', maxWidth: 560, padding: '28px 20px 36px' }}>
          <Section style={{ padding: '0 6px 20px' }}>
            <Row>
              <Column>
                <Text style={{ color: colors.ink, fontSize: 28, fontWeight: 700, letterSpacing: '-1.4px', margin: 0 }}>
                  Evironn
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    margin: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  Ваш аккаунт
                </Text>
              </Column>
            </Row>
          </Section>
          <Section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <Section style={{ padding: '34px 32px 32px' }}>{children}</Section>
          </Section>
          <Section style={{ padding: '18px 6px 0' }}>
            <Row>
              <Column>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: '17px', margin: 0 }}>
                  © 2026 Evironn · {host}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: '17px', margin: 0 }}>
                  Мебель для жизни.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

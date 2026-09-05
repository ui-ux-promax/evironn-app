import { Button, Heading, Text } from '@react-email/components';
import { EmailLayout } from './_layout';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evironn-app.vercel.app';

export function WelcomeEmail({ name }: { name?: string }) {
  return (
    <EmailLayout preview="Добро пожаловать в Evironn">
      <Text
        style={{
          color: '#2f8f66',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '1.2px',
          margin: '0 0 10px',
          textTransform: 'uppercase',
        }}
      >
        Добро пожаловать
      </Text>
      <Heading style={{ color: '#171717', fontSize: 26, lineHeight: '32px', margin: '0 0 12px' }}>
        {name ? `Рады видеть вас, ${name}!` : 'Рады видеть вас в Evironn!'}
      </Heading>
      <Text style={{ color: '#5f5a53', fontSize: 15, lineHeight: '23px', margin: '0 0 24px' }}>
        Почта подтверждена — аккаунт готов. Сохраняйте избранное, следите за новыми поступлениями и оформляйте заказы
        быстрее.
      </Text>
      <Button
        href={`${SITE}/catalog`}
        style={{
          backgroundColor: '#171717',
          borderRadius: 8,
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 700,
          padding: '13px 22px',
          textDecoration: 'none',
        }}
      >
        Перейти в каталог
      </Button>
    </EmailLayout>
  );
}

export default function Preview() {
  return <WelcomeEmail name="Анна" />;
}

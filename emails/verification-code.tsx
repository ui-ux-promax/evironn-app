import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './_layout';

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout preview={`Код подтверждения Evironn: ${code}`}>
      <Text
        style={{
          color: '#48564E',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.3px',
          margin: '0 0 12px',
          textTransform: 'uppercase',
        }}
      >
        Регистрация
      </Text>
      <Heading style={{ color: '#2F2D2B', fontSize: 28, fontWeight: 500, lineHeight: '31px', margin: '0 0 14px' }}>
        Подтвердите
        <br />
        почту
      </Heading>
      <Text style={{ color: '#6F6A64', fontSize: 15, lineHeight: '23px', margin: '0 0 26px' }}>
        Введите код в окне регистрации, чтобы завершить создание аккаунта.
      </Text>
      <Section
        style={{
          backgroundColor: '#211F1D',
          borderRadius: 16,
          margin: '0 0 22px',
          padding: '18px 14px 17px',
        }}
      >
        <Text
          style={{
            color: '#A8AAA7',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.2px',
            margin: '0 0 8px',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Код подтверждения
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            letterSpacing: '7px',
            lineHeight: '38px',
            margin: 0,
            textAlign: 'center',
            textIndent: '7px',
          }}
        >
          {code}
        </Text>
      </Section>
      <Text style={{ color: '#817B74', fontSize: 13, lineHeight: '20px', margin: 0 }}>
        Код действует 10 минут. Никому его не передавайте.
      </Text>
      <Hr style={{ borderColor: '#E9E4DC', margin: '22px 0 16px' }} />
      <Text style={{ color: '#817B74', fontSize: 13, lineHeight: '20px', margin: 0 }}>
        Не регистрировались в Evironn? Просто проигнорируйте это письмо.
      </Text>
    </EmailLayout>
  );
}

export default function Preview() {
  return <VerificationCodeEmail code="123456" />;
}

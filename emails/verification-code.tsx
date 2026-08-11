import { Heading, Text } from '@react-email/components';
import { EmailLayout } from './_layout';

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout preview={`Код подтверждения Ritm: ${code}`}>
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
        Ritm account
      </Text>
      <Heading style={{ color: '#171717', fontSize: 26, lineHeight: '32px', margin: '0 0 12px' }}>
        Подтвердите почту
      </Heading>
      <Text style={{ color: '#5f5a53', fontSize: 15, lineHeight: '23px', margin: '0 0 24px' }}>
        Введите этот код в окне регистрации, чтобы завершить создание аккаунта.
      </Text>
      <Text
        style={{
          backgroundColor: '#f3f0e9',
          borderRadius: 12,
          color: '#171717',
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 8,
          margin: '0 0 24px',
          padding: '18px 16px',
          textAlign: 'center',
        }}
      >
        {code}
      </Text>
      <Text style={{ color: '#746f67', fontSize: 13, lineHeight: '20px', margin: 0 }}>
        Код действует 10 минут. Если вы не создавали аккаунт в Ritm, просто проигнорируйте это письмо.
      </Text>
    </EmailLayout>
  );
}

export default function Preview() {
  return <VerificationCodeEmail code="123456" />;
}

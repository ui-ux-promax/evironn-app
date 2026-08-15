import { AuthVariantBController } from '@/components/evironn/auth/auth-variant-b-controller';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { readPending } from '@/lib/verification/pending-cookie';

export const metadata = { title: 'Вход — Ritm' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pending = await readPending();
  const rawCallback = typeof params.callbackUrl === 'string' ? params.callbackUrl : pending?.callbackUrl;
  return (
    <AuthVariantBController
      initialMode="login"
      callbackUrl={safeCallbackUrl(rawCallback)}
      initialVerificationPending={Boolean(pending)}
      oauthError={typeof params.error === 'string' ? params.error : null}
    />
  );
}

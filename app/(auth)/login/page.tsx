import { AuthCard } from '@/components/shared/auth/auth-card';

export const metadata = { title: 'Вход — Ritm' };

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}

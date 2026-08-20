import { AuthCard } from '@/components/shared/auth/auth-card';

export const metadata = { title: 'Регистрация — Ritm' };

export default function RegisterPage() {
  return <AuthCard initialMode="register" />;
}

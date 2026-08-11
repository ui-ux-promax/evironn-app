'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ensureVerificationGate } from '@/app/actions/verification';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { PasswordInput } from './password-input';
import { loginSchema, type LoginValues } from '@/services/dto/auth.dto';

// Сообщения по кодам ошибок Auth.js, прилетающим в ?error= при OAuth-редиректе на /login.
const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: 'Этот email уже зарегистрирован через пароль. Войдите паролем.',
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const oauthError = params.get('error');
  const callbackUrl = safeCallbackUrl(params.get('callbackUrl'));
  const [error, setError] = useState<string | null>(
    oauthError ? (OAUTH_ERRORS[oauthError] ?? 'Не удалось войти через Google') : null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (v: LoginValues) => {
    setError(null);
    const res = await signIn('credentials', { ...v, redirect: false });
    if (res?.error) {
      // Возможно, почта не верифицирована — поднимем гейт (без раскрытия существования email).
      // callbackUrl уходит в pending-cookie: гейт уведёт туда после верификации (#4).
      const gate = await ensureVerificationGate(v.email, callbackUrl);
      if (gate.gated) {
        router.refresh();
        return;
      }
      setError('Неверный email или пароль');
      return;
    }
    // Жёсткая навигация, а не router.push+refresh: refresh переспрашивал бы /login,
    // а authorized() уводит залогиненного с /login → /profile (гость терял callbackUrl, #4).
    // Полный переход на callbackUrl отдаёт и корректный хедер (сессия), и точку назначения.
    window.location.assign(callbackUrl);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {/* Email */}
      <div className="grid gap-2">
        <label htmlFor="email" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
          E-mail
        </label>
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-[18px] h-[18px] text-ink-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className={`w-full h-12 pl-[42px] pr-3.5 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${errors.email ? 'border-danger' : 'border-line'}`}
          />
        </div>
        {errors.email && <span className="text-danger text-xs font-semibold">{errors.email.message}</span>}
      </div>

      {/* Password */}
      <div className="grid gap-2">
        <label htmlFor="password" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
          Пароль
        </label>
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-[18px] h-[18px] text-ink-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
          </svg>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            error={!!errors.password}
            {...register('password')}
          />
        </div>
        {errors.password && <span className="text-danger text-xs font-semibold">{errors.password.message}</span>}
      </div>

      {/* Remember + forgot */}
      <div className="flex items-center justify-between gap-3 -mt-0.5">
        <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
          <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[hsl(var(--color-primary))]" />
          Запомнить меня
        </label>
        <a href="#" className="text-ink-muted text-[13.5px] font-semibold hover:text-ink transition-colors">
          Забыли пароль?
        </a>
      </div>

      {/* Error */}
      {error && (
        <p className="text-danger text-sm font-semibold" role="alert">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-[52px] rounded-full bg-primary text-primary-foreground text-[15px] font-bold inline-flex items-center justify-center gap-2.5 hover:bg-footer transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Входим…' : 'Войти'}
        {!isSubmitting && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}

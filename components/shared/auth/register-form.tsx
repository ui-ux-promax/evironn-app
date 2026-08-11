'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordInput } from './password-input';
import { registerFormSchema, type RegisterFormValues } from '@/services/dto/auth.dto';
import { registerUser } from '@/app/actions/auth';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { useCountdown } from '@/hooks/use-countdown';

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get('callbackUrl'));
  const [error, setError] = useState<string | null>(null);
  const { seconds: retry, start: startRetry } = useCountdown();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = async (v: RegisterFormValues) => {
    setError(null);
    // На сервер уходят только поля registerSchema; confirmPassword/agree — клиентская валидация.
    // callbackUrl (#4) кладётся в pending-cookie: гейт уведёт туда после верификации.
    const res = await registerUser({ name: v.name, email: v.email, password: v.password }, callbackUrl);
    if (!res.ok) {
      setError(res.error);
      if (res.retryAfterSec && res.retryAfterSec > 0) startRetry(res.retryAfterSec);
      return;
    }
    // P2.2c: pending-cookie уже стоит (registerUser), refresh → RootLayout отрендерит модалку верификации.
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {/* Name */}
      <div className="grid gap-2">
        <label htmlFor="name" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
          Имя
        </label>
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-[18px] h-[18px] text-ink-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
          </svg>
          <input
            id="name"
            autoComplete="name"
            placeholder="Как вас зовут"
            {...register('name')}
            className={`w-full h-12 pl-[42px] pr-3.5 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${errors.name ? 'border-danger' : 'border-line'}`}
          />
        </div>
        {errors.name && <span className="text-danger text-xs font-semibold">{errors.name.message}</span>}
      </div>

      {/* Email */}
      <div className="grid gap-2">
        <label htmlFor="reg-email" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
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
            id="reg-email"
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
        <label htmlFor="reg-password" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
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
            id="reg-password"
            autoComplete="new-password"
            error={!!errors.password}
            {...register('password')}
          />
        </div>
        {errors.password && <span className="text-danger text-xs font-semibold">{errors.password.message}</span>}
      </div>

      {/* Confirm */}
      <div className="grid gap-2">
        <label htmlFor="confirm" className="text-ink-muted text-xs font-bold uppercase tracking-wider">
          Повторите пароль
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
            id="confirm"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </div>
        {errors.confirmPassword && (
          <span className="text-danger text-xs font-semibold">{errors.confirmPassword.message}</span>
        )}
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 text-[12.5px] text-ink-muted leading-[1.5] cursor-pointer">
        <input
          type="checkbox"
          className="w-[18px] h-[18px] mt-0.5 shrink-0 accent-[hsl(var(--color-primary))]"
          {...register('agree')}
        />
        <span>Я принимаю условия использования демонстрационного сервиса Evironn.</span>
      </label>
      {errors.agree && <span className="text-danger text-xs font-semibold">{errors.agree.message}</span>}

      {/* Error */}
      {error && (
        <p className="text-danger text-sm font-semibold" role="alert">
          {error}
          {retry > 0 ? ` Попробуйте через ${retry} сек` : ''}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || retry > 0}
        className="h-[52px] rounded-full bg-primary text-primary-foreground text-[15px] font-bold inline-flex items-center justify-center gap-2.5 hover:bg-footer transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Создаём…' : 'Создать аккаунт'}
        {!isSubmitting && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}

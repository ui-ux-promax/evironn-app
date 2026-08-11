'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { ensureVerificationGate } from '@/app/actions/verification';
import { registerUser } from '@/app/actions/auth';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { useCountdown } from '@/hooks/use-countdown';
import { loginSchema, type LoginValues, registerFormSchema, type RegisterFormValues } from '@/services/dto/auth.dto';

const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: 'Этот email уже зарегистрирован через пароль. Войдите паролем.',
};

const COPY = {
  login: {
    title: 'С возвращением',
    subtitle: 'Войдите в аккаунт Ritm, чтобы продолжить покупки.',
    submit: 'Войти',
    foot: 'Ещё нет аккаунта?',
    footBtn: 'Зарегистрироваться',
  },
  register: {
    title: 'Создайте аккаунт',
    subtitle: 'Присоединяйтесь к Ritm Club — это займёт минуту.',
    submit: 'Создать аккаунт',
    foot: 'Уже с нами?',
    footBtn: 'Войти',
  },
} as const;

type Mode = 'login' | 'register';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.7 0-1.85-.83-3-.8-1.55.02-2.98.9-3.78 2.29-1.6 2.8-.41 6.95 1.15 9.23.76 1.11 1.67 2.36 2.86 2.31 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.13 2.76-2.25.87-1.29 1.23-2.54 1.25-2.6-.03-.01-2.4-.92-2.42-3.65ZM15.3 5.8c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.66 1.37-.58.68-1.09 1.76-.95 2.8 1.02.08 2.05-.51 2.67-1.27Z" />
    </svg>
  );
}

function PasswordField({
  id,
  autoComplete,
  error,
  message,
  registration,
}: {
  id: string;
  autoComplete: string;
  error?: boolean;
  message?: string;
  registration: ReturnType<typeof useForm<RegisterFormValues>>['register'];
}) {
  const [show, setShow] = useState(false);
  const fieldName = id === 'reg-password' ? 'password' : 'confirmPassword';
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-ink-muted text-xs font-bold uppercase tracking-wider">
        {id === 'reg-password' ? 'Пароль' : 'Повторите пароль'}
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
        <input
          id={id}
          {...registration(fieldName as any)}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="Ваш пароль"
          className={`w-full h-12 pl-[42px] pr-11 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${error ? 'border-danger' : 'border-line'}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-[34px] h-[34px] grid place-items-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
          aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {show ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
        </button>
      </div>
      {error && message && <span className="text-danger text-xs font-semibold">{message}</span>}
    </div>
  );
}

function AuthInner({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get('callbackUrl'));
  const [mode, setMode] = useState<Mode>(initialMode);

  // Login state
  const oauthError = params.get('error');
  const [loginError, setLoginError] = useState<string | null>(
    oauthError ? (OAUTH_ERRORS[oauthError] ?? 'Не удалось войти через Google') : null,
  );
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Register state
  const [regError, setRegError] = useState<string | null>(null);
  const { seconds: retry, start: startRetry } = useCountdown();
  const regForm = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onLogin = async (v: LoginValues) => {
    setLoginError(null);
    const res = await signIn('credentials', { ...v, redirect: false });
    if (res?.error) {
      const gate = await ensureVerificationGate(v.email, callbackUrl);
      if (gate.gated) {
        router.refresh();
        return;
      }
      setLoginError('Неверный email или пароль');
      return;
    }
    window.location.assign(callbackUrl);
  };

  const onRegister = async (v: RegisterFormValues) => {
    setRegError(null);
    const res = await registerUser({ name: v.name, email: v.email, password: v.password }, callbackUrl);
    if (!res.ok) {
      setRegError(res.error);
      if (res.retryAfterSec && res.retryAfterSec > 0) startRetry(res.retryAfterSec);
      return;
    }
    router.refresh();
  };

  const c = COPY[mode];
  const isLogin = mode === 'login';

  return (
    <div className="w-full max-w-[420px]">
      {/* Head */}
      <div className="mb-6 text-center">
        <h1 className="font-display font-bold text-[26px] sm:text-[32px] leading-[1.05] tracking-tight">{c.title}</h1>
        <p className="mt-2 text-ink-muted text-sm">{c.subtitle}</p>
      </div>

      {/* Tabs — pill switcher like prototype */}
      <div className="relative grid grid-cols-2 gap-1 p-1 rounded-full bg-surface-soft border border-line mb-6">
        <span
          className="absolute z-0 top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(.4,.8,.3,1)]"
          style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
        />
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`relative z-1 h-[42px] rounded-full text-sm font-bold transition-colors ${isLogin ? 'text-primary-foreground' : 'text-ink-muted'}`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`relative z-1 h-[42px] rounded-full text-sm font-bold transition-colors ${!isLogin ? 'text-primary-foreground' : 'text-ink-muted'}`}
        >
          Регистрация
        </button>
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled
          className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-line bg-surface text-[13.5px] font-bold opacity-50 cursor-not-allowed"
        >
          <GoogleIcon /> Google
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 h-[46px] border border-line rounded-full bg-surface text-[13.5px] font-bold opacity-50 cursor-not-allowed"
        >
          <AppleIcon /> Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3.5 my-[22px] text-ink-muted text-xs font-semibold">
        <span className="h-px flex-1 bg-line" />
        или по e-mail
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Forms */}
      {isLogin ? (
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="grid gap-4" noValidate>
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
                {...loginForm.register('email')}
                className={`w-full h-12 pl-[42px] pr-3.5 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${loginForm.formState.errors.email ? 'border-danger' : 'border-line'}`}
              />
            </div>
            {loginForm.formState.errors.email && (
              <span className="text-danger text-xs font-semibold">{loginForm.formState.errors.email.message}</span>
            )}
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
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ваш пароль"
                {...loginForm.register('password')}
                className={`w-full h-12 pl-[42px] pr-11 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${loginForm.formState.errors.password ? 'border-danger' : 'border-line'}`}
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('password') as HTMLInputElement;
                  el.type = el.type === 'password' ? 'text' : 'password';
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-[34px] h-[34px] grid place-items-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                aria-label="Показать пароль"
              >
                <Eye className="w-[19px] h-[19px]" />
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <span className="text-danger text-xs font-semibold">{loginForm.formState.errors.password.message}</span>
            )}
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
          {loginError && (
            <p className="text-danger text-sm font-semibold" role="alert">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loginForm.formState.isSubmitting}
            className="h-[52px] rounded-full bg-primary text-primary-foreground text-[15px] font-bold inline-flex items-center justify-center gap-2.5 hover:bg-footer transition-colors disabled:opacity-50"
          >
            {loginForm.formState.isSubmitting ? 'Входим…' : 'Войти'}
            {!loginForm.formState.isSubmitting && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={regForm.handleSubmit(onRegister)} className="grid gap-4" noValidate>
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
                {...regForm.register('name')}
                className={`w-full h-12 pl-[42px] pr-3.5 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${regForm.formState.errors.name ? 'border-danger' : 'border-line'}`}
              />
            </div>
            {regForm.formState.errors.name && (
              <span className="text-danger text-xs font-semibold">{regForm.formState.errors.name.message}</span>
            )}
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
                {...regForm.register('email')}
                className={`w-full h-12 pl-[42px] pr-3.5 border rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/75 ${regForm.formState.errors.email ? 'border-danger' : 'border-line'}`}
              />
            </div>
            {regForm.formState.errors.email && (
              <span className="text-danger text-xs font-semibold">{regForm.formState.errors.email.message}</span>
            )}
          </div>
          {/* Password */}
          <PasswordField
            id="reg-password"
            autoComplete="new-password"
            error={!!regForm.formState.errors.password}
            message={regForm.formState.errors.password?.message}
            registration={regForm.register}
          />
          {/* Confirm */}
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            error={!!regForm.formState.errors.confirmPassword}
            message={regForm.formState.errors.confirmPassword?.message}
            registration={regForm.register}
          />
          {/* Terms */}
          <label className="flex items-start gap-2.5 text-[12.5px] text-ink-muted leading-[1.5] cursor-pointer">
            <input
              type="checkbox"
              className="w-[18px] h-[18px] mt-0.5 shrink-0 accent-[hsl(var(--color-primary))]"
              {...regForm.register('agree')}
            />
            <span>Я принимаю условия использования демонстрационного сервиса Evironn.</span>
          </label>
          {regForm.formState.errors.agree && (
            <span className="text-danger text-xs font-semibold">{regForm.formState.errors.agree.message}</span>
          )}
          {regError && (
            <p className="text-danger text-sm font-semibold" role="alert">
              {regError}
              {retry > 0 ? ` Попробуйте через ${retry} сек` : ''}
            </p>
          )}
          <button
            type="submit"
            disabled={regForm.formState.isSubmitting || retry > 0}
            className="h-[52px] rounded-full bg-primary text-primary-foreground text-[15px] font-bold inline-flex items-center justify-center gap-2.5 hover:bg-footer transition-colors disabled:opacity-50"
          >
            {regForm.formState.isSubmitting ? 'Создаём…' : 'Создать аккаунт'}
            {!regForm.formState.isSubmitting && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
      )}

      {/* Foot */}
      <p className="mt-[22px] text-center text-ink-muted text-[13.5px]">
        {c.foot}{' '}
        <button
          type="button"
          onClick={() => setMode(isLogin ? 'register' : 'login')}
          className="text-ink font-bold underline underline-offset-2"
        >
          {c.footBtn}
        </button>
      </p>
    </div>
  );
}

export function AuthCard({ initialMode }: { initialMode: Mode }) {
  return (
    <Suspense fallback={null}>
      <AuthInner initialMode={initialMode} />
    </Suspense>
  );
}

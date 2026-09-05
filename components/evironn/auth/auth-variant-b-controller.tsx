'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import { ensureVerificationGate, resendVerificationCode, verifyEmailCode } from '@/app/actions/verification';
import { safeCallbackUrl } from '@/lib/safe-redirect';
import { VERIFICATION_RESEND_COOLDOWN_MS } from '@/constants/config';
import { loginSchema, registerFormSchema, verifyCodeSchema } from '@/services/dto/auth.dto';
import { AuthVariantB } from './auth-variant-b';
import {
  emptyAuthVariantBValues,
  type AuthVariantBErrors,
  type AuthVariantBField,
  type AuthVariantBMode,
  type AuthVariantBValues,
} from './auth-variant-b-state';

export interface AuthVariantBControllerProps {
  initialMode: 'login' | 'register';
  callbackUrl: string;
  initialVerificationPending: boolean;
  oauthError: string | null;
}

const VERIFY_MESSAGES: Record<string, string> = {
  wrong: 'Неверный код. Проверьте и попробуйте снова.',
  expired: 'Код истёк. Запросите новый.',
  locked: 'Слишком много попыток. Запросите новый код.',
  rate: 'Слишком часто. Подождите немного.',
  invalid: 'Код состоит из 6 цифр.',
  'no-session': 'Сессия истекла. Зарегистрируйтесь заново.',
};

function zodErrors(error: { issues: Array<{ path: (string | number)[]; message: string }> }): AuthVariantBErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

export function AuthVariantBController({
  initialMode,
  callbackUrl,
  initialVerificationPending,
  oauthError,
}: AuthVariantBControllerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthVariantBMode>(initialVerificationPending ? 'verify' : initialMode);
  const [values, setValues] = useState<AuthVariantBValues>(emptyAuthVariantBValues);
  const [errors, setErrors] = useState<AuthVariantBErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const safeCallback = safeCallbackUrl(callbackUrl);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const onFieldChange = (field: AuthVariantBField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const submitLogin = async () => {
    const parsed = loginSchema.safeParse({ email: values.email, password: values.password });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await signIn('credentials', { ...parsed.data, redirect: false });
      if (result?.error) {
        const gate = await ensureVerificationGate(parsed.data.email, safeCallback);
        if (gate.gated) {
          setMode('verify');
          return;
        }
        setError('Неверный email или пароль');
        return;
      }
      router.push(safeCallback);
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    const parsed = registerFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = zodErrors(parsed.error);
      if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Пароли не совпадают';
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await registerUser(
        { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
        safeCallback,
      );
      if (!result.ok) {
        setError(result.error);
        if (result.retryAfterSec) setResendSeconds(result.retryAfterSec);
        return;
      }
      setMode('verify');
    } catch {
      setError('Не удалось завершить регистрацию. Попробуйте позже');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'login') await submitLogin();
    else if (mode === 'register') await submitRegister();
  };

  const onVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await verifyCode();
  };

  const verifyCode = async () => {
    if (busy || !/^\d{6}$/.test(values.code)) return;
    const parsed = verifyCodeSchema.safeParse({ code: values.code });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await verifyEmailCode(parsed.data);
      if (result.ok) {
        router.push(safeCallback);
        return;
      }
      setErrors({ code: VERIFY_MESSAGES[result.reason] ?? 'Не удалось подтвердить код.' });
    } catch {
      setError('Не удалось подтвердить код. Попробуйте позже');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (resendSeconds > 0 || resendBusy) return;
    setResendBusy(true);
    setError(null);
    try {
      const result = await resendVerificationCode();
      if (!result.ok) {
        setError(VERIFY_MESSAGES[result.error ?? ''] ?? 'Не удалось отправить код.');
        return;
      }
      setResendSeconds(Math.round(VERIFICATION_RESEND_COOLDOWN_MS / 1000));
    } catch {
      setError('Не удалось отправить код. Попробуйте позже');
    } finally {
      setResendBusy(false);
    }
  };

  const onGoogle = async () => {
    if (oauthBusy || busy) return;
    setOauthBusy(true);
    setError(null);
    try {
      await signIn('google', { redirectTo: safeCallback });
    } catch {
      setError('Не удалось войти через Google');
    } finally {
      setOauthBusy(false);
    }
  };

  return (
    <AuthVariantB
      mode={mode}
      values={values}
      errors={errors}
      oauthError={oauthError}
      busy={busy}
      resendBusy={resendBusy}
      oauthBusy={oauthBusy}
      resendSeconds={resendSeconds}
      passwordVisible={passwordVisible}
      onModeChange={(next) => {
        setMode(next);
        setError(null);
        setErrors({});
      }}
      onFieldChange={onFieldChange}
      onConsentChange={(agree) => setValues((current) => ({ ...current, agree }))}
      onTogglePassword={() => setPasswordVisible((visible) => !visible)}
      onSubmit={onSubmit}
      onVerify={onVerify}
      onVerifyCode={() => void verifyCode()}
      onResend={onResend}
      onGoogle={() => void onGoogle()}
      error={error}
    />
  );
}

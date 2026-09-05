'use client';

import { type FormEvent, type KeyboardEvent, type Ref, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiRefreshCw, FiShield, FiUser } from 'react-icons/fi';
import { ConsentBlock, Field, FormError, SubmitButton } from '@/components/evironn/forms/form-primitives';
import { FadeArc } from '@/components/loading-ui/fade-arc';
import {
  passwordStrength,
  type AuthVariantBErrors,
  type AuthVariantBField,
  type AuthVariantBMode,
  type AuthVariantBValues,
} from './auth-variant-b-state';

export interface AuthVariantBProps {
  mode: AuthVariantBMode;
  values: AuthVariantBValues;
  errors: AuthVariantBErrors;
  oauthError: string | null;
  busy: boolean;
  resendBusy: boolean;
  oauthBusy: boolean;
  resendSeconds: number;
  passwordVisible: boolean;
  onModeChange: (mode: 'login' | 'register') => void;
  onFieldChange: (field: AuthVariantBField, value: string) => void;
  onConsentChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
  onVerifyCode: () => void;
  onResend: () => void;
  onGoogle: () => void;
  error: string | null;
}

function VerificationCodeInput({
  value,
  error,
  disabled,
  onChange,
}: {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const labelId = 'verification-code-label';

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setCharacter = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6);
    if (index === 0 && digits.length > 1) {
      onChange(digits);
      refs.current[Math.min(digits.length, 6) - 1]?.focus();
      return;
    }

    const characters = value.padEnd(6, ' ').slice(0, 6).split('');
    characters[index] = digits.slice(-1) || ' ';
    onChange(characters.join('').trimEnd());
    if (digits && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <div
      className={`auth-otp${error ? ' is-bad' : ''}`}
      role="group"
      aria-labelledby={labelId}
      onPaste={(event) => {
        event.preventDefault();
        const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!digits) return;
        onChange(digits);
        refs.current[Math.min(digits.length, 6) - 1]?.focus();
      }}
    >
      <span className="auth-otp__label" id={labelId}>
        Код из сообщения
      </span>
      <div className="auth-otp__cells">
        {Array.from({ length: 6 }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={6}
            disabled={disabled}
            value={value[index] ?? ''}
            aria-label={`Цифра ${index + 1}`}
            aria-invalid={Boolean(error)}
            onChange={(event) => setCharacter(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus();
            }}
          />
        ))}
      </div>
      {error && (
        <span className="auth-otp__note" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  error,
  visible,
  autoComplete,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  error?: string;
  visible: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <Field
      label={label}
      value={value}
      error={error}
      placeholder="Минимум 8 символов"
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      onChange={onChange}
      accessory={
        <button
          className="auth-password-toggle"
          type="button"
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          onClick={onToggle}
        >
          {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      }
    />
  );
}

function AuthTab({
  selected,
  id,
  tabIndex,
  tabPanelId,
  tabRef,
  onClick,
  onKeyDown,
  children,
  href,
}: {
  selected: boolean;
  id: string;
  tabIndex: number;
  tabPanelId: string;
  tabRef: Ref<HTMLAnchorElement>;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
  children: string;
  href: string;
}) {
  return (
    <a
      id={id}
      href={href}
      role="tab"
      aria-selected={selected}
      aria-controls={tabPanelId}
      tabIndex={tabIndex}
      ref={tabRef}
      className={selected ? 'is-on' : ''}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </a>
  );
}

export function AuthVariantB({
  mode,
  values,
  errors,
  oauthError,
  busy,
  resendBusy,
  oauthBusy,
  resendSeconds,
  passwordVisible,
  onModeChange,
  onFieldChange,
  onConsentChange,
  onTogglePassword,
  onSubmit,
  onVerify,
  onVerifyCode,
  onResend,
  onGoogle,
  error,
}: AuthVariantBProps) {
  const [remember, setRemember] = useState(true);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const lastSubmittedCode = useRef<string | null>(null);
  const strength = passwordStrength(values.password);
  const selectTab = (current: 'login' | 'register') => (event: KeyboardEvent<HTMLAnchorElement>) => {
    const modes = ['login', 'register'] as const;
    const currentIndex = modes.indexOf(current);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % modes.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex + modes.length - 1) % modes.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = modes.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onModeChange(current);
      return;
    } else return;

    event.preventDefault();
    onModeChange(modes[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };
  const message =
    oauthError === 'OAuthAccountNotLinked'
      ? 'Этот email уже зарегистрирован через пароль. Войдите паролем.'
      : oauthError
        ? 'Не удалось войти через Google'
        : error;

  useEffect(() => {
    if (mode !== 'verify' || !/^\d{6}$/.test(values.code) || busy) {
      if (!/^\d{6}$/.test(values.code)) lastSubmittedCode.current = null;
      return;
    }
    if (lastSubmittedCode.current === values.code) return;
    lastSubmittedCode.current = values.code;
    onVerifyCode();
  }, [busy, mode, onVerifyCode, values.code]);

  if (mode === 'verify') {
    return (
      <main className="auth-page auth-page--b" id="main-content">
        <div className="auth-page__stage" aria-hidden="true">
          <img src="/assets/products/05-graphite-walnut-room-integrated-v2.webp" alt="" />
          <p>Место для вещей, к которым хочется возвращаться.</p>
        </div>
        <section className="auth-page__shell" aria-live="polite">
          <header className="auth-page__head">
            <p className="auth-kicker">Личный кабинет</p>
            <h1>Подтвердите почту</h1>
            <p>Введите шесть цифр из последнего сообщения.</p>
          </header>
          <form className="auth-panel" onSubmit={onVerify} noValidate>
            <FormError message={error ?? ''} />
            <VerificationCodeInput
              value={values.code}
              error={errors.code}
              disabled={busy}
              onChange={(value) => onFieldChange('code', value)}
            />
            <button
              className="auth-resend"
              type="button"
              disabled={resendSeconds > 0 || busy || resendBusy}
              aria-busy={resendBusy}
              onClick={onResend}
            >
              {resendBusy ? (
                <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <FiRefreshCw aria-hidden="true" />
              )}
              {resendBusy
                ? 'Отправляем код…'
                : resendSeconds > 0
                  ? `Повторный код через ${resendSeconds} с`
                  : 'Отправить код повторно'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const isLogin = mode === 'login';
  return (
    <main className="auth-page auth-page--b" id="main-content">
      <div className="auth-page__stage" aria-hidden="true">
        <img src="/assets/products/05-graphite-walnut-room-integrated-v2.webp" alt="" />
        <p>Место для вещей, к которым хочется возвращаться.</p>
      </div>
      <div className="auth-page__composition" aria-hidden="true">
        <img
          className="auth-page__composition-one"
          src="/assets/products/05-terracotta-walnut-chair-alpha.webp"
          alt=""
        />
        <img className="auth-page__composition-two" src="/assets/products/05-ivory-walnut-chair-alpha.webp" alt="" />
      </div>
      <section className="auth-page__shell" aria-live="polite">
        <header className="auth-page__head">
          <p className="auth-kicker">Личный кабинет</p>
          <h1>{isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}</h1>
          <p>
            {isLogin
              ? 'Сохраним избранное, адреса и историю заказов.'
              : 'Один аккаунт для избранного, адресов и заказов.'}
          </p>
        </header>
        <div className={`auth-tabs auth-tabs--${mode}`} role="tablist" aria-label="Режим аккаунта">
          <span className="auth-tabs__indicator" aria-hidden="true" />
          <AuthTab
            selected={isLogin}
            id="auth-tab-login"
            tabIndex={isLogin ? 0 : -1}
            tabPanelId="auth-panel"
            tabRef={(element) => {
              tabRefs.current[0] = element;
            }}
            onClick={() => onModeChange('login')}
            onKeyDown={selectTab('login')}
            href="/login"
          >
            Войти
          </AuthTab>
          <AuthTab
            selected={!isLogin}
            id="auth-tab-register"
            tabIndex={isLogin ? -1 : 0}
            tabPanelId="auth-panel"
            tabRef={(element) => {
              tabRefs.current[1] = element;
            }}
            onClick={() => onModeChange('register')}
            onKeyDown={selectTab('register')}
            href="/register"
          >
            Регистрация
          </AuthTab>
        </div>
        <div
          className="auth-panel"
          id="auth-panel"
          role="tabpanel"
          aria-labelledby={isLogin ? 'auth-tab-login' : 'auth-tab-register'}
          tabIndex={0}
        >
          <FormError message={message ?? ''} />
          {isLogin ? (
            <form className="auth-fields" onSubmit={onSubmit} noValidate>
              <Field
                label="E-mail"
                value={values.email}
                error={errors.email}
                placeholder="anna@mail.ru"
                autoComplete="email"
                inputMode="email"
                onChange={(value) => onFieldChange('email', value)}
              />
              <PasswordField
                label="Пароль"
                value={values.password}
                error={errors.password}
                visible={passwordVisible}
                autoComplete="current-password"
                onChange={(value) => onFieldChange('password', value)}
                onToggle={onTogglePassword}
              />
              <div className="auth-options">
                <label>
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  <span aria-hidden="true">
                    <FiCheck />
                  </span>
                  Запомнить меня
                </label>
              </div>
              <SubmitButton status={busy ? 'sending' : 'idle'} disabled={false} label="Войти" />
            </form>
          ) : (
            <form className="auth-fields" onSubmit={onSubmit} noValidate>
              <Field
                label="Имя"
                value={values.name}
                error={errors.name}
                placeholder="Анна"
                autoComplete="name"
                onChange={(value) => onFieldChange('name', value)}
              />
              <Field
                label="E-mail"
                value={values.email}
                error={errors.email}
                placeholder="anna@mail.ru"
                autoComplete="email"
                inputMode="email"
                onChange={(value) => onFieldChange('email', value)}
              />
              <PasswordField
                label="Пароль"
                value={values.password}
                error={errors.password}
                visible={passwordVisible}
                autoComplete="new-password"
                onChange={(value) => onFieldChange('password', value)}
                onToggle={onTogglePassword}
              />
              <div className={`auth-strength auth-strength--${strength}`} aria-label={`Надёжность пароля: ${strength}`}>
                <span />
                <span />
                <span />
                <em>
                  {strength === 'strong'
                    ? 'Надёжный пароль'
                    : strength === 'medium'
                      ? 'Можно усилить пароль'
                      : 'Добавьте цифры или символы'}
                </em>
              </div>
              <PasswordField
                label="Повторите пароль"
                value={values.confirmPassword}
                error={errors.confirmPassword}
                visible={passwordVisible}
                autoComplete="new-password"
                onChange={(value) => onFieldChange('confirmPassword', value)}
                onToggle={onTogglePassword}
              />
              <ConsentBlock checked={values.agree} error={errors.agree} onToggle={onConsentChange} />
              <SubmitButton status={busy ? 'sending' : 'idle'} disabled={false} label="Продолжить" />
            </form>
          )}
          {isLogin && (
            <>
              <div className="auth-divider">
                <span>или</span>
              </div>
              <div className="auth-social">
                <button
                  type="button"
                  onClick={onGoogle}
                  disabled={busy || oauthBusy}
                  aria-busy={oauthBusy || undefined}
                >
                  {oauthBusy ? (
                    <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <FiMail aria-hidden="true" />
                  )}{' '}
                  Google
                </button>
              </div>
            </>
          )}
          {!isLogin && (
            <p className="auth-switch">
              Уже есть аккаунт?{' '}
              <a
                href="/login"
                onClick={(event) => {
                  event.preventDefault();
                  onModeChange('login');
                }}
              >
                Войти
              </a>
            </p>
          )}
        </div>
        <footer className="auth-page__foot">
          <Link href="/">
            <FiUser aria-hidden="true" /> Вернуться на главную <FiArrowRight aria-hidden="true" />
          </Link>
        </footer>
      </section>
    </main>
  );
}

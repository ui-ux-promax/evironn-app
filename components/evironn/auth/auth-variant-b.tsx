'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiRefreshCw, FiShield, FiUser } from 'react-icons/fi';
import { ConsentBlock, Field, FormError, SubmitButton } from '@/components/evironn/forms/form-primitives';
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
  resendSeconds: number;
  passwordVisible: boolean;
  onModeChange: (mode: 'login' | 'register') => void;
  onFieldChange: (field: AuthVariantBField, value: string) => void;
  onConsentChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onGoogle: () => void;
  error: string | null;
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
  mode,
  selected,
  onClick,
  onKeyDown,
  children,
  href,
}: {
  mode: 'login' | 'register';
  selected: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
  children: string;
  href: string;
}) {
  return (
    <a
      href={href}
      role="tab"
      aria-selected={selected}
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
  resendSeconds,
  passwordVisible,
  onModeChange,
  onFieldChange,
  onConsentChange,
  onTogglePassword,
  onSubmit,
  onVerify,
  onResend,
  onGoogle,
  error,
}: AuthVariantBProps) {
  const [remember, setRemember] = useState(true);
  const strength = passwordStrength(values.password);
  const selectTab = (next: 'login' | 'register') => (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onModeChange(next);
    }
  };
  const message =
    oauthError === 'OAuthAccountNotLinked'
      ? 'Этот email уже зарегистрирован через пароль. Войдите паролем.'
      : oauthError
        ? 'Не удалось войти через Google'
        : error;

  if (mode === 'verify') {
    return (
      <main className="auth-page auth-page--b" id="main-content">
        <div className="auth-page__stage" aria-hidden="true">
          <img src="/assets/products/05-graphite-walnut-room-integrated-v2.png" alt="" />
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
            <Field
              label="Код из сообщения"
              value={values.code}
              error={errors.code}
              placeholder="Введите 6 цифр"
              inputMode="numeric"
              autoComplete="one-time-code"
              onChange={(value) => onFieldChange('code', value.replace(/\D/g, '').slice(0, 6))}
            />
            <SubmitButton
              status={busy ? 'sending' : 'idle'}
              disabled={values.code.length !== 6}
              label="Подтвердить"
              sendingLabel="Проверяем код…"
            />
            <button className="auth-resend" type="button" disabled={resendSeconds > 0 || busy} onClick={onResend}>
              <FiRefreshCw aria-hidden="true" />
              {resendSeconds > 0 ? `Повторный код через ${resendSeconds} с` : 'Отправить код повторно'}
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
        <img src="/assets/products/05-graphite-walnut-room-integrated-v2.png" alt="" />
        <p>Место для вещей, к которым хочется возвращаться.</p>
      </div>
      <div className="auth-page__composition" aria-hidden="true">
        <img
          className="auth-page__composition-one"
          src="/assets/products/05-terracotta-walnut-chair-alpha.png"
          alt=""
        />
        <img className="auth-page__composition-two" src="/assets/products/05-ivory-walnut-chair-alpha.png" alt="" />
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
            mode="login"
            selected={isLogin}
            onClick={() => onModeChange('login')}
            onKeyDown={selectTab('login')}
            href="/login"
          >
            Войти
          </AuthTab>
          <AuthTab
            mode="register"
            selected={!isLogin}
            onClick={() => onModeChange('register')}
            onKeyDown={selectTab('register')}
            href="/register"
          >
            Регистрация
          </AuthTab>
        </div>
        <div className="auth-panel">
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
                <button type="button" onClick={onGoogle}>
                  <FiMail aria-hidden="true" /> Google
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
          <a href="/">
            <FiUser aria-hidden="true" /> Вернуться на главную <FiArrowRight aria-hidden="true" />
          </a>
        </footer>
      </section>
    </main>
  );
}

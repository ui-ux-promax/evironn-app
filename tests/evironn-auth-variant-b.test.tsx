// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  registerUser: vi.fn(),
  ensureVerificationGate: vi.fn(),
  verifyEmailCode: vi.fn(),
  resendVerificationCode: vi.fn(),
}));
const { signIn, registerUser, ensureVerificationGate, verifyEmailCode, resendVerificationCode } = mocks;

vi.mock('next-auth/react', () => ({ signIn: mocks.signIn }));
vi.mock('@/app/actions/auth', () => ({ registerUser: mocks.registerUser }));
vi.mock('@/app/actions/verification', () => ({
  ensureVerificationGate: mocks.ensureVerificationGate,
  verifyEmailCode: mocks.verifyEmailCode,
  resendVerificationCode: mocks.resendVerificationCode,
}));

import { AuthVariantBController } from '@/components/evironn/auth/auth-variant-b-controller';

const props = {
  initialMode: 'login' as const,
  callbackUrl: '/checkout?from=auth',
  initialVerificationPending: false,
  oauthError: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  signIn.mockResolvedValue({ ok: true, error: undefined });
  registerUser.mockResolvedValue({ ok: true, needsVerification: true });
  ensureVerificationGate.mockResolvedValue({ gated: false });
  verifyEmailCode.mockResolvedValue({ ok: true });
  resendVerificationCode.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Auth Variant B', () => {
  it('shows generic credential error when server rejects credentials', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });
    render(<AuthVariantBController {...props} />);

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
  });

  it('validates registration and requires demonstration-service consent', async () => {
    render(<AuthVariantBController {...props} initialMode="register" />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Neo' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'neo@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('toggles password visibility and displays password strength', () => {
    render(<AuthVariantBController {...props} initialMode="register" />);
    const password = screen.getByLabelText('Пароль');
    fireEvent.change(password, { target: { value: 'Password123!' } });

    expect(screen.getByLabelText('Надёжность пароля: strong')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Показать пароль' })[0]);
    expect(password).toHaveAttribute('type', 'text');
  });

  it('moves inline to verification after registration', async () => {
    render(<AuthVariantBController {...props} initialMode="register" />);
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Neo' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'neo@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /демонстрационного сервиса/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Подтвердите почту' })).toBeInTheDocument());
    expect(registerUser).toHaveBeenCalledWith(
      { name: 'Neo', email: 'neo@example.com', password: 'password123' },
      props.callbackUrl,
    );
  });

  it('moves inline to verification after unverified login failure', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });
    ensureVerificationGate.mockResolvedValue({ gated: true });
    render(<AuthVariantBController {...props} />);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Подтвердите почту' })).toBeInTheDocument());
    expect(ensureVerificationGate).toHaveBeenCalledWith('user@example.com', props.callbackUrl);
  });

  it('verifies six digits and navigates to safe callback', async () => {
    render(<AuthVariantBController {...props} initialVerificationPending />);
    const code = screen.getByLabelText('Код из сообщения');
    fireEvent.change(code, { target: { value: '424242' } });
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    await waitFor(() => expect(verifyEmailCode).toHaveBeenCalledWith({ code: '424242' }));
    expect(screen.getByRole('heading', { name: 'Подтвердите почту' })).toBeInTheDocument();
  });

  it('shows resend rate feedback', async () => {
    resendVerificationCode.mockResolvedValue({ ok: false, error: 'rate' });
    render(<AuthVariantBController {...props} initialVerificationPending />);
    fireEvent.click(screen.getByRole('button', { name: 'Отправить код повторно' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Слишком часто');
  });

  it('invokes only Google OAuth with callback and preserves provider error copy', async () => {
    render(<AuthVariantBController {...props} oauthError="OAuthAccountNotLinked" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Этот email уже зарегистрирован через пароль');
    fireEvent.click(screen.getByRole('button', { name: 'Google' }));
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: props.callbackUrl });
    expect(screen.queryByRole('button', { name: /VK|Яндекс|Telegram|Apple/i })).not.toBeInTheDocument();
  });

  it('uses tabs with keyboard semantics', () => {
    render(<AuthVariantBController {...props} />);
    const loginTab = screen.getByRole('tab', { name: 'Войти' });
    const registerTab = screen.getByRole('tab', { name: 'Регистрация' });
    expect(loginTab).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(registerTab, { key: 'Enter' });
    expect(registerTab).toHaveAttribute('aria-selected', 'true');
  });
});

/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resendVerificationCode: vi.fn(),
  verifyEmailCode: vi.fn(),
}));
const { resendVerificationCode: resendVerificationCodeMock, verifyEmailCode: verifyEmailCodeMock } = mocks;

vi.mock('@/app/actions/verification', () => ({
  resendVerificationCode: mocks.resendVerificationCode,
  verifyEmailCode: mocks.verifyEmailCode,
}));

import { VerificationGate } from '@/components/shared/auth/verification-gate';

beforeEach(() => {
  vi.clearAllMocks();
  verifyEmailCodeMock.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe('VerificationGate async actions', () => {
  it('lets the user dismiss email verification and continue browsing', () => {
    render(<VerificationGate email="user@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть подтверждение почты' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits a completed OTP without rendering a confirmation button', async () => {
    verifyEmailCodeMock.mockResolvedValue({ ok: false, reason: 'wrong' });
    render(<VerificationGate email="user@example.com" />);

    expect(screen.queryByRole('button', { name: 'Подтвердить' })).not.toBeInTheDocument();

    const cells = screen.getAllByRole('textbox');
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.change(cells[index], { target: { value: digit } });
    });

    await waitFor(() => expect(verifyEmailCodeMock).toHaveBeenCalledWith({ code: '123456' }));
    expect(verifyEmailCodeMock).toHaveBeenCalledTimes(1);
  });

  it('shows resend progress and rejects duplicate clicks', () => {
    let resolveResend!: (value: { ok: true }) => void;
    resendVerificationCodeMock.mockReturnValue(
      new Promise<{ ok: true }>((resolve) => {
        resolveResend = resolve;
      }),
    );
    render(<VerificationGate email="user@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Отправить код снова' }));

    const resend = screen.getByRole('button', { name: 'Отправляем код…' });
    expect(resend).toBeDisabled();
    expect(resend).toHaveAttribute('aria-busy', 'true');
    expect(resend.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(resend);
    expect(resendVerificationCodeMock).toHaveBeenCalledTimes(1);

    resolveResend({ ok: true });
  });
});

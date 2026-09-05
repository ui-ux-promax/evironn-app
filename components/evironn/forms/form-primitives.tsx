'use client';

import { useId, type ReactNode } from 'react';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';
import { FadeArc } from '@/components/loading-ui/fade-arc';

type Tone = 'light' | 'dark';

export function Field({
  label,
  value,
  error,
  hint,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  tone = 'light',
  accessory,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'numeric';
  tone?: Tone;
  accessory?: ReactNode;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const id = useId();
  return (
    <p className={`chk-field chk-field--${tone}${error ? ' is-bad' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <span className={accessory ? 'chk-field__control has-accessory' : 'chk-field__control'}>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {accessory}
      </span>
      {(error || hint) && (
        <span className="chk-field__note" id={`${id}-note`} role={error ? 'alert' : undefined}>
          {error ? (
            <>
              <FiAlertCircle aria-hidden="true" />
              {error}
            </>
          ) : (
            hint
          )}
        </span>
      )}
    </p>
  );
}

export function ConsentBlock({
  checked,
  error,
  onToggle,
}: {
  checked: boolean;
  error?: string;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <ul className="chk-consents">
      <li className={error ? 'is-bad' : ''}>
        <label>
          <input
            type="checkbox"
            checked={checked}
            aria-invalid={Boolean(error)}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <span className="chk-check" aria-hidden="true">
            <FiCheck />
          </span>
          <span>Я принимаю условия использования демонстрационного сервиса Evironn.</span>
        </label>
        {error && (
          <p className="chk-error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            {error}
          </p>
        )}
      </li>
    </ul>
  );
}

export function FormError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div className="auth-error" role="alert">
      <FiAlertCircle aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function SubmitButton({
  status,
  disabled,
  label,
  sendingLabel = 'Проверяем данные…',
}: {
  status: 'idle' | 'sending';
  disabled: boolean;
  label: string;
  sendingLabel?: string;
}) {
  const sending = status === 'sending';
  return (
    <button
      className={`chk-submit${sending ? ' is-sending' : ''}`}
      type="submit"
      disabled={disabled || sending}
      aria-busy={sending}
    >
      {sending ? (
        <>
          <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />
          {sendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

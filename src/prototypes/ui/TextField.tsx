import type { InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  readonly id: string;
  readonly label: string;
  readonly helperText?: string;
  readonly error?: string;
}

export function TextField({
  id,
  label,
  helperText,
  error,
  className,
  'aria-describedby': ariaDescribedBy,
  ...props
}: TextFieldProps) {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;
  const classes = ['evp-field', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <label className="evp-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        className="evp-field__input"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />
      {helperText ? (
        <span className="evp-field__helper" id={helperId}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span className="evp-field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

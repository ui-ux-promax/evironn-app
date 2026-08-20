const MAX_PHONE_DIGITS = 11;
const MAX_NATIONAL_DIGITS = 10;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, MAX_PHONE_DIGITS);
}

function nationalDigits(value: string): { digits: string; validPrefix: boolean } {
  const digits = digitsOnly(value);
  if (!digits) return { digits: '', validPrefix: true };
  if (digits.startsWith('7') || digits.startsWith('8')) {
    return { digits: digits.slice(1, MAX_PHONE_DIGITS), validPrefix: true };
  }
  if (digits.length <= MAX_NATIONAL_DIGITS) return { digits, validPrefix: true };
  return { digits, validPrefix: false };
}

export function normalizeRuPhone(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return '';
  if (digits.startsWith('7')) return digits;
  if (digits.startsWith('8')) return `7${digits.slice(1)}`;
  if (digits.length === MAX_NATIONAL_DIGITS) return `7${digits}`;
  return digits;
}

export function formatRuPhone(value: string): string {
  const { digits, validPrefix } = nationalDigits(value);
  if (!digits && !digitsOnly(value)) return '';
  if (!validPrefix) return digitsOnly(value);

  let formatted = '+7';
  if (!digits) return formatted;
  formatted += ` (${digits.slice(0, 3)}`;
  if (digits.length <= 3) return formatted + ')'.slice(0, digits.length === 3 ? 1 : 0);
  formatted += `) ${digits.slice(3, 6)}`;
  if (digits.length <= 6) return formatted;
  formatted += `-${digits.slice(6, 8)}`;
  if (digits.length <= 8) return formatted;
  return `${formatted}-${digits.slice(8, 10)}`;
}

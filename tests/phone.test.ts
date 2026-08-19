import { describe, expect, it } from 'vitest';
import { formatRuPhone, normalizeRuPhone } from '@/lib/phone';

describe('Russian phone formatting', () => {
  it('formats a local ten-digit number', () => {
    expect(formatRuPhone('9231445566')).toBe('+7 (923) 144-55-66');
  });

  it('formats pasted numbers with an 8 prefix and separators', () => {
    expect(formatRuPhone('8 (923) 144-55-66')).toBe('+7 (923) 144-55-66');
  });

  it('keeps an existing +7 prefix in the display format', () => {
    expect(formatRuPhone('+7 923 144 55 66')).toBe('+7 (923) 144-55-66');
  });

  it('keeps a partially deleted number editable', () => {
    expect(formatRuPhone('+7 (923) 144-55-6')).toBe('+7 (923) 144-55-6');
  });

  it('normalizes accepted Russian formats for the server contract', () => {
    expect(normalizeRuPhone('+7 (923) 144-55-66')).toBe('79231445566');
    expect(normalizeRuPhone('8 923 144 55 66')).toBe('79231445566');
    expect(normalizeRuPhone('9231445566')).toBe('79231445566');
  });

  it('returns an empty value for empty input', () => {
    expect(formatRuPhone('')).toBe('');
    expect(normalizeRuPhone('')).toBe('');
  });

  it('preserves an invalid eleven-digit prefix for validation', () => {
    expect(normalizeRuPhone('53453345334')).toBe('53453345334');
  });
});

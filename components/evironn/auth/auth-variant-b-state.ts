export type AuthVariantBMode = 'login' | 'register' | 'verify';
export type AuthVariantBField = 'name' | 'email' | 'password' | 'confirmPassword' | 'code';
export type AuthVariantBValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  code: string;
  agree: boolean;
};
export type AuthVariantBErrors = Partial<Record<AuthVariantBField | 'agree', string>>;
export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  if (password.length < 8) return 'weak';
  const kinds = [/[a-zа-я]/i.test(password), /\d/.test(password), /[^a-zа-я\d]/i.test(password)].filter(Boolean).length;
  return kinds >= 2 && password.length >= 10 ? 'strong' : 'medium';
}

export function emptyAuthVariantBValues(): AuthVariantBValues {
  return { name: '', email: '', password: '', confirmPassword: '', code: '', agree: false };
}

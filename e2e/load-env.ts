import { loadEnvFile } from 'node:process';

function isMissingEnvFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export function loadE2eEnvironment(envPath = '.env.local'): void {
  try {
    loadEnvFile(envPath);
  } catch (error) {
    if (!isMissingEnvFile(error)) throw error;
  }
}

import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ignoredDirectories = new Set([
  '.git',
  '.superpowers',
  'coverage',
  'dist',
  'docs',
  'node_modules',
  'playwright-report',
  'test-results',
]);
const ignoredFiles = new Set([
  'package-lock.json',
  'scripts/check-repository.mjs',
]);
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
]);

export const permittedRoutes = ['/', '/product'];
export const forbiddenMarkers = [
  'gr' + 'aft',
  'file' + '://',
  'http' + '://',
  'https' + '://',
  /[A-Za-z]:\\/,
];

function extension(path) {
  return path.slice(path.lastIndexOf('.'));
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : listFiles(path);
    }

    return entry.isFile() ? [path] : [];
  });
}

function findViolations() {
  const violations = [];

  for (const file of listFiles(repositoryRoot)) {
    const path = relative(repositoryRoot, file).split(sep).join('/');

    if (ignoredFiles.has(path)) {
      continue;
    }

    if (
      forbiddenMarkers.some((marker) =>
        marker instanceof RegExp ? marker.test(path) : path.includes(marker),
      )
    ) {
      violations.push(`${path}: forbidden path marker`);
      continue;
    }

    if (!textExtensions.has(extension(path))) {
      continue;
    }

    const contents = readFileSync(file, 'utf8');
    const marker = forbiddenMarkers.find((candidate) =>
      candidate instanceof RegExp
        ? candidate.test(contents)
        : contents.includes(candidate),
    );

    if (marker) {
      violations.push(`${path}: forbidden content marker`);
    }
  }

  return violations;
}

export function auditRepository() {
  const violations = findViolations();

  if (violations.length > 0) {
    throw new Error(`Repository audit failed:\n${violations.join('\n')}`);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  auditRepository();
  console.log('Repository audit passed.');
}

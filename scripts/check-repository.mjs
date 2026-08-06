import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
  '.svg',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
]);
const forbiddenArtifactDirectories = new Set([
  'capture',
  'captures',
  'generator',
  'generators',
  'log',
  'logs',
  'screenshot',
  'screenshots',
]);
const forbiddenArtifactExtensions = new Set(['.har', '.log', '.trace']);
const forbiddenArtifactFilename =
  /(?:^|[-_.])(?:capture|generator|log|screenshot)(?:[-_.]|$)/i;
const routeManifestPath = 'src/routes.ts';
const applicationEntryPath = 'src/App.tsx';

export const permittedRoutes = ['/', '/product'];
export const forbiddenMarkers = [
  'gr' + 'aft',
  'file' + '://',
  'http' + '://',
  'https' + '://',
  /[A-Za-z]:\\/,
  new RegExp(
    '/(?:' +
      [
        ['Us', 'ers'].join(''),
        ['ho', 'me'].join(''),
        ['tm', 'p'].join(''),
        ['op', 't'].join(''),
        ['pri', 'vate'].join(''),
        ['mn', 't'].join(''),
      ].join('|') +
      ')/',
  ),
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

function hasForbiddenArtifactPath(path) {
  const segments = path.split('/');
  const filename = segments.at(-1) ?? '';

  return (
    segments.some((segment) =>
      forbiddenArtifactDirectories.has(segment.toLowerCase()),
    ) ||
    forbiddenArtifactExtensions.has(extension(filename).toLowerCase()) ||
    forbiddenArtifactFilename.test(filename)
  );
}

function findRouteViolations(root) {
  const manifest = resolve(root, routeManifestPath);
  const applicationEntry = resolve(root, applicationEntryPath);

  if (!existsSync(manifest)) {
    return existsSync(applicationEntry)
      ? [
          `${routeManifestPath}: route manifest is required when ${applicationEntryPath} exists`,
        ]
      : [];
  }

  const source = readFileSync(manifest, 'utf8');
  const declaration = source.match(
    /export\s+const\s+publicRoutes\s*=\s*(\[[\s\S]*?\])\s+as\s+const\s*;/,
  );

  if (!declaration) {
    return [
      `${routeManifestPath}: route manifest must export publicRoutes as a const array`,
    ];
  }

  const routes = [...declaration[1].matchAll(/(['"])(\/[^'"]*)\1/g)].map(
    ([, , route]) => route,
  );
  const unexpectedRoutes = routes.filter(
    (route) => !permittedRoutes.includes(route),
  );
  const missingRoutes = permittedRoutes.filter(
    (route) => !routes.includes(route),
  );
  const applicationViolations = findApplicationRouteViolations(
    root,
    applicationEntry,
    routes,
  );

  return [
    ...unexpectedRoutes.map(
      (route) => `${routeManifestPath}: unexpected route ${route}`,
    ),
    ...missingRoutes.map(
      (route) => `${routeManifestPath}: missing approved route ${route}`,
    ),
    ...applicationViolations,
  ];
}

function findApplicationRouteViolations(root, applicationEntry, routes) {
  if (!existsSync(applicationEntry)) {
    return [];
  }

  const source = readFileSync(applicationEntry, 'utf8');
  const importDeclaration =
    /import\s*\{\s*publicRoutes\s*\}\s*from\s*['"]\.\/routes['"]\s*;?/;

  if (!importDeclaration.test(source)) {
    return [
      `${relative(root, applicationEntry)}: App must consume publicRoutes`,
    ];
  }

  const sourceWithoutImport = source.replace(importDeclaration, '');

  if (!/\bpublicRoutes\b/.test(sourceWithoutImport)) {
    return [
      `${relative(root, applicationEntry)}: App must consume publicRoutes`,
    ];
  }

  const directRoutes = findPathnameRouteLiterals(source);

  return directRoutes
    .filter((route) => !routes.includes(route))
    .map(
      (route) =>
        `${relative(root, applicationEntry)}: direct route literal is not declared in publicRoutes: ${route}`,
    );
}

function findPathnameRouteLiterals(source) {
  const pathnameExpressions = ['(?:window\\.)?location\\.pathname'];
  const pathnameAssignment =
    /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:window\.)?location\.pathname\b/g;

  for (const [, variable] of source.matchAll(pathnameAssignment)) {
    pathnameExpressions.push(escapeRegExp(variable));
  }

  return [
    ...new Set(
      pathnameExpressions.flatMap((expression) => [
        ...findComparisonRouteLiterals(source, expression),
        ...findSwitchRouteLiterals(source, expression),
      ]),
    ),
  ];
}

function findComparisonRouteLiterals(source, pathnameExpression) {
  const operator = '(?:===|!==|==|!=)';
  const pathnameFirst = new RegExp(
    `(?:${pathnameExpression})\\s*${operator}\\s*(['"])(\\/[^'"]*)\\1`,
    'g',
  );
  const routeFirst = new RegExp(
    `(['"])(\\/[^'"]*)\\1\\s*${operator}\\s*(?:${pathnameExpression})`,
    'g',
  );

  return [
    ...[...source.matchAll(pathnameFirst)].map(([, , route]) => route),
    ...[...source.matchAll(routeFirst)].map(([, , route]) => route),
  ];
}

function findSwitchRouteLiterals(source, pathnameExpression) {
  const switchStatement = new RegExp(
    `switch\\s*\\(\\s*(?:${pathnameExpression})\\s*\\)\\s*\\{([\\s\\S]*?)\\}`,
    'g',
  );
  const caseLiteral = /case\s*(['"])(\/[^'"]*)\1\s*:/g;

  return [...source.matchAll(switchStatement)].flatMap(([, body]) =>
    [...body.matchAll(caseLiteral)].map(([, , route]) => route),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findViolations(root) {
  const violations = [];

  for (const file of listFiles(root)) {
    const path = relative(root, file).split(sep).join('/');

    if (ignoredFiles.has(path)) {
      continue;
    }

    if (hasForbiddenArtifactPath(path)) {
      violations.push(`${path}: forbidden artifact path`);
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

  return [...findRouteViolations(root), ...violations];
}

export function auditRepository(root = repositoryRoot) {
  const violations = findViolations(root);

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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const ownedRoots = ['src/design-system', 'src/prototypes', 'prototypes'];
const tokenFile = resolve(root, 'src/design-system/tokens.css');
const provenanceMarkers = [
  new RegExp(['design', '-system', '.html'].join(''), 'i'),
  new RegExp(['prototypes', '-furni'].join(''), 'i'),
  new RegExp(['file', ':', '/', '/'].join(''), 'i'),
  new RegExp('[A-Za-z]:' + '\\\\'),
];
const sourceExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.mjs']);
const violations = [];

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

function addViolation(file, message, match) {
  const line = readFileSync(file, 'utf8')
    .slice(0, match.index)
    .split('\n').length;
  violations.push(`${relative(root, file)}:${line} ${message}`);
}

const rules = [
  {
    message: 'raw color literal',
    pattern: /#[0-9a-f]{3,8}\b|(?:rgb|hsl|hwb|lab|lch)\(/gi,
  },
  {
    message: 'non-token border radius',
    pattern: /border-radius\s*:\s*(?!var\(--ev-ds-radius-)(?!0\b)[^;]+/gi,
  },
  {
    message: 'non-token box shadow',
    pattern: /box-shadow\s*:\s*(?!var\(--ev-ds-shadow-)(?!none\b)[^;]+/gi,
  },
  {
    message: 'non-token font family',
    pattern: /font-family\s*:\s*(?!var\(--ev-ds-font-)(?!inherit\b)[^;]+/gi,
  },
  {
    message: 'non-token transition value',
    pattern: /transition\s*:\s*(?!none\b)(?![^;]*var\(--ev-ds-motion-)[^;]+/gi,
  },
  {
    message: 'non-token animation value',
    pattern:
      /animation(?:-duration|-timing-function)?\s*:\s*(?!none\b)(?![^;]*var\(--ev-ds-motion-)[^;]+/gi,
  },
];

for (const rootPath of ownedRoots.map((path) => resolve(root, path))) {
  if (!existsSync(rootPath)) continue;
  for (const file of filesUnder(rootPath)) {
    const content = readFileSync(file, 'utf8');
    if (file === tokenFile) continue;
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(content);
      if (match) addViolation(file, rule.message, match);
    }
    for (const marker of provenanceMarkers) {
      const match = marker.exec(content);
      if (match)
        addViolation(file, 'forbidden provenance or absolute path', match);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Design-system audit passed.');
}

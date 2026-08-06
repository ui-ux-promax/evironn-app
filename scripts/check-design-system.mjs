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

function firstNonTokenDeclaration(
  content,
  property,
  tokenName,
  mode = 'starts',
) {
  const declarationPattern = new RegExp(`${property}\\s*:\\s*([^;}]*)`, 'gi');
  for (const match of content.matchAll(declarationPattern)) {
    const value = match[1].trim();
    const usesToken =
      mode === 'contains'
        ? value.includes(`var(${tokenName}`)
        : value.startsWith(`var(${tokenName}`);
    if (value === 'none' || value === 'inherit' || value === '0' || usesToken)
      continue;
    return match;
  }
  return null;
}

const rules = [
  {
    message: 'raw color literal',
    find: (content) =>
      content.match(
        /#[0-9a-f]{3,8}\b|(?:rgb|hwb|lab|lch)\(|hsl\((?!var\(--ev-ds-)/gi,
      ),
  },
  {
    message: 'non-token border radius',
    find: (content) =>
      firstNonTokenDeclaration(content, 'border-radius', '--ev-ds-radius-'),
  },
  {
    message: 'non-token box shadow',
    find: (content) =>
      firstNonTokenDeclaration(content, 'box-shadow', '--ev-ds-shadow-'),
  },
  {
    message: 'non-token font family',
    find: (content) =>
      firstNonTokenDeclaration(content, 'font-family', '--ev-ds-font-'),
  },
  {
    message: 'non-token transition value',
    find: (content) =>
      firstNonTokenDeclaration(
        content,
        'transition',
        '--ev-ds-motion-',
        'contains',
      ),
  },
  {
    message: 'non-token animation value',
    find: (content) =>
      firstNonTokenDeclaration(
        content,
        'animation',
        '--ev-ds-motion-',
        'contains',
      ) ??
      firstNonTokenDeclaration(
        content,
        'animation-duration',
        '--ev-ds-motion-',
        'contains',
      ) ??
      firstNonTokenDeclaration(
        content,
        'animation-timing-function',
        '--ev-ds-motion-',
        'contains',
      ),
  },
];

for (const rootPath of ownedRoots.map((path) => resolve(root, path))) {
  if (!existsSync(rootPath)) continue;
  for (const file of filesUnder(rootPath)) {
    const content = readFileSync(file, 'utf8');
    if (file === tokenFile) continue;
    for (const rule of rules) {
      const match = rule.find(content);
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

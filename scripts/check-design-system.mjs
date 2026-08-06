import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const ownedRoots = ['src/design-system', 'src/prototypes', 'prototypes'];
const sourceExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.mjs']);
const allowedColorValues = new Set([
  'currentcolor',
  'inherit',
  'initial',
  'none',
  'transparent',
  'unset',
]);
const cssNamedColors = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
  blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
  crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
  darkmagenta darkolivegreen darkorange dark orchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
  gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
  lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
  lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine
  mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy
  oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise
  palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise
  violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/),
);
const provenanceMarkers = [
  new RegExp(['design', '-system', '.html'].join(''), 'i'),
  new RegExp(['prototypes', '-furni'].join(''), 'i'),
  new RegExp(['file', ':', '/', '/'].join(''), 'i'),
  new RegExp('[A-Za-z]' + ':' + '\\\\'),
];

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
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
    if (
      value === 'none' ||
      value === 'inherit' ||
      value === 'initial' ||
      value === 'unset' ||
      usesToken
    ) {
      continue;
    }
    return match;
  }
  return null;
}

function firstNonTokenColorDeclaration(content) {
  const declarationPattern =
    /(?:^|[;{])\s*(color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-color)?|fill|stroke)\s*:\s*([^;}]*)/gi;
  for (const match of content.matchAll(declarationPattern)) {
    const value = match[2].trim();
    const lowerValue = value.toLowerCase();
    if (
      allowedColorValues.has(lowerValue) ||
      lowerValue.includes('var(--ev-ds-color-')
    ) {
      continue;
    }
    if (
      /#[0-9a-f]{3,8}\b|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklch|oklab|color)\(/i.test(
        value,
      ) ||
      [...cssNamedColors].some((name) =>
        new RegExp(`\\b${name}\\b`, 'i').test(value),
      )
    ) {
      return match;
    }
  }
  return null;
}

function firstNonTokenMotionDeclaration(content, property) {
  const declarationPattern = new RegExp(`${property}\\s*:\\s*([^;}]*)`, 'gi');
  for (const match of content.matchAll(declarationPattern)) {
    const value = match[1].trim();
    if (
      value === 'none' ||
      value === 'inherit' ||
      value === 'initial' ||
      value === 'unset'
    ) {
      continue;
    }
    if (
      /\b\d*\.?\d+(?:ms|s)\b/i.test(value) ||
      !value.includes('var(--ev-ds-motion-')
    ) {
      return match;
    }
  }
  return null;
}

function firstRawInlineVisualValue(content) {
  const inlinePattern =
    /(?:color|backgroundColor|borderColor|outlineColor|fill|stroke|borderRadius|boxShadow|fontFamily|transition(?:Duration|Delay|TimingFunction)?|animation(?:Name|Duration|Delay|TimingFunction)?)\s*:\s*(['"`])([^'"`]*)\1/gi;
  for (const match of content.matchAll(inlinePattern)) {
    const styleContext = content.slice(
      Math.max(0, match.index - 160),
      match.index,
    );
    if (!/\bstyle\s*=\s*\{\{?[^{}]*$/i.test(styleContext)) continue;
    const value = match[2].trim();
    const lowerValue = value.toLowerCase();
    if (
      lowerValue.includes('var(--ev-ds-') ||
      allowedColorValues.has(lowerValue)
    ) {
      continue;
    }
    return match;
  }
  return null;
}

function addViolation(violations, root, file, message, match) {
  const line = readFileSync(file, 'utf8')
    .slice(0, match.index)
    .split('\n').length;
  violations.push(`${relative(root, file)}:${line} ${message}`);
}

export function auditDesignSystem(projectRoot = process.cwd()) {
  const root = resolve(projectRoot);
  const tokenFile = resolve(root, 'src/design-system/tokens.css');
  const violations = [];
  const rules = [
    {
      message: 'raw inline visual value',
      find: firstRawInlineVisualValue,
    },
    {
      message: 'raw color literal',
      find: firstNonTokenColorDeclaration,
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
      message: 'non-token font shorthand',
      find: (content) =>
        firstNonTokenDeclaration(content, 'font', '--ev-ds-font-', 'contains'),
    },
    ...[
      'transition',
      'transition-duration',
      'transition-delay',
      'transition-timing-function',
      'animation',
      'animation-duration',
      'animation-delay',
      'animation-timing-function',
      'animation-name',
    ].map((property) => ({
      message: `non-token ${property} value`,
      find: (content) => firstNonTokenMotionDeclaration(content, property),
    })),
    ...['font-size', 'font-weight', 'line-height', 'letter-spacing'].map(
      (property) => ({
        message: `non-token ${property} value`,
        find: (content) =>
          firstNonTokenDeclaration(content, property, '--ev-ds-', 'contains'),
      }),
    ),
  ];

  for (const rootPath of ownedRoots.map((path) => resolve(root, path))) {
    if (!existsSync(rootPath)) continue;
    for (const file of filesUnder(rootPath)) {
      const content = readFileSync(file, 'utf8');
      if (file === tokenFile) continue;
      for (const rule of rules) {
        const match = rule.find(content);
        if (match) addViolation(violations, root, file, rule.message, match);
      }
      for (const marker of provenanceMarkers) {
        const match = marker.exec(content);
        if (match)
          addViolation(
            violations,
            root,
            file,
            'forbidden provenance or absolute path',
            match,
          );
      }
      const forbiddenRouteMarker = new RegExp('/' + 'demo-admin', 'i');
      const routeMatch = forbiddenRouteMarker.exec(content);
      if (routeMatch)
        addViolation(
          violations,
          root,
          file,
          'forbidden route marker',
          routeMatch,
        );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      ['Design-system audit failed:', violations.join('\n')].join('\n'),
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  auditDesignSystem();
  console.log('Design-system audit passed.');
}

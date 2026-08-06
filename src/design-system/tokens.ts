export const designSystemTokens = {
  color: [
    '--ev-ds-color-bg',
    '--ev-ds-color-surface',
    '--ev-ds-color-surface-soft',
    '--ev-ds-color-text',
    '--ev-ds-color-text-muted',
    '--ev-ds-color-primary',
    '--ev-ds-color-primary-foreground',
    '--ev-ds-color-accent',
    '--ev-ds-color-accent-foreground',
    '--ev-ds-color-warm-accent',
    '--ev-ds-color-warm-accent-foreground',
    '--ev-ds-color-border',
    '--ev-ds-color-danger',
    '--ev-ds-color-success',
    '--ev-ds-color-warning',
    '--ev-ds-color-info',
    '--ev-ds-color-footer',
  ],
  radius: [
    '--ev-ds-radius-sm',
    '--ev-ds-radius-md',
    '--ev-ds-radius-lg',
    '--ev-ds-radius-pill',
  ],
  spacing: [
    '--ev-ds-space-2',
    '--ev-ds-space-3',
    '--ev-ds-space-4',
    '--ev-ds-space-6',
    '--ev-ds-space-8',
    '--ev-ds-space-12',
    '--ev-ds-space-20',
  ],
  shadow: [
    '--ev-ds-shadow-xs',
    '--ev-ds-shadow-sm',
    '--ev-ds-shadow-md',
    '--ev-ds-shadow-lg',
    '--ev-ds-shadow-xl',
    '--ev-ds-shadow-button',
    '--ev-ds-shadow-button-hover',
    '--ev-ds-shadow-outline',
    '--ev-ds-shadow-focus',
  ],
  typography: [
    '--ev-ds-font-display',
    '--ev-ds-font-body',
    '--ev-ds-font-wordmark',
    '--ev-ds-type-label',
    '--ev-ds-type-body',
    '--ev-ds-type-control',
    '--ev-ds-type-title',
    '--ev-ds-weight-medium',
    '--ev-ds-weight-semibold',
    '--ev-ds-weight-bold',
  ],
  motion: [
    '--ev-ds-motion-ease',
    '--ev-ds-motion-fast',
    '--ev-ds-motion-base',
    '--ev-ds-motion-slow',
    '--ev-ds-motion-linear',
    '--ev-ds-motion-reduced',
  ],
  controls: [
    '--ev-ds-control-sm',
    '--ev-ds-control-md',
    '--ev-ds-control-lg',
    '--ev-ds-icon-size',
  ],
  layout: ['--ev-ds-container-width', '--ev-ds-page-gutter'],
} as const;

export const designSystemTokenSource = {
  semantic: 'source token block',
  spacing: 'spacing specimen',
  typography: 'type specimen',
  controls: 'button specimen',
  motion: 'interaction and reduced-motion rules',
  layout: 'approved P0 layout contract',
} as const;

const tokenGroupProvenance = {
  color: 'source token block',
  radius: 'source token block',
  spacing: 'spacing specimen',
  shadow: 'source token block',
  typography: 'type specimen',
  motion: 'interaction and reduced-motion rules',
  controls: 'button specimen',
  layout: 'approved P0 layout contract',
} as const;

export const designSystemTokenProvenance = Object.fromEntries(
  Object.entries(designSystemTokens).flatMap(([group, tokens]) =>
    tokens.map((token) => [
      token,
      tokenGroupProvenance[group as keyof typeof tokenGroupProvenance],
    ]),
  ),
) as Record<string, string>;

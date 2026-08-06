import type { HTMLAttributes, ReactNode } from 'react';

export type CardElement = 'article' | 'div' | 'section';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: CardElement;
  readonly children: ReactNode;
}

export function Card({
  as = 'article',
  className,
  children,
  ...props
}: CardProps) {
  const classes = ['evp-card', className ?? ''].filter(Boolean).join(' ');
  const Element = as;

  return (
    <Element {...props} className={classes}>
      {children}
    </Element>
  );
}

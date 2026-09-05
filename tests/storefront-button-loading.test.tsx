/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/evironn/forms/form-primitives';

afterEach(cleanup);

describe('storefront async action primitives', () => {
  it('keeps Button text beside the design-system spinner while busy', () => {
    render(<Button loading>Сохранить</Button>);
    const button = screen.getByRole('button', { name: 'Сохранить' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveTextContent('Сохранить');
  });

  it('keeps an asChild loading Button as one slotted element', () => {
    expect(() =>
      render(
        <Button asChild loading>
          <a href="/save">Сохранить</a>
        </Button>,
      ),
    ).not.toThrow();
    const link = screen.getByRole('link', { name: 'Сохранить' });
    expect(link).toHaveAttribute('disabled');
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses FadeArc with progress copy in the Evironn submit primitive', () => {
    render(<SubmitButton status="sending" disabled={false} label="Войти" sendingLabel="Входим…" />);
    const button = screen.getByRole('button', { name: 'Входим…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

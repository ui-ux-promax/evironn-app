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

  it('uses FadeArc with progress copy in the Evironn submit primitive', () => {
    render(<SubmitButton status="sending" disabled={false} label="Войти" sendingLabel="Входим…" />);
    const button = screen.getByRole('button', { name: 'Входим…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

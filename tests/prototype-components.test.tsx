import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { PrototypeHeader } from '../src/prototypes/layout/PrototypeHeader';
import { Card } from '../src/prototypes/ui/Card';
import { StatusMessage } from '../src/prototypes/ui/StatusMessage';
import { Button } from '../src/prototypes/ui/Button';
import { TextField } from '../src/prototypes/ui/TextField';

test('loading button exposes disabled state and accessible label', () => {
  const html = renderToStaticMarkup(
    <Button loading aria-label="Add to cart">
      Add to cart
    </Button>,
  );
  expect(html).toContain('disabled');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('Add to cart');
});

test('text field connects label, helper, and error semantics', () => {
  const html = renderToStaticMarkup(
    <TextField id="email" label="Email" error="Enter a valid email" />,
  );
  expect(html).toContain('for="email"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="email-error"');
  expect(html).toContain('id="email-error"');
});

test('prototype header exposes approved navigation and active state', () => {
  const html = renderToStaticMarkup(<PrototypeHeader activePath="/catalog" />);
  expect(html).toContain('href="/catalog"');
  expect(html).toContain('aria-current="page"');
  expect(html).not.toContain('demo-admin');
});

test('prototype shell exposes skip link target', async () => {
  const { PrototypeShell } =
    await import('../src/prototypes/layout/PrototypeShell');
  const html = renderToStaticMarkup(
    <PrototypeShell>
      <p>Content</p>
    </PrototypeShell>,
  );
  expect(html).toContain('href="#prototype-main"');
  expect(html).toContain('id="prototype-main"');
});

test('card and status message preserve semantic structure', () => {
  const card = renderToStaticMarkup(<Card>Furniture</Card>);
  const status = renderToStaticMarkup(
    <StatusMessage kind="error" title="Could not load products" />,
  );
  expect(card).toContain('<article');
  expect(status).toContain('role="alert"');
});

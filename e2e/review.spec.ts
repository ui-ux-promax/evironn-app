import { expect, test } from '@playwright/test';
import { expectNoEnabledReviewSubmission, expectProtectedOrderBoundary, registerAndVerify } from './helpers';

test('verified user without a qualifying purchase has no review submission path', async ({ page }) => {
  await registerAndVerify(page);

  await page.goto('/product/noma-woven-lounge');
  await expectNoEnabledReviewSubmission(page);

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
  await expectProtectedOrderBoundary(page);
});

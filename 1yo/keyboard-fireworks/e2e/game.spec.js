/**
 * Name: Game Browser Tests
 * Description: Covers the key user flows for the toddler keyboard fireworks app in a real browser.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('first interaction arms the stage and hides the launch overlay', async ({ page }) => {
  await expect(page.getByTestId('launch-overlay')).toBeVisible();

  await page.getByTestId('launch-overlay').click();

  await expect(page.getByTestId('game-root')).toHaveAttribute('data-armed', 'true');
  await expect(page.getByTestId('launch-overlay')).toBeHidden();
});

test('regular key presses create visible animated effects', async ({ page }) => {
  await page.getByTestId('launch-overlay').click();
  await page.keyboard.press('a');

  const effects = page.locator('[data-testid="effect"]');
  await expect(effects).toHaveCount(1);
  await expect(effects.first().locator('.effect__label')).toHaveText('A');
});

test('multiple quick key presses stack as concurrent effects', async ({ page }) => {
  await page.getByTestId('launch-overlay').click();

  await page.keyboard.press('a');
  await page.keyboard.press('b');
  await page.keyboard.press('ArrowLeft');

  await expect(page.locator('[data-testid="effect"]')).toHaveCount(3);
});

test('non-F11 keys are prevented while F11 is passed through', async ({ page }) => {
  await page.getByTestId('launch-overlay').click();

  const preventedA = await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });

  const preventedF11 = await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 'F11', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(preventedA).toBe(true);
  expect(preventedF11).toBe(false);
});

test('effects disappear fully after their fade-out completes', async ({ page }) => {
  await page.getByTestId('launch-overlay').click();
  await page.keyboard.press('a');

  const effects = page.locator('[data-testid="effect"]');
  await expect(effects).toHaveCount(1);

  await page.waitForTimeout(4200);
  await expect(effects).toHaveCount(0);
});
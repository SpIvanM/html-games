import { test, expect } from '@playwright/test';

test.describe('Bubble Pop Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should disable context menu on right click', async ({ page }) => {
    // We can evaluate whether the event was prevented
    const isPrevented = await page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener('contextmenu', (e) => {
          resolve(e.defaultPrevented);
        }, { once: true });
        
        // Trigger right click
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          button: 2
        });
        document.dispatchEvent(event);
      });
    });

    expect(isPrevented).toBe(true);
  });

  test('should render the game container', async ({ page }) => {
    const container = page.locator('#game-container');
    await expect(container).toBeVisible();
  });
});

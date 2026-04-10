/**
 * Name: Playwright Configuration
 * Description: Runs browser-level checks against the toddler keyboard fireworks app. Usage: `npm run test:e2e`. Behavior: starts the local static server, opens Chromium, and executes end-to-end tests in `e2e/`.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: 'node server.mjs 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120000
  }
});
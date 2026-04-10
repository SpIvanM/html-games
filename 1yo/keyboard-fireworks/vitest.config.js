/**
 * Name: Vitest Configuration
 * Description: Configures unit tests and coverage thresholds for the toddler keyboard fireworks app. Usage: `npm run test:unit` or `npm run test:coverage`. Behavior: runs source-level tests under Node and jsdom, and enforces 80 percent minimum coverage across browser app modules.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environmentMatchGlobs: [['tests/unit/browser/**/*.test.js', 'jsdom']],
    coverage: {
      all: true,
      include: ['src/**/*.js'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
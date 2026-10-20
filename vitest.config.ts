import { defineConfig } from 'vitest/config';

// Vitest only runs the Pact contract tests; the API suites stay on the Playwright runner.
export default defineConfig({
  test: {
    include: ['contract/**/*.pact.test.ts'],
    testTimeout: 60_000,
  },
});

import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const ENV = process.env.ENV ?? 'dev';

const baseURLMap: Record<string, string> = {
  dev: 'https://jsonplaceholder.typicode.com',
  // staging: 'https://your-staging-api.example.com',
  // prod:    'https://your-prod-api.example.com',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: baseURLMap[ENV],
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${process.env.API_TOKEN}`,  // uncomment when auth is needed
    },
  },
});

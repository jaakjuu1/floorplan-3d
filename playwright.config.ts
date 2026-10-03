import { defineConfig } from '@playwright/test';

const port = 4179;
const phase = process.env.E2E_PHASE ?? 'integrated';
const server = process.env.E2E_SERVER ?? (phase === 'baseline'
  ? 'node tools/serve-static.mjs'
  : `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const launchOptions = executablePath ? { executablePath } : { channel: 'msedge' as const };

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tmp/playwright-results',
  reporter: 'list',
  // Shared CI runners render WebGL in software; avoid competing 3D sessions.
  workers: process.env.CI ? 1 : 2,
  timeout: process.env.CI ? 300_000 : 120_000,
  expect: { timeout: 15_000 },
  use: { baseURL, browserName: 'chromium', launchOptions, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: server,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});

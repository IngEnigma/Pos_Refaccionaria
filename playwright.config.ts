import { defineConfig, devices } from '@playwright/test';

/**
 * FrontTRT - Configuración E2E / Sistema / A11y
 * Web (ng serve) + listo para Electron.
 * Docs: docs/plan-pruebas.md, docs/casos-sistema.md
 */
export default defineConfig({
  testDir: './e2e',
  // Render gratuito tarda 30-60s en despertar (cold-start): timeouts holgados.
  timeout: 90 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    // Descomentar para Allure: necesita `allure-commandline`
    // ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20 * 1000,
    navigationTimeout: 60 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomentar cuando se requiera matriz completa:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  // Levanta Angular automáticamente al correr `npm run e2e`
  webServer: {
    command: 'npx ng serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 180 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

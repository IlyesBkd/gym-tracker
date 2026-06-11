import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5199',
    headless: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    screenshot: 'on',
    trace: 'on',
  },
  reporter: [['html', { outputFolder: 'test-report', open: 'never' }]],
  webServer: {
    command: 'npx vite --port 5199',
    port: 5199,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { browserName: 'chromium' },
    },
  ],
})

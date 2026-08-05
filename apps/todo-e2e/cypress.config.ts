import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename),
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1440,
    viewportHeight: 900,
  },
});

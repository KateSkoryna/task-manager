// ***********************************************************
// This support file is processed and loaded automatically
// before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';
import { registeredTestUsers } from './commands';

// Cleans up every user `cy.registerTestUser` registered during the test,
// so individual specs don't need their own `let createdUser` / afterEach
// boilerplate.
afterEach(() => {
  while (registeredTestUsers.length) {
    const user = registeredTestUsers.pop();
    if (user) cy.task('cleanupAuthenticatedSmoke', user);
  }
});

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable<_Subject> {
    /**
     * Registers a throwaway user through the real registration UI and
     * lands on the authenticated shell. When `aiConsent` is set, also
     * enables AI assistance in Settings — several flows (quick-capture
     * enrichment, the chat agent) 403 without it. Yields `{ email,
     * password, uniqueId }` so callers that need to log back in (or want a
     * unique suffix for further naming) can use them.
     *
     * A new user gets the first-run tour, whose overlay blocks clicks, so
     * it is skipped unless `skipTour` is false.
     *
     * The registered user is tracked automatically and cleaned up by a
     * single global `afterEach` in `support/e2e.ts` — specs using this
     * command don't need their own `let createdUser` / cleanup boilerplate.
     */
    registerTestUser(options?: {
      namePrefix?: string;
      aiConsent?: boolean;
      skipTour?: boolean;
    }): Chainable<{ email: string; password: string; uniqueId: number }>;
  }
}

export interface RegisteredTestUser {
  userId: string;
  firebaseUid: string;
}

/**
 * Users registered via `cy.registerTestUser` in the currently running
 * test, drained and cleaned up by the global `afterEach` in
 * `support/e2e.ts`.
 */
export const registeredTestUsers: RegisteredTestUser[] = [];

const TEST_PASSWORD = 'Baseline123!';

Cypress.Commands.add(
  'registerTestUser',
  ({ namePrefix = 'test-user', aiConsent = false, skipTour = true } = {}) => {
    const uniqueId = Date.now();
    const email = `${namePrefix}-${uniqueId}@example.com`;

    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/register');

    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="username"]').type(`${namePrefix}-${uniqueId}`);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(TEST_PASSWORD);
    cy.get('input[name="confirmPassword"]').type(TEST_PASSWORD);
    cy.get('#agreeToTerms').check();
    cy.contains('button', 'Register').click();

    cy.wait('@provisionUser').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      registeredTestUsers.push({
        userId: response?.body.id,
        firebaseUid: response?.body.firebaseUid,
      });
    });
    cy.location('pathname').should('eq', '/');

    if (skipTour) {
      cy.get('.driver-popover-close-btn').click();
      cy.get('.driver-popover').should('not.exist');
    }

    if (aiConsent) {
      cy.contains('a', 'Settings').click();
      cy.get('#settings-ai-consent').check();
      cy.get('[data-testid="settings-save-button"]').click();
      cy.get('[data-testid="settings-saved-message"]').should('be.visible');
    }

    return cy.wrap(
      { email, password: TEST_PASSWORD, uniqueId },
      { log: false }
    );
  }
);

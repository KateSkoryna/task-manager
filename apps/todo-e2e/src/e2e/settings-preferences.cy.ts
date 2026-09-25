describe('Settings and preferences', () => {
  let createdUser: { userId: string; firebaseUid: string } | undefined;

  afterEach(() => {
    if (createdUser) {
      cy.task('cleanupAuthenticatedSmoke', createdUser);
      createdUser = undefined;
    }
  });

  it('persists theme, AI consent, timezone, and report cadence across a reload', () => {
    const uniqueId = Date.now();
    const email = `settings-prefs-${uniqueId}@example.com`;

    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/register');

    cy.get('input[name="firstName"]').type('Settings');
    cy.get('input[name="lastName"]').type('Prefs');
    cy.get('input[name="username"]').type(`settings-prefs-${uniqueId}`);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('Baseline123!');
    cy.get('input[name="confirmPassword"]').type('Baseline123!');
    cy.get('#agreeToTerms').check();
    cy.contains('button', 'Register').click();

    cy.wait('@provisionUser').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdUser = {
        userId: response?.body.id,
        firebaseUid: response?.body.firebaseUid,
      };
    });
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);

    cy.contains('a', 'Settings').click();
    cy.url().should('include', '/settings');

    // Theme is applied and persisted purely client-side (localStorage +
    // a <html data-theme> attribute, see useTheme.ts) — no Save button,
    // and no server round trip like the fields below.
    cy.get('[role="radiogroup"][aria-label="Theme"]')
      .contains('button', 'Dark')
      .click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // The remaining three fields live in one server-persisted form, saved
    // together with a single Save click.
    cy.get('#settings-ai-consent').check();

    cy.get('[data-testid="settings-timezone"]').clear();
    cy.get('[data-testid="settings-timezone"]').type('Asia/Tokyo');
    cy.contains('li button', 'Asia/Tokyo').click();

    cy.get('[data-testid="settings-cadence"]').click();
    cy.contains('button', 'Weekly').click();

    cy.get('[data-testid="settings-save-button"]').click();
    cy.get('[data-testid="settings-saved-message"]').should('be.visible');

    // Reload-then-reassert is the only way to tell "updated optimistically"
    // apart from "actually persisted server-side" — the whole point of
    // this step.
    cy.reload();

    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.get('[role="radiogroup"][aria-label="Theme"]')
      .contains('button', 'Dark')
      .should('have.attr', 'aria-checked', 'true');
    cy.get('#settings-ai-consent').should('be.checked');
    cy.get('[data-testid="settings-timezone"]').should(
      'have.value',
      'Asia/Tokyo'
    );
    cy.get('[data-testid="settings-cadence"]').should('contain.text', 'Weekly');
  });
});

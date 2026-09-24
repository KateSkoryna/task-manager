describe('Inbox quick capture', () => {
  let createdUser: { userId: string; firebaseUid: string } | undefined;

  afterEach(() => {
    if (createdUser) {
      cy.task('cleanupAuthenticatedSmoke', createdUser);
      createdUser = undefined;
    }
  });

  /**
   * Registers a throwaway user, then enables AI consent through the real
   * Settings UI — quick-capture enrichment (POST /parse-todo) 403s without
   * it, same gate the chat agent uses.
   */
  const registerUserWithAiConsent = (uniqueId: number) => {
    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/register');

    cy.get('input[name="firstName"]').type('Inbox');
    cy.get('input[name="lastName"]').type('Capture');
    cy.get('input[name="username"]').type(`inbox-capture-${uniqueId}`);
    cy.get('input[name="email"]').type(`inbox-capture-${uniqueId}@example.com`);
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
    cy.get('#settings-ai-consent').check();
    cy.get('[data-testid="settings-save-button"]').click();
    cy.get('[data-testid="settings-saved-message"]').should('be.visible');
  };

  it('captures a quick task into the inbox', () => {
    const uniqueId = Date.now();
    const taskName = `Quick capture ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(taskName);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  });

  it('shows the enrichment notice after AI parsing and undo restores the original text', () => {
    const uniqueId = Date.now();
    const rawText = `renew passport friday high priority ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(rawText);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    // The task is created immediately with the raw text (already covered by
    // the "captures a quick task" case above), then enriched by a real AI
    // parse call in the background — this can take a few seconds, hence the
    // generous timeout. Not asserting the pre-enrichment raw text here: a
    // fast-resolving parse call can rewrite it before a default-timeout
    // assertion ever observes it, since the enriched name (e.g. "renew
    // passport") no longer contains the raw text's unique id suffix.
    cy.get('[data-testid="inbox-enrichment-notice"]', { timeout: 20000 })
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid="inbox-enrichment-undo"]').click();
      });

    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', rawText)
      .should('be.visible');
    cy.get('[data-testid="inbox-enrichment-notice"]').should('not.exist');
  });

  it('moves a captured task out of the inbox into a list', () => {
    const uniqueId = Date.now();
    const taskName = `Move me ${uniqueId}`;
    const listName = `Capture Target ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(taskName);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    cy.contains('button', 'New List').click();
    cy.get('[data-testid="todolist-form-input"]').type(listName);
    cy.get('[data-testid="todolist-form-submit-button"]').click();
    cy.contains('[data-testid="todolist-title"]', listName).should(
      'be.visible'
    );

    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .as('capturedTask');

    cy.get('@capturedTask').find('[aria-label="Move to list"]').click();
    cy.contains('button', listName).click();

    cy.get('[data-testid="inbox-section"]').should('not.contain', taskName);
    cy.contains('[data-testid="todolist-title"]', listName)
      .parents('div[data-testid^="todolist-item-"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  });
});

describe('Authenticated todo smoke flow', () => {
  let createdUser: { userId: string; firebaseUid: string } | undefined;

  afterEach(() => {
    if (createdUser) {
      cy.task('cleanupAuthenticatedSmoke', createdUser);
    }
  });

  it('registers and completes the primary todo CRUD path', () => {
    const uniqueId = Date.now();
    const email = `phase-zero-${uniqueId}@example.com`;
    const listName = `Smoke List ${uniqueId}`;
    const todoName = `Smoke Todo ${uniqueId}`;

    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/login');
    cy.contains('a', 'Create One').click();

    cy.get('input[name="firstName"]').type('Phase');
    cy.get('input[name="lastName"]').type('Zero');
    cy.get('input[name="username"]').type(`phase-zero-${uniqueId}`);
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
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.contains('button', 'New List').click();
    cy.get('[data-testid="todolist-form-input"]').type(listName);
    cy.get('[data-testid="todolist-form-submit-button"]').click();

    cy.contains('[data-testid="todolist-title"]', listName)
      .should('be.visible')
      .parents('div[data-testid^="todolist-item-"]')
      .as('createdList');

    cy.get('@createdList').within(() => {
      cy.contains('button', 'Add Task').click();
      cy.get('[data-testid="todo-form-input"]').type(todoName);
      cy.get('[data-testid="todo-form-submit-button"]').click();
      cy.contains('div[data-testid^="todo-item-"]', todoName).should(
        'be.visible'
      );
    });

    cy.get('@createdList')
      .contains('div[data-testid^="todo-item-"]', todoName)
      .click();
    cy.get('button[aria-label="Edit task"]').last().click();
    const statusSummary = 'summary[data-testid^="edit-todo-status-"]';
    cy.get(statusSummary).focus();
    cy.get(statusSummary).should('have.focus');
    cy.get(statusSummary).type('{enter}');
    cy.contains('button', 'Completed').should('be.visible');
    cy.contains('button', 'Completed').focus();
    cy.contains('button', 'Completed').should('have.focus');
    cy.contains('button', 'Completed').type('{enter}');
    cy.get('button[data-testid^="save-todo-edit-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', todoName).should(
      'contain.text',
      'Completed'
    );

    cy.get('button[aria-label="Delete task"]').click();
    cy.contains('div[data-testid^="todo-item-"]', todoName).should('not.exist');

    cy.contains('[data-testid="todolist-title"]', listName)
      .parents('div[data-testid^="todolist-item-"]')
      .find('button[aria-label="Delete list"]')
      .click();
    cy.contains('[data-testid="todolist-title"]', listName).should('not.exist');
  });
});

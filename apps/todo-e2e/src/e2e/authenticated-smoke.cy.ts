describe('Authenticated todo smoke flow', () => {
  it('registers and completes the primary todo CRUD path', () => {
    const todoName = `Smoke Todo ${Date.now()}`;

    cy.visit('/login');
    cy.contains('a', 'Create One').click();
    cy.url().should('include', '/register');
    cy.registerTestUser({ namePrefix: 'phase-zero', aiConsent: true });

    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(todoName);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    const todoCard = () =>
      cy
        .get('[data-testid="flat-task-list"]')
        .contains('div[data-testid^="todo-item-"]', todoName);
    todoCard().should('be.visible');

    // The round check on the card completes the task without opening it.
    todoCard().find('[role="checkbox"]').click();
    todoCard()
      .find('[role="checkbox"]')
      .should('have.attr', 'aria-checked', 'true');
    todoCard().find('[role="checkbox"]').click();

    todoCard().click();
    cy.get('button[data-testid^="edit-todo-button-"]').click();
    const statusSummary = 'summary[data-testid^="edit-todo-status-"]';
    // <summary> is on neither Cypress's focusable nor typeable allowlists,
    // even though real browsers support keyboard operation of it — a click
    // reliably triggers the native <details> toggle instead. The
    // "Completed" option below is a real <button>, which Cypress's
    // focus/type fully support, so keyboard interaction is still exercised
    // there.
    cy.get(statusSummary).click();
    cy.contains('button', 'Completed').should('be.visible').click();
    cy.get('button[data-testid^="save-todo-edit-button-"]').click();
    todoCard()
      .find('[role="checkbox"]')
      .should('have.attr', 'aria-checked', 'true');

    cy.get('[data-testid^="task-actions-"]').click();
    cy.get('button[data-testid^="delete-todo-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', todoName).should('not.exist');
  });
});

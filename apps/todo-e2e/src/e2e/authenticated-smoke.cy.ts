describe('Authenticated todo smoke flow', () => {
  it('registers and completes the primary todo CRUD path', () => {
    const listName = `Smoke List ${Date.now()}`;
    const todoName = `Smoke Todo ${Date.now()}`;

    cy.visit('/login');
    cy.contains('a', 'Create One').click();
    cy.url().should('include', '/register');
    cy.registerTestUser({ namePrefix: 'phase-zero' });

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
      // A new list has no tasks, so it starts collapsed; the header "+"
      // expands it and opens the form.
      cy.get('button[aria-label="Add Task"]').click();
      cy.get('[data-testid="todo-form-input"]').type(todoName);
      cy.get('[data-testid="todo-form-submit-button"]').click();
      cy.contains('div[data-testid^="todo-item-"]', todoName).should(
        'be.visible'
      );
    });

    cy.get('@createdList')
      .contains('div[data-testid^="todo-item-"]', todoName)
      .click();
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
    cy.contains('div[data-testid^="todo-item-"]', todoName).should(
      'contain.text',
      'Completed'
    );

    cy.get('button[data-testid^="delete-todo-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', todoName).should('not.exist');

    cy.contains('[data-testid="todolist-title"]', listName)
      .parents('div[data-testid^="todolist-item-"]')
      .find('button[aria-label="Delete list"]')
      .click();
    cy.contains('[data-testid="todolist-title"]', listName).should('not.exist');
  });
});

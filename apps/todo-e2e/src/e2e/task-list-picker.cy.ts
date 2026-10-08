describe('Task list picker', () => {
  it('moves an Inbox task into a new list from the edit panel', () => {
    const uniqueId = Date.now();
    const taskName = `Pick a list ${uniqueId}`;
    const listName = `Picked ${uniqueId}`;

    cy.registerTestUser({ namePrefix: 'list-picker', aiConsent: true });
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(taskName);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();
    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .click();
    cy.get('button[data-testid^="edit-todo-button-"]').click();

    // An Inbox task has no list, so there are no list settings to edit yet.
    cy.get('[data-testid="edit-todo-inbox-note"]').should('be.visible');

    cy.get('summary[data-testid^="edit-todo-list-"]').click();
    cy.contains('button', 'Add list').click();
    cy.get('[data-testid="edit-todo-new-list-dialog"]').within(() => {
      cy.get('[data-testid="todolist-form-input"]').type(listName);
      cy.get('[data-testid="todolist-form-submit-button"]').click();
    });
    cy.get('[data-testid="edit-todo-new-list-dialog"]').should('not.exist');
    cy.get('[data-testid="edit-todo-inbox-note"]').should('not.exist');

    cy.get('button[data-testid^="save-todo-edit-button-"]').click();

    cy.contains('[data-testid="todolist-title"]', listName)
      .parents('div[data-testid^="todolist-item-"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
    cy.get('[data-testid="inbox-section"]').should(
      'not.contain.text',
      taskName
    );
  });
});

describe('Inbox quick capture', () => {
  it('captures a quick task into the inbox', () => {
    const taskName = `Quick capture ${Date.now()}`;

    cy.registerTestUser({ namePrefix: 'inbox-capture', aiConsent: true });
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(taskName);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  });

  it('moves a captured task out of the inbox into a list', () => {
    const uniqueId = Date.now();
    const taskName = `Move me ${uniqueId}`;
    const listName = `Capture Target ${uniqueId}`;

    cy.registerTestUser({ namePrefix: 'inbox-move', aiConsent: true });
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

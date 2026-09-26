describe('Statistics and reports', () => {
  it('generates a report from statistics and views it in the list and detail page', () => {
    const uniqueId = Date.now();
    const listName = `Stats List ${uniqueId}`;
    const doneTaskName = `Done task ${uniqueId}`;
    const pendingTaskName = `Pending task ${uniqueId}`;

    cy.registerTestUser({ namePrefix: 'stats-reports' });

    // Seed a completed and a pending task in the current period, so the
    // report has non-zero, meaningful data to summarize.
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.contains('button', 'New List').click();
    cy.get('[data-testid="todolist-form-input"]').type(listName);
    cy.get('[data-testid="todolist-form-submit-button"]').click();
    cy.contains('[data-testid="todolist-title"]', listName)
      .should('be.visible')
      .parents('div[data-testid^="todolist-item-"]')
      .as('createdList');

    // Statistics counts tasks by due date, not creation date, so each
    // seeded task needs today's date set via the date picker for the
    // current period's completion rate to be non-zero.
    cy.get('@createdList').within(() => {
      cy.contains('button', 'Add Task').click();
      cy.get('[data-testid="todo-form-input"]').type(doneTaskName);
      cy.get('[data-testid="todo-form-toggle-extra"]').click();
      cy.get('#new-todo-due-date').click();
    });
    cy.contains('button', String(new Date().getDate())).click();
    cy.get('@createdList').within(() => {
      cy.get('[data-testid="todo-form-submit-button"]').click();
      cy.contains('button', 'Add Task').click();
      cy.get('[data-testid="todo-form-input"]').type(pendingTaskName);
      cy.get('[data-testid="todo-form-toggle-extra"]').click();
      cy.get('#new-todo-due-date').click();
    });
    cy.contains('button', String(new Date().getDate())).click();
    cy.get('@createdList').within(() => {
      cy.get('[data-testid="todo-form-submit-button"]').click();
    });

    cy.get('@createdList')
      .contains('div[data-testid^="todo-item-"]', doneTaskName)
      .click();
    cy.get('button[data-testid^="edit-todo-button-"]').click();
    cy.get('summary[data-testid^="edit-todo-status-"]').click();
    cy.contains('button', 'Completed').should('be.visible').click();
    cy.get('button[data-testid^="save-todo-edit-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', doneTaskName).should(
      'contain.text',
      'Completed'
    );

    // Statistics: switch to "Week" — Reports defaults to the weekly filter,
    // so generating under the matching period means the new report shows
    // up without an extra period-selector interaction there too.
    cy.contains('a', 'Statistics').click();
    cy.url().should('include', '/statistics');
    cy.contains('button', 'Week').click();

    cy.get('[data-testid="stat-completion-rate"]').should(
      'not.contain.text',
      '—'
    );

    cy.intercept('POST', '**/api/users/*/reports').as('generateReport');
    cy.get('[data-testid="generate-report-button"]').click();
    cy.wait('@generateReport').its('response.statusCode').should('eq', 201);

    cy.contains('a', 'Reports').click();
    cy.url().should('include', '/reports');

    cy.get('[data-testid^="report-row-"]').first().click();
    cy.url().should('match', /\/reports\/.+/);

    cy.get('[data-testid="report-detail-name"]').should('be.visible');
    cy.get('[data-testid="report-completion-ratio"]').should(
      'not.contain.text',
      '—'
    );
    cy.get('[data-testid="report-print-button"]')
      .should('be.visible')
      .and('not.be.disabled');
  });
});

// Matches the whole day number: a plain substring like "8" would also match
// a leading day from the previous month such as "28".
const pickToday = () =>
  cy
    .contains('button', new RegExp(`^\\s*${new Date().getDate()}\\s*$`))
    .click();

describe('Statistics and reports', () => {
  it('generates a report from statistics and views it in the list and detail page', () => {
    const uniqueId = Date.now();
    const doneTaskName = `Done task ${uniqueId}`;
    const pendingTaskName = `Pending task ${uniqueId}`;

    cy.registerTestUser({ namePrefix: 'stats-reports', aiConsent: true });

    // Seed a completed and a pending task in the current period, so the
    // report has non-zero, meaningful data to summarize.
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    // Statistics counts tasks by due date, not creation date, so each
    // seeded task needs today's date set via the date picker for the
    // current period's completion rate to be non-zero.
    const seedTask = (taskName: string) => {
      cy.get('[data-testid="inbox-quick-capture-input"]').type(taskName);
      cy.get('[data-testid="inbox-quick-capture-submit"]').click();
      cy.get('[data-testid="flat-task-list"]')
        .contains('div[data-testid^="todo-item-"]', taskName)
        .click();
      cy.get('button[data-testid^="edit-todo-button-"]').click();
      cy.get('[id^="edit-todo-due-date-"]').click();
      pickToday();
    };

    seedTask(doneTaskName);
    cy.get('summary[data-testid^="edit-todo-status-"]').click();
    cy.contains('button', 'Completed').should('be.visible').click();
    cy.get('button[data-testid^="save-todo-edit-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', doneTaskName)
      .find('[role="checkbox"]')
      .should('have.attr', 'aria-checked', 'true');

    seedTask(pendingTaskName);
    cy.get('button[data-testid^="save-todo-edit-button-"]').click();
    cy.contains('div[data-testid^="todo-item-"]', pendingTaskName).should(
      'be.visible'
    );

    // Statistics: switch to "Week" — Reports starts on its All filter,
    // so the new weekly report shows up without a period-selector interaction.
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

describe('Onboarding tour', () => {
  it('shows once to a new user, can be skipped, and can be replayed', () => {
    cy.intercept('PATCH', '**/preferences').as('savePreferences');
    cy.registerTestUser({ namePrefix: 'tour', skipTour: false });

    cy.get('.driver-popover').should('contain.text', 'This is your Today page');
    cy.get('.driver-popover-next-btn').click();
    cy.get('.driver-popover').should(
      'contain.text',
      'This is where your tasks live'
    );
    cy.get('.driver-popover-close-btn').click();
    cy.get('.driver-popover').should('not.exist');
    cy.wait('@savePreferences')
      .its('request.body')
      .should('deep.equal', { onboardingSeen: true });

    // The "seen" flag is stored on the server, so a reload must not bring it back.
    cy.reload();
    cy.get('[data-testid="today-header"]').should('be.visible');
    cy.get('.driver-popover').should('not.exist');

    cy.contains('a', 'Help').click();
    cy.get('[data-testid="help-replay-tour"]').click();
    cy.location('pathname').should('eq', '/');
    cy.get('.driver-popover').should('contain.text', 'This is your Today page');
  });
});

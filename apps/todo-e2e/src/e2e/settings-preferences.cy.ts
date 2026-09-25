describe('Settings and preferences', () => {
  it('persists theme, AI consent, timezone, and report cadence across a reload', () => {
    cy.registerTestUser({ namePrefix: 'settings-prefs' });

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

// Split out from inbox-quick-capture.cy.ts: this is the one case in that
// original spec that depends on a real Gemini call (POST /parse-todo).
// Kept in its own file, alongside agent-chat.cy.ts, so CI (which has no
// GEMINI_API_KEY, see .github/workflows/ci.yml) can run the rest of Phase
// 16's suite via project.json's e2e-ci target without this one failing —
// run it locally via `npm run test:e2e:agent`.
describe('Inbox quick capture — AI enrichment', () => {
  it('shows the enrichment notice after AI parsing and undo restores the original text', () => {
    const rawText = `renew passport friday high priority ${Date.now()}`;

    cy.registerTestUser({ namePrefix: 'inbox-enrich', aiConsent: true });
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');

    cy.get('[data-testid="inbox-quick-capture-input"]').type(rawText);
    cy.get('[data-testid="inbox-quick-capture-submit"]').click();

    // The task is created immediately with the raw text (already covered by
    // inbox-quick-capture.cy.ts's "captures a quick task" case), then
    // enriched by a real AI parse call in the background — this can take a
    // few seconds, hence the generous timeout. Not asserting the
    // pre-enrichment raw text here: a fast-resolving parse call can rewrite
    // it before a default-timeout assertion ever observes it, since the
    // enriched name (e.g. "renew passport") no longer contains the raw
    // text's unique id suffix.
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
});

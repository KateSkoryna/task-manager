describe('AI chat agent', () => {
  let createdUser: { userId: string; firebaseUid: string } | undefined;

  afterEach(() => {
    if (createdUser) {
      cy.task('cleanupAuthenticatedSmoke', createdUser);
      createdUser = undefined;
    }
  });

  /**
   * Registers a throwaway user and enables AI consent through the real
   * Settings UI — the agent endpoint 403s without it.
   */
  const registerUserWithAiConsent = (uniqueId: number) => {
    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/register');

    cy.get('input[name="firstName"]').type('Agent');
    cy.get('input[name="lastName"]').type('Chat');
    cy.get('input[name="username"]').type(`agent-chat-${uniqueId}`);
    cy.get('input[name="email"]').type(`agent-chat-${uniqueId}@example.com`);
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

    cy.contains('a', 'Settings').click();
    cy.get('#settings-ai-consent').check();
    cy.get('[data-testid="settings-save-button"]').click();
    cy.get('[data-testid="settings-saved-message"]').should('be.visible');
  };

  const openChatPanel = () => {
    cy.get('[data-testid="chat-panel-launcher"]').click();
    cy.get('[data-testid="chat-panel"]').should('be.visible');
  };

  const sendChatMessage = (text: string) => {
    cy.get('[data-testid="chat-composer-input"]').type(text);
    cy.get('[data-testid="chat-composer-send"]').click();
  };

  /**
   * Seeds an Inbox task via the plain (non-AI) add-task form rather than
   * quick capture — quick capture's background AI-parse call can rename the
   * task (Step 16.2) before the chat agent's delete-by-name lookup runs,
   * and costs another real Gemini call against the shared quota.
   */
  const seedInboxTask = (taskName: string) => {
    cy.get('[data-testid="inbox-section"]')
      .find('[aria-label="Add Task"]')
      .click();
    cy.get('[data-testid="todo-form-input"]').type(taskName);
    cy.get('[data-testid="todo-form-submit-button"]').click();
    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  };

  it('creates a task through a chat message', () => {
    const uniqueId = Date.now();
    const taskName = `Chat created task ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    openChatPanel();
    sendChatMessage(`Add a task called ${taskName}`);

    // Real Gemini tool-calling round trip — a successful create_tasks call
    // renders a clickable chip with the task's exact name, so this doesn't
    // depend on the model's free-text phrasing.
    cy.get('[data-testid="chat-panel"]').contains('button', taskName, {
      timeout: 30000,
    });

    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');
    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  });

  it('proposes a delete and does not execute it until confirmed', () => {
    const uniqueId = Date.now();
    const taskName = `Kept task ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');
    seedInboxTask(taskName);

    openChatPanel();
    sendChatMessage(`Delete the task called ${taskName}`);

    cy.contains(
      '[data-testid="chat-panel"] [role="group"]',
      'Delete this task?',
      {
        timeout: 30000,
      }
    ).should('be.visible');
    cy.get('[data-testid="chat-proposal-cancel"]').click();
    cy.get('[data-testid="chat-panel"] [role="group"]').should('not.exist');

    cy.visit('/tasks');
    cy.get('[data-testid="inbox-section"]')
      .contains('div[data-testid^="todo-item-"]', taskName)
      .should('be.visible');
  });

  it('deletes a task once the proposal is confirmed', () => {
    const uniqueId = Date.now();
    const taskName = `Deleted task ${uniqueId}`;

    registerUserWithAiConsent(uniqueId);
    cy.contains('a', 'My Tasks').click();
    cy.url().should('include', '/tasks');
    seedInboxTask(taskName);

    // This project's Gemini free tier is capped at 5 requests/minute total
    // (apps/todo-be/src/common/config/throttle.config.ts), and a single
    // chat turn can cost 2 of those (a tool-call decision, then an
    // explanation). The two prior tests in this spec already spend most of
    // that budget within the same rolling window, so this test waits for a
    // fresh window rather than racing a real 429/503 from the shared quota.
    // This is a deliberate wait for an external rate-limit window to pass,
    // not app state — the lint rule's usual concern (masking a real async
    // condition) doesn't apply here.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(60000);

    openChatPanel();
    sendChatMessage(`Delete the task called ${taskName}`);

    cy.contains(
      '[data-testid="chat-panel"] [role="group"]',
      'Delete this task?',
      {
        timeout: 30000,
      }
    ).should('be.visible');
    cy.get('[data-testid="chat-proposal-confirm"]').click();

    // The confirmation round trip is a second full Gemini turn (execute,
    // then explain), so this gets the same generous timeout. Asserting on
    // the tool-result badge specifically (not just any "Deleted task" text
    // in the panel) matters: the badge only renders from a genuine
    // successful tool_result event, whereas the model's own free-text
    // reply could narrate a plausible-sounding "deleted" without actually
    // re-invoking delete_task — a real gap the loose text match wouldn't
    // have caught.
    //
    // Known flaky, confirmed live against gemini-3.5-flash (production):
    // whether the model re-invokes delete_task on the confirm turn is not
    // fully deterministic — it can occasionally respond with confirmatory
    // prose alone. This is a real model-behavior gap, not a bug in the
    // confirmation-gate code (agent-session.service.ts's consumeConfirmation
    // and todo.service.ts's deleteOwned were both manually traced and are
    // correct). A local re-run is expected to pass; see PLAN.md Phase 16
    // Step 16.3 for the investigation.
    cy.get('[data-testid="chat-tool-badge-delete_task"]', {
      timeout: 30000,
    }).should('be.visible');

    cy.visit('/tasks');
    cy.get('[data-testid="inbox-section"]').should('not.contain', taskName);
  });
});

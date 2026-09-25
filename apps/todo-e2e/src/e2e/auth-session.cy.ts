describe('Authenticated session flows', () => {
  it('logs back in with the same credentials after logging out', () => {
    cy.registerTestUser({ namePrefix: 'session-login' }).then(
      ({ email, password }) => {
        cy.contains('button', 'Logout').click();
        cy.url().should('include', '/login');

        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.contains('button', 'Login').click();

        cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
        cy.contains('a', 'My Tasks').should('be.visible');
      }
    );
  });

  it('shows an inline error and stays on /login for a wrong password', () => {
    cy.registerTestUser({ namePrefix: 'session-wrong-password' }).then(
      ({ email }) => {
        cy.contains('button', 'Logout').click();
        cy.url().should('include', '/login');

        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type('DefinitelyWrong456!');
        cy.contains('button', 'Login').click();

        cy.contains('Sign in failed. Check your email or password.').should(
          'be.visible'
        );
        cy.url().should('include', '/login');
      }
    );
  });

  it('reaches the forgot-password page from the login link and submits a reset request', () => {
    // The Auth emulator rejects a reset request for an email with no
    // account (unlike production's enumeration-protected client SDK
    // behavior), so this case needs a real registered user first.
    cy.registerTestUser({ namePrefix: 'session-forgot-password' }).then(
      ({ email }) => {
        cy.contains('button', 'Logout').click();
        cy.url().should('include', '/login');

        cy.contains('a', 'Forgot password?').click();
        cy.url().should('include', '/forgot-password');

        cy.get('input[name="email"]').type(email);
        cy.contains('button', 'Send Reset Link').click();

        cy.contains(
          'If that email exists, a reset link has been sent. Check your inbox.'
        ).should('be.visible');
      }
    );
  });
});

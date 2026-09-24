describe('Authenticated session flows', () => {
  let createdUser: { userId: string; firebaseUid: string } | undefined;

  afterEach(() => {
    if (createdUser) {
      cy.task('cleanupAuthenticatedSmoke', createdUser);
      createdUser = undefined;
    }
  });

  const registerUser = (uniqueId: number, email: string, password: string) => {
    cy.intercept('POST', '**/api/auth/provision').as('provisionUser');
    cy.visit('/register');

    cy.get('input[name="firstName"]').type('Session');
    cy.get('input[name="lastName"]').type('Flow');
    cy.get('input[name="username"]').type(`session-flow-${uniqueId}`);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
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
  };

  it('logs back in with the same credentials after logging out', () => {
    const uniqueId = Date.now();
    const email = `session-login-${uniqueId}@example.com`;
    const password = 'Baseline123!';

    registerUser(uniqueId, email, password);

    cy.contains('button', 'Logout').click();
    cy.url().should('include', '/login');

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.contains('button', 'Login').click();

    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    cy.contains('a', 'My Tasks').should('be.visible');
  });

  it('shows an inline error and stays on /login for a wrong password', () => {
    const uniqueId = Date.now();
    const email = `session-wrong-password-${uniqueId}@example.com`;
    const password = 'Baseline123!';

    registerUser(uniqueId, email, password);

    cy.contains('button', 'Logout').click();
    cy.url().should('include', '/login');

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('DefinitelyWrong456!');
    cy.contains('button', 'Login').click();

    cy.contains('Sign in failed. Check your email or password.').should(
      'be.visible'
    );
    cy.url().should('include', '/login');
  });

  it('reaches the forgot-password page from the login link and submits a reset request', () => {
    const uniqueId = Date.now();
    const email = `session-forgot-password-${uniqueId}@example.com`;
    const password = 'Baseline123!';

    // The Auth emulator rejects a reset request for an email with no
    // account (unlike production's enumeration-protected client SDK
    // behavior), so this case needs a real registered user first.
    registerUser(uniqueId, email, password);
    cy.contains('button', 'Logout').click();
    cy.url().should('include', '/login');

    cy.contains('a', 'Forgot password?').click();
    cy.url().should('include', '/forgot-password');

    cy.get('input[name="email"]').type(email);
    cy.contains('button', 'Send Reset Link').click();

    cy.contains(
      'If that email exists, a reset link has been sent. Check your inbox.'
    ).should('be.visible');
  });
});

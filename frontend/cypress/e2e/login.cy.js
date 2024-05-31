// cypress/e2e/login.spec.js

describe('Login Component', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login'); // Update this path based on your router setup
  });

  // it('logs in as an admin user', () => {
  //   cy.intercept('POST', 'http://localhost:5000/users/login', {
  //     statusCode: 200,
  //     body: {
  //       roles: 'ROLE_ADMIN',
        // token: 'fake-admin-token',
  //       userName: 'adminUser',
  //     },
  //   }).as('adminLogin');

  //   cy.get('input[placeholder="Enter Username"]').type('adminUser');
  //   cy.get('input[placeholder="Enter Password"]').type('adminPassword');
  //   cy.get('button').contains('Log In').click();

  //   cy.wait('@adminLogin');
  //   cy.url().should('include', '/home');
  //   cy.window().its('localStorage.accessToken').should('eq', 'fake-admin-token');
  //   cy.window().its('localStorage.loginId').should('eq', 'adminUser');
  // });

  it('logs in as a regular user', () => {
    cy.intercept('POST', 'http://localhost:5000/users/login', {
      statusCode: 200,
      body: {
        roles: 'ROLE_USER',
        // token: 'fake-user-token',
        userName: 'regularUser',
        id: '123',
      },
    }).as('userLogin');

    cy.get('input[placeholder="Enter Username"]').type('regularUser');
    cy.get('input[placeholder="Enter Password"]').type('userPassword');
    cy.get('button').contains('Log In').click();

    cy.wait('@userLogin');
    cy.url().should('include', '/userHome');
    // cy.window().its('localStorage.accessToken').should('eq', 'fake-user-token');
    // cy.window().its('localStorage.loginId').should('eq', 'regularUser');
  });

  it('shows alert for missing username and password', () => {
    cy.get('button').contains('Log In').click();
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Enter UserName And Password');
    });
  });

  it('shows alert for missing password', () => {
    cy.get('input[placeholder="Enter Username"]').type('testUser');
    cy.get('button').contains('Log In').click();
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Enter Password');
    });
  });

  it('shows alert for missing username', () => {
    cy.get('input[placeholder="Enter Password"]').type('testPassword');
    cy.get('button').contains('Log In').click();
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Enter Username');
    });
  });

  it('shows alert for incorrect username or password', () => {
    cy.intercept('POST', 'http://localhost:5000/users/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('invalidLogin');

    cy.get('input[placeholder="Enter Username"]').type('wrongUser');
    cy.get('input[placeholder="Enter Password"]').type('wrongPassword');
    cy.get('button').contains('Log In').click();

    cy.wait('@invalidLogin');
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Username or Password is Incorrect');
    });
  });

  it('navigates to reset password page', () => {
    cy.get('button').contains('Forgot Password ?').click();
    cy.url().should('include', '/resetPassword');
  });

  it('navigates to create an account page', () => {
    cy.get('button').contains('Create An Account').click();
    cy.url().should('include', '/');
  });
});

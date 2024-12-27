describe('Login Feature', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('should login successfully', () => {
        cy.get('#username').type('testuser');
        cy.get('#password').type('password123');
        cy.contains('Login').click();
        cy.url().should('include', '/dashboard');
    });

    it('should show error for invalid credentials', () => {
        cy.get('#username').type('wronguser');
        cy.get('#password').type('wrongpass');
        cy.contains('Login').click();
        cy.get('.error-message').should('be.visible');
    });
});

import { strict as assert } from 'assert';
import { CypressToPlaywrightConverter } from '../../converters/cypress/to-playwright';
import { PlaywrightToTestRailConverter } from '../../converters/playwright/to-testrail';

describe('Test Converter Unit Tests', () => {
    it('Converts Cypress to Playwright', () => {
        const cypressInput = `
            describe('Login Feature', () => {
                it('should login successfully', () => {
                    cy.visit('/login');
                    cy.get('#username').type('testuser');
                    cy.get('#password').type('password123');
                    cy.get('button[type="submit"]').click();
                });
            });
        `;

        const converter = new CypressToPlaywrightConverter(cypressInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Conversion should succeed');
        assert.ok(result.convertedCode.includes('page.locator'), 'Should contain page.locator calls');
        assert.ok(result.convertedCode.includes('test.describe'), 'Should contain test.describe structure');
    });

    it('Converts Playwright to TestRail', () => {
        const playwrightInput = `
            test.describe('Login Feature', () => {
                test('should login successfully', async ({ page }) => {
                    await page.goto('/login');
                    await page.locator('#username').fill('testuser');
                    await page.locator('#password').fill('password123');
                    await page.locator('button[type="submit"]').click();
                });
            });
        `;

        const converter = new PlaywrightToTestRailConverter(playwrightInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Conversion should succeed');
        assert.ok(result.convertedCode.includes('testCase'), 'Should contain TestRail testCase');
        assert.ok(result.convertedCode.includes('step'), 'Should contain TestRail steps');
    });

    it('Handles unsupported conversions gracefully', () => {
        const unsupportedInput = `
            function example() {
                console.log('This is unsupported');
            }
        `;

        const converter = new CypressToPlaywrightConverter(unsupportedInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Should handle unsupported input gracefully');
        assert.deepStrictEqual(result.convertedCode.trim(), unsupportedInput.trim(), 'Should return input unchanged for unsupported content');
    });

    it('Includes appropriate warnings for complex conversions', () => {
        const complexInput = `
            describe('Complex Test', () => {
                it('uses advanced features', () => {
                    cy.intercept('POST', '/api/data').as('apiCall');
                    cy.wait('@apiCall');
                    cy.fixture('example.json').then((data) => {
                        // Use fixture data
                    });
                });
            });
        `;

        const converter = new CypressToPlaywrightConverter(complexInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.warnings && result.warnings.length > 0, 'Should include warnings for complex conversions');
    });
});

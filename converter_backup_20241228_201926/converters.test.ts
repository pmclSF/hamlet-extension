console.log('Running tests in src/test/suite/converters.test.ts');
import { strict as assert } from 'assert';
import { TestConverter } from '../../converters/converter';

describe('Test Converter Unit Tests', () => {
  const converter = new TestConverter();

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

    const expectedPlaywrightOutput = `
      test.describe('Login Feature', () => {
        it('should login successfully', async ({ page }) => {
          page.goto('/login');
          page.locator('#username').fill('testuser');
          page.locator('#password').fill('password123');
          page.locator('button[type="submit"]').click();
        });
      });
    `;

    const result = converter.convertToPlaywright(cypressInput);
    assert.ok(result.includes('test.describe'), 'Should contain Playwright test.describe');
    assert.ok(result.includes('page.goto'), 'Should contain page.goto calls');
    assert.ok(result.includes('page.locator'), 'Should contain page.locator calls');
  });

  it('Converts Playwright to TestRail', () => {
    const playwrightInput = `
      test.describe('Login Feature', () => {
        it('should login successfully', async ({ page }) => {
          page.goto('/login');
          page.locator('#username').fill('testuser');
          page.locator('#password').fill('password123');
          page.locator('button[type="submit"]').click();
        });
      });
    `;

    const expectedTestRailOutput = `
      describe('Login Feature', () => {
        testCase('should login successfully', () => {
          step('Navigate to login page', () => { /* ... */ });
          step('Enter username', () => { /* ... */ });
          step('Enter password', () => { /* ... */ });
          step('Click login button', () => { /* ... */ });
        });
      });
    `;

    const result = converter.convertToTestRail(playwrightInput);
    assert.ok(result.includes('suite'), 'Should contain TestRail suite');
    assert.ok(result.includes('testCase'), 'Should contain TestRail testCase');
    assert.ok(result.includes('step'), 'Should contain TestRail steps');
  });

  it('Handles unsupported conversions gracefully', () => {
    const unsupportedInput = `
      function example() {
        console.log('This is unsupported');
      }
    `;

    const result = converter.convertToPlaywright(unsupportedInput);
    assert.strictEqual(result, unsupportedInput, 'Should return the input unchanged');
  });
});

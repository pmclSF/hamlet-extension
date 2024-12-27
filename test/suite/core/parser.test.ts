import { describe, it } from 'mocha';
import * as assert from 'assert';
import { TestParser } from '../../../src/parsers/parser';

describe('TestParser', () => {
  describe('detectFramework', () => {
    it('should detect Cypress framework', () => {
      const source = `describe('Test', () => { cy.visit('/'); });`;
      const parser = new TestParser(source);
      assert.strictEqual(parser.detectFramework(), 'cypress');
    });

    it('should detect Playwright framework', () => {
      const source = `test('Test', async ({ page }) => { await page.goto('/'); });`;
      const parser = new TestParser(source);
      assert.strictEqual(parser.detectFramework(), 'playwright');
    });

    it('should detect TestRail framework', () => {
      const source = `test_case('Test', () => {});`;
      const parser = new TestParser(source);
      assert.strictEqual(parser.detectFramework(), 'testrail');
    });
  });

  // Add remaining test content...
});

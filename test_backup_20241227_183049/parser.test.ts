import { suite, test } from 'mocha';
import { strict as assert } from 'assert';
import { TestParser } from '../../parsers/parser';

suite('Parser Tests', () => {
    test('Detects Cypress framework', () => {
        const source = `describe('Cypress Test Suite', () => { it('Cypress Test', () => { cy.visit('/'); }); });`;
        const parser = new TestParser(source);
        const framework = parser.detectFramework();
        assert.strictEqual(framework, 'cypress', 'Should detect Cypress framework');
    });

    test('Detects Playwright framework', () => {
        const source = `import { test } from '@playwright/test'; test('Playwright Test', async ({ page }) => { await page.goto('/'); });`;
        const parser = new TestParser(source);
        const framework = parser.detectFramework();
        assert.strictEqual(framework, 'playwright', 'Should detect Playwright framework');
    });

    test('Parses describe and it blocks for Cypress', () => {
        const source = `
            describe('Cypress Suite', () => {
                it('Cypress Test', () => {
                    cy.visit('/');
                });
            });
        `;
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        assert.strictEqual(blocks.length, 2, 'Should find 1 suite and 1 test block');
        assert.strictEqual(blocks[0].type, 'suite', 'First block should be a suite');
        assert.strictEqual(blocks[1].type, 'test', 'Second block should be a test');
    });

    test('Handles nested blocks correctly', () => {
        const source = `
            describe('Outer Suite', () => {
                describe('Inner Suite', () => {
                    it('Nested Test', () => {});
                });
            });
        `;
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        assert.strictEqual(blocks.length, 3, 'Should find 2 suites and 1 test block');
        assert.strictEqual(blocks[0].type, 'suite', 'First block should be the outer suite');
        assert.strictEqual(blocks[1].type, 'suite', 'Second block should be the inner suite');
        assert.strictEqual(blocks[2].type, 'test', 'Third block should be the test');
    });

    test('Detects unsupported frameworks', () => {
        const source = `console.log('No tests here');`;
        const parser = new TestParser(source);
        const framework = parser.detectFramework();
        assert.strictEqual(framework, null, 'Should return null for unsupported frameworks');
    });
});
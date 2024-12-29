"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log('Running tests in src/test/suite/parser.test.ts');
const mocha_1 = require("mocha");
const assert_1 = require("assert");
const parser_1 = require("../../parsers/parser");
(0, mocha_1.describe)('Parser Tests', () => {
    (0, mocha_1.it)('Detects Cypress framework', () => {
        const source = `describe('Cypress Test Suite', () => { it('Cypress Test', () => { cy.visit('/'); }); });`;
        const parser = new parser_1.TestParser(source);
        const framework = parser.detectFramework();
        assert_1.strict.strictEqual(framework, 'cypress', 'Should detect Cypress framework');
    });
    (0, mocha_1.it)('Detects Playwright framework', () => {
        const source = `import { test } from '@playwright/test'; it('Playwright Test', async ({ page }) => { await page.goto('/'); });`;
        const parser = new parser_1.TestParser(source);
        const framework = parser.detectFramework();
        assert_1.strict.strictEqual(framework, 'playwright', 'Should detect Playwright framework');
    });
    (0, mocha_1.it)('Parses describe and it blocks for Cypress', () => {
        const source = `
            describe('Cypress Suite', () => {
                it('Cypress Test', () => {
                    cy.visit('/');
                });
            });
        `;
        const parser = new parser_1.TestParser(source);
        const blocks = parser.parseBlocks();
        assert_1.strict.strictEqual(blocks.length, 2, 'Should find 1 suite and 1 test block');
        assert_1.strict.strictEqual(blocks[0].type, 'suite', 'First block should be a suite');
        assert_1.strict.strictEqual(blocks[1].type, 'test', 'Second block should be a test');
    });
    (0, mocha_1.it)('Handles nested blocks correctly', () => {
        const source = `
            describe('Outer Suite', () => {
                describe('Inner Suite', () => {
                    it('Nested Test', () => {});
                });
            });
        `;
        const parser = new parser_1.TestParser(source);
        const blocks = parser.parseBlocks();
        assert_1.strict.strictEqual(blocks.length, 3, 'Should find 2 suites and 1 test block');
        assert_1.strict.strictEqual(blocks[0].type, 'suite', 'First block should be the outer suite');
        assert_1.strict.strictEqual(blocks[1].type, 'suite', 'Second block should be the inner suite');
        assert_1.strict.strictEqual(blocks[2].type, 'test', 'Third block should be the test');
    });
    (0, mocha_1.it)('Detects unsupported frameworks', () => {
        const source = `console.log('No tests here');`;
        const parser = new parser_1.TestParser(source);
        const framework = parser.detectFramework();
        assert_1.strict.strictEqual(framework, null, 'Should return null for unsupported frameworks');
    });
});
//# sourceMappingURL=parser.test.js.map
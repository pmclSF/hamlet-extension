"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const converter_1 = require("../../../src/converters/converter");
(0, mocha_1.describe)('Test Converter', () => {
    (0, mocha_1.describe)('Cypress to Playwright', () => {
        (0, mocha_1.it)('should convert basic test structure', () => {
            const cypress = `
                describe('Test Suite', () => {
                    it('should work', () => {
                        cy.visit('/test');
                    });
                });
            `;
            const converter = new converter_1.TestConverter();
            const result = converter.convertToPlaywright(cypress);
            (0, chai_1.expect)(result).to.include('test.describe');
            (0, chai_1.expect)(result).to.include('test(');
            (0, chai_1.expect)(result).to.include('page.goto');
        });
    });
    (0, mocha_1.describe)('Playwright to TestRail', () => {
        (0, mocha_1.it)('should convert basic test structure', () => {
            const playwright = `
                test.describe('Test Suite', () => {
                    test('should work', async ({ page }) => {
                        await page.goto('/test');
                    });
                });
            `;
            const converter = new converter_1.TestConverter();
            const result = converter.convertToTestRail(playwright);
            (0, chai_1.expect)(result).to.include('suite(');
            (0, chai_1.expect)(result).to.include('testCase(');
            (0, chai_1.expect)(result).to.include('step(');
        });
    });
});
//# sourceMappingURL=converter.test.js.map